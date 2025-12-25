// Hotel booking page logic
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

    // Sync selected hotel from sessionStorage (set by services page)
    function hydrateSelection() {
        try {
            const saved = JSON.parse(sessionStorage.getItem('selectedHotel') || '{}');
            if (!saved || !saved.id) return;
            document.getElementById('selected-hotel-id').value = saved.id;
            document.getElementById('selected-room-id').value = saved.room_id || 1;
            document.getElementById('summary-name').textContent = saved.name || 'Selected hotel';
            document.getElementById('summary-room').textContent = saved.roomType || 'Room type';
            const hero = document.getElementById('summary-hero');
            if (hero) {
                hero.style.background = saved.image
                    ? `linear-gradient(135deg, rgba(37,99,235,0.78), rgba(124,58,237,0.78)), url('${saved.image}') center/cover no-repeat`
                    : 'linear-gradient(135deg, #2563eb, #7c3aed)';
            }
            const extra = document.getElementById('summary-extra');
            extra?.replaceChildren();
            if (extra && (saved.price || saved.rating)) {
                const frag = document.createDocumentFragment();
                if (saved.price) {
                    const s = document.createElement('span');
                    s.className = 'summary-chip';
                    s.innerHTML = '<i class="fas fa-dollar-sign"></i>' + `${saved.price} per night`;
                    frag.appendChild(s);
                }
                if (saved.rating) {
                    const s = document.createElement('span');
                    s.className = 'summary-chip';
                    s.innerHTML = '<i class="fas fa-star"></i>' + `${saved.rating} stars`;
                    frag.appendChild(s);
                }
                extra.appendChild(frag);
            }
        } catch (e) {}
    }

    window.bookSelectedHotel = async function (e) {
        e.preventDefault();
        const hotel_id = document.getElementById('selected-hotel-id').value;
        const room_id = document.getElementById('selected-room-id').value;
        const check_in = document.getElementById('check-in').value;
        const check_out = document.getElementById('check-out').value;
        // Check for missing hotel/room selection
        if (!hotel_id || hotel_id === '—' || !room_id || room_id === '—') {
            showMessageBox('The selected hotel or room is not available. Please go back and select a valid hotel and room.', { title: 'Not Available', type: 'error' });
            return;
        }
        // Check for missing required fields
        if (!check_in || !check_out) {
            showMessageBox('Please select both check-in and check-out dates.', { title: 'Missing Dates', type: 'error' });
            return;
        }
        const payload = { hotel_id, room_id, check_in, check_out };
        try {
            const response = await fetch('/api/integrations/hotel_bookings.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let result;
            try {
                result = await response.json();
            } catch (jsonErr) {
                showMessageBox('Unexpected server response. Please try again later.', { title: 'Server Error', type: 'error' });
                return;
            }
            if (result.ok) {
                showMessageBox('Hotel booked successfully!', { title: 'Success', type: 'success' });
            } else {
                // Prefer backend error message if available
                let backendMsg = result.error || (result.data && (result.data.message || result.data.error));
                if (backendMsg) {
                    showMessageBox('Booking failed: ' + backendMsg, { title: 'Error', type: 'error' });
                } else {
                    showMessageBox('Booking failed: Unknown error.', { title: 'Error', type: 'error' });
                }
            }
        } catch (err) {
            showMessageBox('Booking error: ' + err.message, { title: 'Error', type: 'error' });
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        initMessageBox();
        hydrateSelection();
    });
})();
