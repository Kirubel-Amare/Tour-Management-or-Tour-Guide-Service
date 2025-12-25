let selectedTour = null;

document.addEventListener('DOMContentLoaded', () => {
    // Ensure user is logged in before using booking page
    if (!isUserLoggedIn()) {
        showMessageBox?.('Please login to continue to booking.', { title: 'Login Required', type: 'info' });
        setTimeout(() => { window.location.href = 'login.html'; }, 800);
        return;
    }

    // Header/footer are loaded by app.js via placeholders; just hydrate content
    hydrateTour();
    wireForm();
});

function isUserLoggedIn() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return !!user && !!user.id;
    } catch (_) {
        return false;
    }
}

// Header/footer are handled globally by app.js

function hydrateTour() {
    try {
        const stored = sessionStorage.getItem('selectedTour');
        if (!stored) {
            showMessageBox?.('No tour selected. Redirecting to tours.', { title: 'Tours', type: 'info' });
            setTimeout(() => { window.location.href = 'tours.html'; }, 1200);
            return;
        }
        selectedTour = JSON.parse(stored);
    } catch (err) {
        console.warn('Unable to read tour selection', err);
    }

    if (!selectedTour) {
        showMessageBox?.('No tour selected. Redirecting to tours.', { title: 'Tours', type: 'info' });
        setTimeout(() => { window.location.href = 'tours.html'; }, 1200);
        return;
    }

    document.getElementById('tour-title').textContent = selectedTour.title || 'Tour';
    document.getElementById('tour-location').textContent = selectedTour.location || '—';
    document.getElementById('tour-price').textContent = selectedTour.price ? `$${selectedTour.price}` : 'Contact for price';
    document.getElementById('tour-duration').textContent = selectedTour.duration ? `${selectedTour.duration} hours` : 'Duration varies';
    document.getElementById('tour-schedule').textContent = selectedTour.schedule_date || 'Schedule on request';

    const imageEl = document.getElementById('tour-image');
    if (selectedTour.image) {
        imageEl.src = selectedTour.image;
        imageEl.alt = selectedTour.title || 'Tour';
    } else {
        imageEl.src = 'images/tour-placeholder.jpg';
        imageEl.alt = 'Tour placeholder';
    }

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('min', today);
}

function wireForm() {
    const form = document.getElementById('booking-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showMessageBox?.('Please login to book tours.', { title: 'Login required', type: 'info' });
            window.location.href = 'login.html';
            return;
        }

        if (!selectedTour) {
            showMessageBox?.('No tour selected.', { title: 'Tours', type: 'error' });
            return;
        }

        const people = Number(document.getElementById('people').value || 1);
        const date = document.getElementById('date').value;
        const notes = document.getElementById('notes').value.trim();

        if (!date) {
            showMessageBox?.('Please choose a preferred date.', { title: 'Tour Booking', type: 'info' });
            return;
        }

        try {
            const response = await fetch('/api/bookings/create.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tour_id: selectedTour.id,
                    user_id: user.id,
                    people,
                    preferred_date: date,
                    notes
                })
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                showMessageBox?.('Your booking request was sent and is awaiting approval. We will notify you once it is confirmed.', { title: 'Tour Booking', type: 'success' });
                form.reset();
            } else {
                const msg = data?.message || 'Booking failed.';
                showMessageBox?.(msg, { title: 'Tour Booking', type: 'error' });
            }
        } catch (err) {
            console.error('Error booking tour:', err);
            showMessageBox?.('An error occurred. Please try again.', { title: 'Tour Booking', type: 'error' });
        }
    });
}

// Lightweight message modal implementation (fallback if utils.js not loaded)
function showMessageBox(message, options = {}) {
    const modal = document.getElementById('messageModal');
    const titleEl = document.getElementById('messageTitle');
    const bodyEl = document.getElementById('messageBody');
    const closeBtn = document.getElementById('messageCloseBtn');
    const okBtn = document.getElementById('messageOkBtn');

    if (!modal || !titleEl || !bodyEl || !closeBtn || !okBtn) {
        alert(message);
        return;
    }

    titleEl.textContent = options.title || 'Notice';
    bodyEl.textContent = message;
    modal.classList.add('show');

    const closeModal = () => modal.classList.remove('show');
    closeBtn.onclick = closeModal;
    okBtn.onclick = closeModal;
}