// Restaurant booking page logic
(function () {
    function initMessageBox() {
        const modal = document.getElementById('message-modal');
        if (!modal || modal.dataset.wired) return;
        modal.dataset.wired = 'true';

        const dialog = modal.querySelector('.msg-dialog');
        const titleEl = document.getElementById('msg-title');
        const bodyEl = document.getElementById('msg-body');
        const okBtn = document.getElementById('msg-ok');
        const closeElements = modal.querySelectorAll('[data-close]');

        const close = () => modal.classList.remove('show');
        closeElements.forEach(el => el.addEventListener('click', close));
        okBtn?.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target.dataset.close === 'true') close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) close();
        });

        window.showMessageBox = (message, { title = 'Message', type = 'info' } = {}) => {
            dialog.classList.remove('info', 'success', 'error');
            dialog.classList.add(type || 'info');
            titleEl.textContent = title;
            bodyEl.textContent = Array.isArray(message) ? message.join('\n') : message;
            modal.classList.add('show');
            okBtn?.focus({ preventScroll: true });
        };
    }

    function hydrateSelection() {
        try {
            const saved = JSON.parse(sessionStorage.getItem('selectedRestaurant') || '{}');
            if (!saved || !saved.id) return;
            document.getElementById('selected-restaurant-id').value = saved.id;
            document.getElementById('selected-restaurant-name').value = saved.name || '';
            document.getElementById('selected-restaurant-location').value = saved.location || '';
            document.getElementById('selected-restaurant-cuisine').value = saved.cuisine || '';

            document.getElementById('summary-name').textContent = saved.name || 'Selected restaurant';
            document.getElementById('summary-cuisine').textContent = saved.cuisine || 'Cuisine';
            document.getElementById('summary-location').textContent = saved.location || '—';

            const hero = document.getElementById('summary-hero');
            if (hero) {
                hero.style.background = saved.image
                    ? `linear-gradient(135deg, rgba(234,88,12,0.8), rgba(239,68,68,0.75)), url('${saved.image}') center/cover no-repeat`
                    : 'linear-gradient(135deg, #ea580c, #ef4444)';
            }

            const extra = document.getElementById('summary-extra');
            extra?.replaceChildren();
            if (extra && (saved.priceRange || saved.rating || (saved.features && saved.features.length))) {
                const frag = document.createDocumentFragment();
                if (saved.priceRange) {
                    const chip = document.createElement('span');
                    chip.className = 'summary-chip';
                    chip.innerHTML = '<i class="fas fa-dollar-sign"></i>' + saved.priceRange;
                    frag.appendChild(chip);
                }
                if (saved.rating) {
                    const chip = document.createElement('span');
                    chip.className = 'summary-chip';
                    chip.innerHTML = '<i class="fas fa-star"></i>' + `${saved.rating}★`;
                    frag.appendChild(chip);
                }
                (saved.features || []).slice(0, 3).forEach(f => {
                    const chip = document.createElement('span');
                    chip.className = 'summary-chip';
                    chip.textContent = f;
                    frag.appendChild(chip);
                });
                extra.appendChild(frag);
            }
        } catch (err) {
            console.warn('No restaurant selection found', err);
        }
    }

    function updateSummary() {
        const date = document.getElementById('reservation-date').value || '—';
        const time = document.getElementById('reservation-time').value || '—';
        const guests = document.getElementById('guest-count').value || '—';
        const name = document.getElementById('customer-name').value || '—';
        const phone = document.getElementById('contact-phone').value || '—';
        document.getElementById('summary-date').textContent = date;
        document.getElementById('summary-time').textContent = time;
        document.getElementById('summary-guests').textContent = guests;
        document.getElementById('summary-customer-name').textContent = name;
        document.getElementById('summary-customer-phone').textContent = phone;
    }

   async function orderSelectedRestaurant(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        showMessageBox('Please login to book a restaurant.', { type: 'info', title: 'Login required' });
        window.location.href = 'login.html';
        return;
    }

    const restaurantId = document.getElementById('selected-restaurant-id').value;
    const date = (document.getElementById('reservation-date').value || '').trim();
    const time = (document.getElementById('reservation-time').value || '').trim();
    const guests = Number(document.getElementById('guest-count').value || 0);
    const phone = (document.getElementById('contact-phone').value || '').trim();
    const requests = (document.getElementById('special-requests').value || '').trim();
    const customerName = document.getElementById('customer-name')?.value || user.name;
    const customerEmail = user.email || '';

    if (!restaurantId || !date || !time || !guests) {
        showMessageBox('Date, time, and guest count are required.', { type: 'error', title: 'Missing info' });
        return;
    }
    if (!customerEmail) {
        showMessageBox('Your profile is missing an email address. Please update your profile.', { type: 'error', title: 'Missing email' });
        return;
    }

    try {
        const response = await fetch(`/api/v1/restaurants.php?action=create_reservation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': 'TOUR_SERVICE_KEY_2025'
            },
            body: JSON.stringify({
                user_id: user.id,
                customer_name: customerName,
                customer_email: customerEmail,
                customer_phone: phone,
                restaurant_id: restaurantId,
                date,
                time,
                guests,
                special_requests: requests || undefined
            })
        });

        const payload = await response.json().catch(() => ({}));

        if (response.ok && payload.success) {
            const conf = payload.data?.confirmation_code || 'pending';
            showMessageBox(`Reservation placed!\n\nDate: ${date}\nTime: ${time}\nGuests: ${guests}\nConfirmation: ${conf}`, { type: 'success', title: 'Reserved' });
            sessionStorage.removeItem('selectedRestaurant');
            e.target.reset();
            updateSummary();
        } else {
            const msg = payload?.message || 'Reservation failed (provider may not support booking in this environment).';
            showMessageBox(msg, { type: 'error', title: 'Booking failed' });
        }
    } catch (err) {
        console.error('Restaurant booking error', err);
        showMessageBox('Unable to reserve table right now.', { type: 'error', title: 'Error' });
    }
}

    function wireSummaryUpdates() {
        ['reservation-date', 'reservation-time', 'guest-count', 'customer-name', 'contact-phone'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', updateSummary);
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initMessageBox();
        hydrateSelection();
        wireSummaryUpdates();
        updateSummary();
    });

    window.orderSelectedRestaurant = orderSelectedRestaurant;
})();
