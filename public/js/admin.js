 // Initialize
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
        }

        // Set admin info
        document.getElementById('admin-name').textContent = user.name;
        document.getElementById('admin-greeting').textContent = user.name.split(' ')[0];

        const overview = {
            users: [],
            tours: [],
            bookings: [],
            stats: {
                total_users: 0,
                total_tours: 0,
                total_bookings: 0,
                revenue: 0
            }
        };

        const controlFilters = {
            query: '',
            role: 'all'
        };

        const notify = (message, type = 'info') => {
            if (window.Popup && Popup.toast) {
                Popup.toast({ message, type });
            } else {
                // Fallback if popup helper not loaded
                alert(message);
            }
        };

        const askConfirm = async (title, message) => {
            if (window.Popup && Popup.confirm) {
                return Popup.confirm({ title, message });
            }
            return confirm(message || title);
        };

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            loadDashboardData();

            const searchInput = document.getElementById('control-search');
            const roleFilter = document.getElementById('control-role-filter');

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    controlFilters.query = e.target.value.toLowerCase();
                    renderControlTable();
                });
            }

            if (roleFilter) {
                roleFilter.addEventListener('change', (e) => {
                    controlFilters.role = e.target.value;
                    renderControlTable();
                });
            }
        });

        // Switch between views
        function switchView(viewName) {
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[onclick="switchView('${viewName}')"]`).classList.add('active');

            // Hide all views and show selected
            document.querySelectorAll('.admin-main > div').forEach(view => {
                view.style.display = 'none';
            });
            document.getElementById(`${viewName}-view`).style.display = 'block';

            // Load view data
            if (viewName === 'users') {
                loadUsers();
            } else if (viewName === 'tours') {
                loadTours();
            } else if (viewName === 'bookings') {
                loadBookings();
            } else if (viewName === 'control') {
                renderControlCenter();
            }
        }

        // Load dashboard data
        async function loadDashboardData() {
            const loading = document.getElementById('last-updated');
            if (loading) {
                loading.textContent = 'Loading...';
            }

            try {
                const response = await fetch('/api/admin/overview.php');
                const data = await response.json();

                overview.users = data.users || [];
                overview.tours = data.tours || [];
                overview.bookings = data.bookings || [];
                overview.stats = data.stats || overview.stats;

                document.getElementById('total-users').textContent = overview.stats.total_users;
                document.getElementById('total-tours').textContent = overview.stats.total_tours;
                document.getElementById('total-bookings').textContent = overview.stats.total_bookings;
                document.getElementById('total-revenue').textContent = `$${(overview.stats.revenue || 0).toFixed(2)}`;

                document.getElementById('user-count').textContent = overview.stats.total_users;
                document.getElementById('tour-count').textContent = overview.stats.total_tours;
                document.getElementById('booking-count').textContent = overview.stats.total_bookings;

                initializeCharts();
                loadActivity();
                loadUsers();
                loadTours();
                loadBookings();
                renderControlCenter();

                if (loading) {
                    loading.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            } catch (error) {
                console.error('Error loading admin overview', error);
                notify('Failed to load overview', 'error');
                if (loading) {
                    loading.textContent = 'Failed to refresh';
                }
            }
        }

        // Initialize charts
        function initializeCharts() {
            const revenueByMonth = Array(12).fill(0);
            overview.bookings.forEach(booking => {
                const month = new Date(booking.booking_date).getMonth();
                revenueByMonth[month] += parseFloat(booking.price || 0);
            });

            const roleCounts = overview.users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1;
                return acc;
            }, {});

            // Revenue Chart
            const revenueCtx = document.getElementById('revenueChart').getContext('2d');
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: revenueByMonth.slice(0, 6),
                        borderColor: 'rgb(79, 70, 229)',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });

            // User Chart
            const userCtx = document.getElementById('userChart').getContext('2d');
            new Chart(userCtx, {
                type: 'doughnut',
                data: {
                    labels: ['customer', 'manager', 'admin'],
                    datasets: [{
                        data: [roleCounts['customer'] || 0, roleCounts['manager'] || 0, roleCounts['admin'] || 0],
                        backgroundColor: [
                            'rgb(59, 130, 246)',
                            'rgb(245, 158, 11)',
                            'rgb(79, 70, 229)'
                        ],
                        borderWidth: 2,
                        borderColor: 'white'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Load activity
        function loadActivity() {
            const container = document.getElementById('activity-list');
            const recent = overview.bookings.slice(0, 5);
            if (recent.length === 0) {
                container.innerHTML = '<div class="activity-item">No recent activity</div>';
                return;
            }

            container.innerHTML = recent.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon booking">
                        <i class="fas fa-calendar-plus"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.tour_title}</div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">${activity.tourist_name} booked this tour</div>
                        <div class="activity-time">${new Date(activity.booking_date).toLocaleString()}</div>
                    </div>
                </div>
            `).join('');
        }

        // Load users
        function loadUsers() {
            const container = document.getElementById('users-list');
            container.innerHTML = overview.users.map(user => `
                <tr>
                    <td>#${user.id}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 36px; height: 36px; background: ${user.role === 'admin' ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' : user.role === 'manager' ? 'linear-gradient(135deg, var(--secondary) 0%, #d97706 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                ${user.name.charAt(0)}
                            </div>
                            <span style="font-weight: 500;">${user.name}</span>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="status-badge ${user.role === 'admin' ? 'status-active' : user.role === 'manager' ? 'status-pending' : 'status-inactive'}">
                            ${user.role.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge status-active">ACTIVE</span>
                    </td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="editUser(${user.id})" class="btn btn-outline btn-sm" style="border-color: var(--border);">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteUser(${user.id})" class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Search users
        function searchUsers() {
            const query = document.getElementById('user-search').value.toLowerCase();
            const filtered = overview.users.filter(user => 
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.role.toLowerCase().includes(query)
            );
            
            const container = document.getElementById('users-list');
            if (filtered.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <div>No users found</div>
                        </td>
                    </tr>
                `;
            } else {
                container.innerHTML = filtered.map(user => `
                    <tr>
                        <td>#${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.role.toUpperCase()}</td>
                        <td>ACTIVE</td>
                        <td>${new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                            <div style="display: flex; gap: 0.5rem;">
                                <button onclick="editUser(${user.id})" class="btn btn-outline btn-sm">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteUser(${user.id})" class="btn btn-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        }

        function clearUserSearch() {
            document.getElementById('user-search').value = '';
            loadUsers();
        }

        // Load tours
        function loadTours() {
            const container = document.getElementById('tours-management-content');
            if (overview.tours.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>No Tours Available</h3>
                        <p>Create your first tour to get started</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="overflow-x: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Location</th>
                                    <th>Guide</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th>Bookings</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${overview.tours.map(tour => `
                                    <tr>
                                        <td>#${tour.id}</td>
                                        <td><strong>${tour.title}</strong></td>
                                        <td>${tour.location}</td>
                                        <td>${tour.guide_name || 'N/A'}</td>
                                        <td>
                                            <span class="status-badge">${tour.location.split(',')[0]}</span>
                                        </td>
                                        <td><strong>$${tour.price}</strong></td>
                                        <td>
                                            <span class="status-badge status-active">ACTIVE</span>
                                        </td>
                                        <td>${overview.bookings.filter(b => b.tour_title === tour.title).length}</td>
                                        <td>
                                            <div style="display: flex; gap: 0.5rem;">
                                                <button onclick="editTour(${tour.id})" class="btn btn-outline btn-sm">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button onclick="deleteTour(${tour.id})" class="btn btn-danger btn-sm">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

        function searchTours() {
            const query = document.getElementById('tour-search').value.toLowerCase();
            alert(`Searching tours for: ${query}\nThis would filter the tours table.`);
        }

        // Load bookings
        function loadBookings() {
            const container = document.getElementById('bookings-management-content');
            if (overview.bookings.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        <i class="fas fa-calendar-check" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <h3>No Bookings Available</h3>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div style="overflow-x: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Tourist</th>
                                    <th>Tour</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${overview.bookings.map(booking => `
                                    <tr>
                                        <td>#${booking.id}</td>
                                        <td>${booking.tourist_name}</td>
                                        <td>${booking.tour_title}</td>
                                        <td>${new Date(booking.booking_date).toLocaleDateString()}</td>
                                        <td>
                                            <span class="status-badge ${booking.status === 'confirmed' ? 'status-active' : booking.status === 'pending' ? 'status-pending' : 'status-inactive'}">
                                                ${(booking.status || '').toString().toUpperCase()}
                                            </span>
                                        </td>
                                        <td><strong>$${booking.price}</strong></td>
                                        <td>
                                            <div style="display: flex; gap: 0.5rem;">
                                                <button onclick="viewBooking(${booking.id})" class="btn btn-outline btn-sm">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button onclick="updateBooking(${booking.id})" class="btn btn-primary btn-sm">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }
        }

        function searchBookings() {
            const query = document.getElementById('booking-search').value.toLowerCase();
            alert(`Searching bookings for: ${query}\nThis would filter the bookings table.`);
        }

        // User actions
        function addNewUser() {
            openProfileDrawer(null);
        }

        async function editUser(userId) {
            const user = overview.users.find(u => u.id === userId);
            if (!user) return;
            const newRole = prompt(`Set role for ${user.name} (admin/manager/customer):`, user.role);
            if (!newRole) return;
            if (!['admin','manager','customer'].includes(newRole)) {
                return notify('Invalid role', 'error');
            }
            try {
                const res = await fetch('/api/admin/users/update_role.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId, role: newRole })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed');
                notify('Role updated', 'success');
                loadDashboardData();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        async function deleteUser(userId) {
            const ok = await askConfirm('Delete user', 'Delete this user? This will also remove related tours/bookings.');
            if (!ok) return;
            try {
                const res = await fetch('/api/admin/users/delete.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed');
                notify('User deleted', 'success');
                loadDashboardData();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        // Tour actions
        function createNewTour() {
            openTourDrawer(null);
        }

        function editTour(tourId) {
            const tour = overview.tours.find(t => t.id === tourId);
            if (tour) {
                openTourDrawer(tourId);
            }
        }

        async function deleteTour(tourId) {
            const ok = await askConfirm('Delete tour', 'Delete this tour? This action cannot be undone.');
            if (!ok) return;
            try {
                const res = await fetch('/api/admin/tours/delete.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: tourId })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed');
                notify('Tour deleted', 'success');
                loadDashboardData();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        // Booking actions (drawer, no alerts/prompts)
        function viewBooking(bookingId) {
            openBookingDrawer(bookingId, 'view');
        }

        function updateBooking(bookingId) {
            openBookingDrawer(bookingId, 'edit');
        }

        function openBookingDrawer(bookingId, mode = 'view') {
            const booking = overview.bookings.find(b => b.id === bookingId);
            if (!booking) return;
            const editable = mode === 'edit';

            document.getElementById('booking-id').value = booking.id;
            document.getElementById('booking-tourist').value = booking.tourist_name || 'Unknown';
            document.getElementById('booking-tour').value = booking.tour_title || 'Unknown tour';
            document.getElementById('booking-date').value = new Date(booking.booking_date).toLocaleString();
            document.getElementById('booking-status').value = (booking.status || 'pending').toLowerCase();
            document.getElementById('booking-status').disabled = !editable;
            document.getElementById('booking-amount').value = `$${booking.price}`;

            const title = editable ? `Edit Booking #${booking.id}` : `Booking #${booking.id}`;
            const saveBtn = document.getElementById('booking-save-btn');
            if (saveBtn) saveBtn.style.display = editable ? 'inline-flex' : 'none';
            document.getElementById('booking-drawer-title').textContent = title;

            const drawer = document.getElementById('booking-drawer');
            if (drawer) drawer.classList.remove('hidden');
        }

        function closeBookingDrawer() {
            const drawer = document.getElementById('booking-drawer');
            if (drawer) drawer.classList.add('hidden');
        }

        async function submitBookingUpdate(event) {
            event.preventDefault();
            const bookingId = parseInt(document.getElementById('booking-id').value, 10);
            const status = document.getElementById('booking-status').value;

            if (!['pending','confirmed','cancelled'].includes(status)) {
                return notify('Invalid status', 'error');
            }

            try {
                const res = await fetch('/api/admin/bookings/update_status.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: bookingId, status })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed');
                notify('Booking updated', 'success');
                closeBookingDrawer();
                loadDashboardData();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        // Control Center
        function renderControlCenter() {
            renderControlStats();
            renderControlTable();
            renderControlActivity();
        }

        function renderControlStats() {
            const totalUsers = overview.users.length;
            const managers = overview.users.filter(u => u.role === 'manager').length;
            const admins = overview.users.filter(u => u.role === 'admin').length;
            const customers = overview.users.filter(u => u.role === 'customer').length;
            const confirmed = overview.bookings.filter(b => (b.status || '').toLowerCase() === 'confirmed').length;

            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };

            setText('control-total-users', totalUsers);
            setText('control-managers', managers);
            setText('control-customers', customers);
            setText('control-bookings', overview.bookings.length);
            setText('control-admin-count', `${admins} Admin${admins === 1 ? '' : 's'}`);
            setText('control-manager-share', `${totalUsers ? Math.round((managers / totalUsers) * 100) : 0}% of users`);
            setText('control-customer-share', `${totalUsers ? Math.round((customers / totalUsers) * 100) : 0}% share`);
            setText('control-booking-confirmed', `${confirmed} confirmed`);
        }

        function renderControlTable() {
            const body = document.getElementById('control-user-body');
            if (!body) return;

            const filtered = overview.users.filter(user => {
                const matchesQuery = `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(controlFilters.query);
                const matchesRole = controlFilters.role === 'all' ? true : user.role === controlFilters.role;
                return matchesQuery && matchesRole;
            });

            if (filtered.length === 0) {
                body.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1rem; color: var(--text-muted);">No users match the current filters</td></tr>`;
                return;
            }

            body.innerHTML = filtered.map(user => `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div style="width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; background: ${user.role === 'admin' ? 'rgba(79,70,229,0.15)' : user.role === 'manager' ? 'rgba(245,158,11,0.18)' : 'rgba(59,130,246,0.15)'}; color: var(--dark); font-weight:700;">${user.name.charAt(0).toUpperCase()}</div>
                            <div>
                                <strong>${user.name}</strong>
                                <div style="color: var(--text-muted); font-size:0.9rem;">ID #${user.id}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="pill pill-${user.role}">${user.role.toUpperCase()}</span></td>
                    <td>${user.email}</td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td style="text-align:right;">
                        <div class="row-actions">
                            <button class="btn-chip" onclick="openProfileDrawer(${user.id})"><i class="fas fa-user"></i> Profile</button>
                            <button class="btn-chip ghost" onclick="editUser(${user.id})"><i class="fas fa-user-shield"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function renderControlActivity() {
            const container = document.getElementById('control-activity');
            if (!container) return;
            const recent = overview.bookings.slice(0, 6);

            if (recent.length === 0) {
                container.innerHTML = '<div class="activity-chip" style="background:#fff;">No recent activity</div>';
            } else {
                container.innerHTML = recent.map(item => `
                    <div class="activity-chip">
                        <div class="icon" style="background: ${item.status === 'confirmed' ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : item.status === 'pending' ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'};"><i class="fas fa-bolt"></i></div>
                        <div>
                            <div><strong>${item.tour_title}</strong> • ${item.tourist_name}</div>
                            <div class="meta">${new Date(item.booking_date).toLocaleString()} — ${item.status}</div>
                        </div>
                        <span class="pill" style="margin-left:auto;">$${item.price}</span>
                    </div>
                `).join('');
            }

            const reports = document.getElementById('control-reports');
            if (reports) {
                const pending = overview.bookings.filter(b => (b.status || '').toLowerCase() === 'pending').length;
                const cancelled = overview.bookings.filter(b => (b.status || '').toLowerCase() === 'cancelled').length;
                const managers = overview.users.filter(u => u.role === 'manager').length;
                const toursPerManager = managers ? Math.round((overview.tours.length / managers) * 10) / 10 : 0;

                reports.innerHTML = `
                    <div class="report-pill"><strong>Pending</strong><span>${pending} booking(s)</span></div>
                    <div class="report-pill"><strong>Cancelled</strong><span>${cancelled} booking(s)</span></div>
                    <div class="report-pill"><strong>Tours/Manager</strong><span>${toursPerManager}</span></div>
                    <div class="report-pill"><strong>Admins</strong><span>${overview.users.filter(u => u.role === 'admin').length}</span></div>
                `;
            }
        }

        function openProfileDrawer(userId) {
            const userData = overview.users.find(u => u.id === userId);
            const creating = !userData;

            document.getElementById('profile-id').value = userData ? userData.id : '';
            document.getElementById('profile-name').value = userData ? userData.name : '';
            document.getElementById('profile-email').value = userData ? userData.email : '';
            document.getElementById('profile-role').value = userData ? userData.role : 'customer';
            document.getElementById('profile-password').value = '';
            document.getElementById('profile-mode').value = creating ? 'create' : 'edit';
            document.getElementById('drawer-title').textContent = creating ? 'Add User' : `Edit ${userData.name}`;
            const passHint = document.getElementById('profile-pass-hint');
            if (passHint) {
                passHint.textContent = creating ? '(required)' : '(optional)';
            }
            const passInput = document.getElementById('profile-password');
            if (passInput) {
                passInput.required = creating;
                passInput.placeholder = creating ? 'Set initial password' : 'Leave blank to keep current';
            }

            const drawer = document.getElementById('profile-drawer');
            if (drawer) drawer.classList.remove('hidden');
        }

        function closeProfileDrawer() {
            const drawer = document.getElementById('profile-drawer');
            if (drawer) drawer.classList.add('hidden');
        }

        async function submitProfileUpdate(event) {
            event.preventDefault();
            const mode = document.getElementById('profile-mode').value;
            const payload = {
                id: document.getElementById('profile-id').value ? parseInt(document.getElementById('profile-id').value, 10) : undefined,
                name: document.getElementById('profile-name').value,
                email: document.getElementById('profile-email').value,
                role: document.getElementById('profile-role').value
            };

            const password = document.getElementById('profile-password').value;
            if (password) {
                payload.password = password;
            }

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
                if (!res.ok) throw new Error(data.message || 'Failed to save user');
                notify(mode === 'create' ? 'User created' : 'Profile updated', 'success');
                closeProfileDrawer();
                loadDashboardData();
            } catch (error) {
                notify(error.message, 'error');
            }
        }

        function exportControlReport() {
            if (!overview.users.length) return notify('No data to export.', 'info');
            const headers = ['ID','Name','Email','Role','Joined'];
            const rows = overview.users.map(u => [u.id, u.name, u.email, u.role, new Date(u.created_at).toLocaleDateString()]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `control-report-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Tour drawer helpers
        function openTourDrawer(tourId) {
            const tour = overview.tours.find(t => t.id === tourId);
            const creating = !tour;
            document.getElementById('tour-mode').value = creating ? 'create' : 'edit';
            document.getElementById('tour-id').value = tour ? tour.id : '';
            document.getElementById('tour-title').value = tour ? tour.title : '';
            document.getElementById('tour-location').value = tour ? tour.location : '';
            document.getElementById('tour-price').value = tour ? tour.price : '';
            document.getElementById('tour-date').value = tour ? (tour.schedule_date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
            document.getElementById('tour-drawer-title').textContent = creating ? 'Create Tour' : `Edit ${tour.title}`;

            const guideSelect = document.getElementById('tour-guide');
            if (guideSelect) {
                const guides = overview.users.filter(u => ['manager','admin'].includes(u.role));
                guideSelect.innerHTML = guides.length ? guides.map(g => `<option value="${g.id}">${g.name} (${g.role})</option>`).join('') : '<option value="">No managers/admins available</option>';
                const defaultGuide = tour ? tour.guide_id : (guides[0]?.id || '');
                guideSelect.value = defaultGuide;
            }

            const drawer = document.getElementById('tour-drawer');
            if (drawer) drawer.classList.remove('hidden');
        }

        function closeTourDrawer() {
            const drawer = document.getElementById('tour-drawer');
            if (drawer) drawer.classList.add('hidden');
        }

        async function submitTour(event) {
            event.preventDefault();
            const mode = document.getElementById('tour-mode').value;
            const payload = {
                id: document.getElementById('tour-id').value ? parseInt(document.getElementById('tour-id').value, 10) : undefined,
                guide_id: parseInt(document.getElementById('tour-guide').value, 10),
                title: document.getElementById('tour-title').value,
                location: document.getElementById('tour-location').value,
                price: parseFloat(document.getElementById('tour-price').value),
                schedule_date: document.getElementById('tour-date').value
            };

            if (!Number.isFinite(payload.guide_id)) {
                return notify('Select a guide/manager before saving the tour.', 'error');
            }
            if (!Number.isFinite(payload.price)) {
                return notify('Enter a valid price.', 'error');
            }

            try {
                const endpoint = mode === 'edit' ? '/api/tours/update.php' : '/api/tours/create.php';
                const method = mode === 'edit' ? 'PUT' : 'POST';
                const res = await fetch(endpoint, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to save tour');
                notify(mode === 'edit' ? 'Tour updated' : 'Tour created', 'success');
                closeTourDrawer();
                loadDashboardData();
            } catch (error) {
                notify(error.message, 'error');
            }
        }

        // Quick actions
        function generateReport() {
            notify('Generating monthly report... This would download a PDF report with platform statistics.', 'info');
        }

        function viewAnalytics() {
            switchView('analytics');
        }

        // Logout
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                fetch('/api/auth/logout.php', { method: 'POST' }).finally(() => {
                    localStorage.removeItem('user');
                    window.location.href = 'index.html';
                });
            }
        });
