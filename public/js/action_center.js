// action_center.js - Admin actions hub with confirmations

const state = { users: [], tours: [], bookings: [] };
const services = { hotels: [], restaurants: [] };

const requireAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
    }
    return user;
};

const qs = (sel) => document.querySelector(sel);

const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
};

async function loadData() {
    try {
        const res = await fetch('/api/admin/overview.php');
        const data = await res.json();
        state.users = data.users || [];
        state.tours = data.tours || [];
        state.bookings = data.bookings || [];
        await loadServices();
        renderStats();
        renderUsers();
        renderTours();
        renderBookings();
        renderHotels();
        renderRestaurants();
        Popup.toast({ message: 'Data refreshed', type: 'success' });
    } catch (err) {
        console.error(err);
        Popup.toast({ message: 'Failed to load data', type: 'error' });
    }
}

async function loadServices() {
    try {
        const [hRes, rRes] = await Promise.all([
            fetch('/api/services/hotels.php'),
            fetch('/api/services/restaurants.php')
        ]);
        const hJson = await hRes.json();
        const rJson = await rRes.json();
        services.hotels = hJson.data || [];
        services.restaurants = rJson.data || [];
    } catch (e) {
        console.error('services load failed', e);
        services.hotels = [];
        services.restaurants = [];
    }
}

function renderStats() {
    setText('stat-users', state.users.length);
    setText('stat-managers', state.users.filter(u => u.role === 'manager').length);
    setText('stat-tours', state.tours.length);
    setText('stat-bookings', state.bookings.length);
}

function renderUsers() {
    const body = document.getElementById('user-tbody');
    if (!body) return;

    const query = (qs('#user-search')?.value || '').toLowerCase();
    const roleFilter = qs('#role-filter')?.value || 'all';

    const filtered = state.users.filter(u => {
        const matchQuery = `${u.name} ${u.email}`.toLowerCase().includes(query);
        const matchRole = roleFilter === 'all' ? true : u.role === roleFilter;
        return matchQuery && matchRole;
    });

    if (!filtered.length) {
        body.innerHTML = '<tr><td colspan="5" class="loading">No users match filters</td></tr>';
        return;
    }

    body.innerHTML = filtered.map(u => `
        <tr>
            <td><strong>${u.name}</strong><div class="muted" style="font-size:0.9rem;">ID #${u.id}</div></td>
            <td>${u.email}</td>
            <td><span class="pill pill-${u.role}">${u.role.toUpperCase()}</span></td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td style="text-align:right;">
                <div class="row-actions">
                    <button class="btn-chip" onclick="openAcUserDrawer(${u.id})">Edit</button>
                    <button class="btn-chip danger" onclick="openAcUserDrawer(${u.id}, 'delete')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderTours() {
    const body = document.getElementById('tour-tbody');
    if (!body) return;

    if (!state.tours.length) {
        body.innerHTML = '<tr><td colspan="5" class="loading">No tours found</td></tr>';
        return;
    }

    body.innerHTML = state.tours.map(t => `
        <tr>
            <td><strong>${t.title}</strong></td>
            <td>${t.location}</td>
            <td>$${t.price}</td>
            <td>${t.guide_name || 'N/A'}</td>
            <td style="text-align:right;">
                <div class="row-actions">
                    <button class="btn-chip" onclick="openAcTourDrawer(${t.id})">Edit</button>
                    <button class="btn-chip danger" onclick="openAcTourDrawer(${t.id}, 'delete')">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderHotels() {
    const body = document.getElementById('hotel-tbody');
    if (!body) return;
    if (!services.hotels.length) {
        body.innerHTML = '<tr><td colspan="5" class="loading">No hotels found</td></tr>';
        return;
    }
    body.innerHTML = services.hotels.map(h => `
        <tr>
            <td>${h.name}</td>
            <td>${h.location}</td>
            <td>$${h.price}</td>
            <td>${h.rating ?? '-'}★</td>
            <td style="text-align:right;">
                <div class="row-actions">
                    <button class="btn-chip" onclick="viewService('hotel', ${h.id})">View</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderRestaurants() {
    const body = document.getElementById('restaurant-tbody');
    if (!body) return;
    if (!services.restaurants.length) {
        body.innerHTML = '<tr><td colspan="5" class="loading">No restaurants found</td></tr>';
        return;
    }
    body.innerHTML = services.restaurants.map(r => `
        <tr>
            <td>${r.name}</td>
            <td>${r.location}</td>
            <td>${r.cuisine || '-'}</td>
            <td>${r.priceRange || r.price_range || '-'}</td>
            <td style="text-align:right;">
                <div class="row-actions">
                    <button class="btn-chip" onclick="viewService('restaurant', ${r.id})">View</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function viewService(type, id) {
    const item = type === 'hotel' ? services.hotels.find(h => h.id == id) : services.restaurants.find(r => r.id == id);
    if (!item) return;
    const details = Object.entries(item)
        .map(([k,v]) => `<div><strong>${k}:</strong> ${Array.isArray(v) ? v.join(', ') : v}</div>`)
        .join('');
    const modal = document.createElement('div');
    modal.className = 'popup-overlay';
    modal.innerHTML = `
        <div class="popup-modal" style="max-width:520px;">
            <h3>${type === 'hotel' ? 'Hotel' : 'Restaurant'} Details</h3>
            <div style="max-height:50vh; overflow:auto;">${details}</div>
            <div class="popup-actions">
                <button class="popup-btn primary" data-close>Close</button>
            </div>
        </div>`;
    modal.addEventListener('click', (e) => {
        if (e.target.dataset.close || e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
}

function renderBookings() {
    const body = document.getElementById('booking-tbody');
    if (!body) return;

    if (!state.bookings.length) {
        body.innerHTML = '<tr><td colspan="5" class="loading">No bookings found</td></tr>';
        return;
    }

        body.innerHTML = state.bookings.map(b => {
            const status = (b.status || '').toString();
            return `
            <tr>
                <td>${b.tour_title}</td>
                <td>${b.tourist_name}</td>
                <td>${new Date(b.booking_date).toLocaleDateString()}</td>
                <td><span class="status-pill ${status.toLowerCase()}">${status.toUpperCase()}</span></td>
                <td style="text-align:right;">
                    <div class="row-actions">
                        <button class="btn-chip" onclick="openAcBookingDrawer(${b.id})">Update</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
}
    // Drawers for inline actions (no prompts)
    function openAcUserDrawer(userId, mode = 'edit') {
        const user = state.users.find(u => u.id === userId);
        const creating = !user;
        document.getElementById('ac-user-mode').value = creating ? 'create' : 'edit';
        document.getElementById('ac-user-id').value = user ? user.id : '';
        document.getElementById('ac-user-name').value = user ? user.name : '';
        document.getElementById('ac-user-email').value = user ? user.email : '';
        document.getElementById('ac-user-role').value = user ? user.role : 'customer';
        document.getElementById('ac-user-pass').value = '';
        const hint = document.getElementById('ac-user-pass-hint');
        if (hint) hint.textContent = creating ? '(required)' : '(optional)';
        const pass = document.getElementById('ac-user-pass');
        if (pass) {
            pass.required = creating;
            pass.placeholder = creating ? 'Set password' : 'Leave blank to keep current';
        }
        document.getElementById('ac-user-title').textContent = creating ? 'Add User' : (mode === 'delete' ? 'Delete User' : `Edit ${user.name}`);
        document.getElementById('ac-user-drawer').classList.remove('hidden');
    }

    function closeAcUserDrawer() {
        document.getElementById('ac-user-drawer').classList.add('hidden');
    }

    async function submitAcUser(event) {
        event.preventDefault();
        const mode = document.getElementById('ac-user-mode').value;
        const idVal = document.getElementById('ac-user-id').value;
        const payload = {
            id: idVal ? parseInt(idVal, 10) : undefined,
            name: document.getElementById('ac-user-name').value,
            email: document.getElementById('ac-user-email').value,
            role: document.getElementById('ac-user-role').value
        };
        const password = document.getElementById('ac-user-pass').value;
        if (password) payload.password = password;

        try {
            let endpoint = '/api/admin/users/update_profile.php';
            let method = 'POST';
            if (mode === 'create') {
                endpoint = '/api/auth/register.php';
                method = 'POST';
            }
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            Popup.toast({ message: mode === 'create' ? 'User created' : 'User updated', type: 'success' });
            closeAcUserDrawer();
            await loadData();
        } catch (err) {
            Popup.toast({ message: err.message, type: 'error' });
        }
    }

    async function deleteAcUser() {
        const idVal = document.getElementById('ac-user-id').value;
        if (!idVal) return;
        try {
            const res = await fetch('/api/admin/users/delete.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(idVal, 10) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            Popup.toast({ message: 'User deleted', type: 'success' });
            closeAcUserDrawer();
            await loadData();
        } catch (err) {
            Popup.toast({ message: err.message, type: 'error' });
        }
    }

    function openAcTourDrawer(id, action = 'edit') {
        const tour = state.tours.find(t => t.id === id);
        const creating = !tour || action === 'create';
        document.getElementById('ac-tour-mode').value = creating ? 'create' : 'edit';
        document.getElementById('ac-tour-id').value = tour ? tour.id : '';
        document.getElementById('ac-tour-title-input').value = tour ? tour.title : '';
        document.getElementById('ac-tour-location').value = tour ? tour.location : '';
        document.getElementById('ac-tour-price').value = tour ? tour.price : '';
        document.getElementById('ac-tour-date').value = tour ? (tour.schedule_date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
        document.getElementById('ac-tour-title').textContent = creating ? 'Create Tour' : (action === 'delete' ? 'Delete Tour' : `Edit ${tour.title}`);

        const guides = state.users.filter(u => ['manager','admin'].includes(u.role));
        const guideSelect = document.getElementById('ac-tour-guide');
        if (guideSelect) {
            guideSelect.innerHTML = guides.length ? guides.map(g => `<option value="${g.id}">${g.name} (${g.role})</option>`).join('') : '<option value="">No managers/admins available</option>';
            guideSelect.value = tour ? tour.guide_id : (guides[0]?.id || '');
        }
        document.getElementById('ac-tour-drawer').classList.remove('hidden');
    }

    function closeAcTourDrawer() {
        document.getElementById('ac-tour-drawer').classList.add('hidden');
    }

    async function submitAcTour(event) {
        event.preventDefault();
        const mode = document.getElementById('ac-tour-mode').value;
        const payload = {
            id: document.getElementById('ac-tour-id').value ? parseInt(document.getElementById('ac-tour-id').value, 10) : undefined,
            guide_id: parseInt(document.getElementById('ac-tour-guide').value, 10),
            title: document.getElementById('ac-tour-title-input').value,
            location: document.getElementById('ac-tour-location').value,
            price: parseFloat(document.getElementById('ac-tour-price').value),
            schedule_date: document.getElementById('ac-tour-date').value
        };
        if (!Number.isFinite(payload.guide_id)) return Popup.toast({ message: 'Select a guide', type: 'error' });
        if (!Number.isFinite(payload.price)) return Popup.toast({ message: 'Enter a valid price', type: 'error' });

        try {
            const endpoint = mode === 'edit' ? '/api/tours/update.php' : '/api/tours/create.php';
            const method = mode === 'edit' ? 'PUT' : 'POST';
            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            Popup.toast({ message: mode === 'edit' ? 'Tour updated' : 'Tour created', type: 'success' });
            closeAcTourDrawer();
            await loadData();
        } catch (err) {
            Popup.toast({ message: err.message, type: 'error' });
        }
    }

    async function deleteAcTour() {
        const idVal = document.getElementById('ac-tour-id').value;
        if (!idVal) return;
        try {
            const res = await fetch('/api/admin/tours/delete.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(idVal, 10) })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            Popup.toast({ message: 'Tour deleted', type: 'success' });
            closeAcTourDrawer();
            await loadData();
        } catch (err) {
            Popup.toast({ message: err.message, type: 'error' });
        }
    }

    function openAcBookingDrawer(id) {
        const booking = state.bookings.find(b => b.id === id);
        if (!booking) return;
        document.getElementById('ac-booking-id').value = booking.id;
        document.getElementById('ac-booking-status').value = (booking.status || 'pending').toLowerCase();
        document.getElementById('ac-booking-title').textContent = `Update Booking #${booking.id}`;
        document.getElementById('ac-booking-drawer').classList.remove('hidden');
    }

    function closeAcBookingDrawer() {
        document.getElementById('ac-booking-drawer').classList.add('hidden');
    }

    async function submitAcBooking(event) {
        event.preventDefault();
        const idVal = document.getElementById('ac-booking-id').value;
        const status = document.getElementById('ac-booking-status').value;
        try {
            const res = await fetch('/api/admin/bookings/update_status.php', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: parseInt(idVal, 10), status })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            Popup.toast({ message: 'Booking updated', type: 'success' });
            closeAcBookingDrawer();
            await loadData();
        } catch (err) {
            Popup.toast({ message: err.message, type: 'error' });
        }
    }

function wireFilters() {
    qs('#user-search')?.addEventListener('input', renderUsers);
    qs('#role-filter')?.addEventListener('change', renderUsers);
    qs('#refresh-btn')?.addEventListener('click', loadData);
    // Create shortcuts
    const createButtons = document.querySelectorAll('[data-ac-create-tour]');
    createButtons.forEach(btn => btn.addEventListener('click', () => openAcTourDrawer(null, 'create')));
}

(function init() {
    requireAdmin();
    wireFilters();
    loadData();
})();
