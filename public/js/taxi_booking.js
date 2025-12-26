// Taxi booking page logic
(function () {
    function initMessageBox() {
        const existing = document.getElementById('message-modal');
        if (!existing || existing.dataset.wired) return;
        existing.dataset.wired = 'true';

        const dialog = existing.querySelector('.msg-dialog');
        const titleEl = document.getElementById('msg-title');
        const bodyEl = document.getElementById('msg-body');
        const okBtn = document.getElementById('msg-ok');
        const closeElements = existing.querySelectorAll('[data-close]');

        const close = () => existing.classList.remove('show');
        closeElements.forEach(el => el.addEventListener('click', close));
        okBtn?.addEventListener('click', close);
        existing.addEventListener('click', (e) => {
            if (e.target.dataset.close === 'true') close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && existing.classList.contains('show')) close();
        });

        window.showMessageBox = (message, { title = 'Message', type = 'info' } = {}) => {
            dialog.classList.remove('info', 'success', 'error');
            dialog.classList.add(type || 'info');
            titleEl.textContent = title;
            bodyEl.textContent = Array.isArray(message) ? message.join('\n') : message;
            existing.classList.add('show');
            okBtn?.focus({ preventScroll: true });
        };
    }

    // Sync selected taxi from sessionStorage (set by services page)
    function hydrateSelection() {
        try {
            const saved = JSON.parse(sessionStorage.getItem('selectedTaxi') || '{}');
            if (!saved || !saved.id) return;
            document.getElementById('selected-taxi-id').value = saved.id;
            document.getElementById('selected-taxi-name').value = saved.name || '';
            document.getElementById('selected-taxi-vehicle').value = saved.vehicleType || '';
            document.getElementById('summary-id').textContent = saved.id || '—';
            document.getElementById('summary-name').textContent = saved.name || 'Selected taxi';
            document.getElementById('summary-vehicle').textContent = saved.vehicleType || 'Vehicle type';
            const hero = document.getElementById('summary-hero');
            if (hero) {
                hero.style.background = saved.image
                    ? `linear-gradient(135deg, rgba(37,99,235,0.78), rgba(124,58,237,0.78)), url('${saved.image}') center/cover no-repeat`
                    : 'linear-gradient(135deg, #2563eb, #7c3aed)';
            }

            const extra = document.getElementById('summary-extra');
            extra?.replaceChildren();
            if (extra && (saved.capacity || saved.pricePerKm || saved.etaMinutes)) {
                const frag = document.createDocumentFragment();
                if (saved.capacity) {
                    const s = document.createElement('span');
                    s.className = 'summary-chip';
                    s.innerHTML = '<i class="fas fa-users"></i>' + `${saved.capacity} seats`;
                    frag.appendChild(s);
                }
                if (saved.pricePerKm) {
                    const s = document.createElement('span');
                    s.className = 'summary-chip';
                    s.innerHTML = '<i class="fas fa-dollar-sign"></i>' + `$${saved.pricePerKm}/km`;
                    frag.appendChild(s);
                }
                if (saved.etaMinutes) {
                    const s = document.createElement('span');
                    s.className = 'summary-chip';
                    s.innerHTML = '<i class="fas fa-stopwatch"></i>' + `ETA ${saved.etaMinutes} min`;
                    frag.appendChild(s);
                }
                extra.appendChild(frag);
            }
            updateSummary();
        } catch (err) {
            console.warn('No taxi selection found', err);
        }
    }

    function updateSummary() {
        const pickup = document.getElementById('pickup-location').value || '—';
        const dest = document.getElementById('destination').value || '—';
        const time = document.getElementById('pickup-time').value || '—';
        const id = document.getElementById('selected-taxi-id').value || '—';
        const name = document.getElementById('selected-taxi-name').value || 'Not selected';
        const vehicle = document.getElementById('selected-taxi-vehicle').value || 'Vehicle type';

        document.getElementById('summary-pickup').textContent = pickup;
        document.getElementById('summary-destination').textContent = dest;
        document.getElementById('summary-time').textContent = time;
        document.getElementById('summary-id').textContent = id;
        document.getElementById('summary-name').textContent = name;
        document.getElementById('summary-vehicle').textContent = vehicle;
    }

    async function orderSelectedTaxi(e) {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showMessageBox('Please login to book a taxi.', { type: 'info', title: 'Login required' });
            window.location.href = 'login.html';
            return;
        }

        const pickup = (document.getElementById('pickup-location').value || '').trim();
        const destination = (document.getElementById('destination').value || '').trim();
        const pickupTime = (document.getElementById('pickup-time').value || '').trim();
        const serviceId = document.getElementById('selected-taxi-id').value;
        const vehicleType = document.getElementById('selected-taxi-vehicle').value || 'standard';

        if (!pickup || !destination || !pickupTime) {
            showMessageBox('Pickup, destination, and pickup time are required.', { type: 'error', title: 'Missing info' });
            return;
        }

        try {
            const response = await fetch('/api/v1/taxis.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': window.__PUBLIC_API_KEY__ || 'demo-api-key'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    pickup_location: pickup,
                    dropoff_location: destination,
                    pickup_time: pickupTime,
                    vehicle_type: vehicleType,
                    schedule: 'scheduled',
                    service_id: serviceId || undefined
                })
            });

            const payload = await response.json().catch(() => ({}));
            if (response.ok) {
                const ride = payload.data || {};
                const conf = ride.confirmation || ride.ride_id || 'pending';
                showMessageBox(`Taxi booked!\n\nPickup: ${pickup}\nDestination: ${destination}\nTime: ${pickupTime}\nConfirmation: ${conf}`, { type: 'success', title: 'Booked' });
                sessionStorage.removeItem('selectedTaxi');
                e.target.reset();
                updateSummary();
            } else {
                showMessageBox(payload?.message || 'Taxi booking failed (provider may not support booking).', { type: 'error', title: 'Booking failed' });
            }
        } catch (err) {
            console.error('Taxi booking error', err);
            showMessageBox('Unable to book taxi right now.', { type: 'error', title: 'Error' });
        }
    }

    function wireSummaryUpdates() {
        ['pickup-location', 'destination', 'pickup-time'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updateSummary);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMessageBox();
        // Load shared header/footer
        // header/footer handled by app.js (already included)
        hydrateSelection();
        wireSummaryUpdates();
        updateSummary();
    });

    // expose handler globally for form onsubmit
    window.orderSelectedTaxi = orderSelectedTaxi;
})();