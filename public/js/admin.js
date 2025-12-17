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
            hotels: [],
            restaurants: [],
            taxiOrders: [],
            hotelReservations: [],
            restaurantReservations: [],
            stats: {
                total_users: 0,
                total_tours: 0,
                total_bookings: 0,
                revenue: 0
            }
        };

        const userFilters = {
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

            const searchInput = document.getElementById('user-search');
            const roleFilter = document.getElementById('user-role-filter');

            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    userFilters.query = e.target.value.toLowerCase();
                    loadUsers();
                });
            }

            if (roleFilter) {
                roleFilter.addEventListener('change', (e) => {
                    userFilters.role = e.target.value;
                    loadUsers();
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
            } else if (viewName === 'hotels') {
                loadHotels();
            } else if (viewName === 'restaurants') {
                loadRestaurants();
            } else if (viewName === 'taxi') {
                loadTaxiOrders();
            } else if (viewName === 'hotel-reservations') {
                loadHotelReservations();
            } else if (viewName === 'restaurant-reservations') {
                loadRestaurantReservations();
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
                overview.taxiOrders = data.taxi_orders || [];
                overview.hotelReservations = data.hotel_reservations || [];
                overview.restaurantReservations = data.restaurant_reservations || [];
                overview.stats = data.stats || overview.stats;

                document.getElementById('total-users').textContent = overview.stats.total_users;
                document.getElementById('total-tours').textContent = overview.stats.total_tours;
                document.getElementById('total-bookings').textContent = overview.stats.total_bookings;
                document.getElementById('total-revenue').textContent = `$${(overview.stats.revenue || 0).toFixed(2)}`;

                document.getElementById('user-count').textContent = overview.stats.total_users;
                document.getElementById('tour-count').textContent = overview.stats.total_tours;
                document.getElementById('booking-count').textContent = overview.stats.total_bookings;
                const taxiBadge = document.getElementById('taxi-count');
                if (taxiBadge) taxiBadge.textContent = overview.taxiOrders.length || 0;
                const hotelResBadge = document.getElementById('hotel-res-count');
                if (hotelResBadge) hotelResBadge.textContent = overview.hotelReservations.length || 0;
                const restResBadge = document.getElementById('rest-res-count');
                if (restResBadge) restResBadge.textContent = overview.restaurantReservations.length || 0;

                initializeCharts();
                loadActivity();
                loadUsers();
                loadTours();
                loadBookings();
                loadTaxiOrders();
                loadHotelReservations();
                loadRestaurantReservations();

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
            if (!container) return;

            const filtered = overview.users.filter(u => {
                const matchesRole = userFilters.role === 'all' ? true : (u.role === userFilters.role);
                const q = (userFilters.query || '').toLowerCase();
                const matchesQuery = !q ? true : (`${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q));
                return matchesRole && matchesQuery;
            });

            if (filtered.length === 0) {
                container.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                            <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                            <div>No users found</div>
                        </td>
                    </tr>
                `;
                return;
            }

            container.innerHTML = filtered.map(user => `
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
                            <button onclick="viewUser(${user.id})" class="btn btn-outline btn-sm" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editUser(${user.id})" class="btn btn-outline btn-sm" style="border-color: var(--border);" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteUser(${user.id})" class="btn btn-danger btn-sm" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        // Search users
        function searchUsers() {
            userFilters.query = (document.getElementById('user-search')?.value || '').toLowerCase();
            loadUsers();
        }

        function clearUserSearch() {
            const input = document.getElementById('user-search');
            if (input) input.value = '';
            userFilters.query = '';
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

        // Taxi orders
        async function loadTaxiOrders() {
            const body = document.getElementById('taxi-list');
            if (body) body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--text-muted);">Loading...</td></tr>`;
            try {
                const res = await fetch('/api/admin/taxis/read.php');
                const data = await res.json();
                overview.taxiOrders = data || [];
                if (body) {
                    if (!overview.taxiOrders.length) {
                        body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--text-muted);">No taxi orders</td></tr>`;
                    } else {
                        body.innerHTML = overview.taxiOrders.map(t => `
                            <tr>
                                <td>#${t.id}</td>
                                <td>${t.user_name || 'N/A'}<br><small>${t.user_email || ''}</small></td>
                                <td>${t.pickup}</td>
                                <td>${t.destination}</td>
                                <td>${t.vehicle_type}</td>
                                <td>$${(t.fare ?? 0).toFixed(2)}</td>
                                <td><span class="status-badge status-active">${(t.status || 'accepted').toUpperCase()}</span></td>
                                <td>${new Date(t.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('');
                    }
                }
                const badge = document.getElementById('taxi-count');
                if (badge) badge.textContent = overview.taxiOrders.length || 0;
            } catch (e) {
                if (body) body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--danger);">Failed to load taxi orders</td></tr>`;
            }
        }

        // Hotel reservations
        async function loadHotelReservations() {
            const body = document.getElementById('hotel-res-list');
            if (body) body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--text-muted);">Loading...</td></tr>`;
            try {
                const res = await fetch('/api/admin/hotels/reservations.php');
                const data = await res.json();
                overview.hotelReservations = data || [];
                if (body) {
                    if (!overview.hotelReservations.length) {
                        body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--text-muted);">No hotel reservations</td></tr>`;
                    } else {
                        body.innerHTML = overview.hotelReservations.map(r => `
                            <tr>
                                <td>#${r.id}</td>
                                <td>${r.user_name || 'N/A'}<br><small>${r.user_email || ''}</small></td>
                                <td>${r.hotel_name || 'Hotel #' + r.hotel_id}</td>
                                <td>${r.check_in}</td>
                                <td>${r.check_out}</td>
                                <td>${r.guests || 1}</td>
                                <td><span class="status-badge status-active">${(r.status || '').toUpperCase()}</span></td>
                                <td>${new Date(r.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('');
                    }
                }
                const badge = document.getElementById('hotel-res-count');
                if (badge) badge.textContent = overview.hotelReservations.length || 0;
            } catch (e) {
                if (body) body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--danger);">Failed to load hotel reservations</td></tr>`;
            }
        }

        // Restaurant reservations
        async function loadRestaurantReservations() {
            const body = document.getElementById('rest-res-list');
            if (body) body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--text-muted);">Loading...</td></tr>`;
            try {
                const res = await fetch('/api/admin/restaurants/reservations.php');
                const data = await res.json();
                overview.restaurantReservations = data || [];
                if (body) {
                    if (!overview.restaurantReservations.length) {
                        body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--text-muted);">No restaurant reservations</td></tr>`;
                    } else {
                        body.innerHTML = overview.restaurantReservations.map(r => `
                            <tr>
                                <td>#${r.id}</td>
                                <td>${r.user_name || 'N/A'}<br><small>${r.user_email || ''}</small></td>
                                <td>${r.restaurant_name || 'Restaurant #' + r.restaurant_id}</td>
                                <td>${r.date}</td>
                                <td>${r.time}</td>
                                <td>${r.guests || 0}</td>
                                <td><span class="status-badge status-active">${(r.status || '').toUpperCase()}</span></td>
                                <td>${new Date(r.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('');
                    }
                }
                const badge = document.getElementById('rest-res-count');
                if (badge) badge.textContent = overview.restaurantReservations.length || 0;
            } catch (e) {
                if (body) body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1rem; color: var(--danger);">Failed to load restaurant reservations</td></tr>`;
            }
        }

        function searchBookings() {
            const query = document.getElementById('booking-search').value.toLowerCase();
            alert(`Searching bookings for: ${query}\nThis would filter the bookings table.`);
        }

        // Load hotels from services API
        async function loadHotels() {
            const body = document.getElementById('hotels-list');
            if (body) body.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1rem; color: var(--text-muted);">Loading...</td></tr>`;
            try {
                const res = await fetch('/api/services/hotels.php');
                const json = await res.json();
                overview.hotels = json.data || [];
                renderHotels();
                const badge = document.getElementById('hotel-count');
                if (badge) badge.textContent = (overview.hotels || []).length;
            } catch (e) {
                if (body) body.innerHTML = `<tr><td colspan=\"5\" style=\"text-align:center; padding:1rem; color: var(--danger);\">Failed to load hotels</td></tr>`;
            }
        }

        function renderHotels() {
            const body = document.getElementById('hotels-list');
            if (!body) return;
            const items = overview.hotels || [];
            if (!items.length) {
                body.innerHTML = `<tr><td colspan=\"5\" style=\"text-align:center; padding:1rem; color: var(--text-muted);\">No hotels found</td></tr>`;
                return;
            }
            body.innerHTML = items.map(h => `
                <tr>
                    <td>${h.name}</td>
                    <td>${h.location}</td>
                    <td>$${h.price}</td>
                    <td>${(h.rating ?? '-') + '★'}</td>
                    <td style="text-align:right;">
                        <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                            <button class="btn btn-outline btn-sm" onclick="viewHotel(${h.id})" title="View"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-outline btn-sm" onclick="editHotel(${h.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="deleteHotel(${h.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function viewHotel(id) {
            const h = (overview.hotels || []).find(x => x.id == id);
            if (!h) return;
            const details = Object.entries(h).map(([k,v]) => `<div><strong>${k}:</strong> ${Array.isArray(v) ? v.join(', ') : v}</div>`).join('');
            if (window.Popup && Popup.modal) {
                Popup.modal({ title: 'Hotel Details', content: details });
            } else {
                alert(`Hotel Details\n\n${details.replace(/<[^>]+>/g,'')}`);
            }
        }

        // Load restaurants from services API
        async function loadRestaurants() {
            const body = document.getElementById('restaurants-list');
            if (body) body.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1rem; color: var(--text-muted);">Loading...</td></tr>`;
            try {
                const res = await fetch('/api/services/restaurants.php');
                const json = await res.json();
                overview.restaurants = json.data || [];
                renderRestaurants();
                const badge = document.getElementById('restaurant-count');
                if (badge) badge.textContent = (overview.restaurants || []).length;
            } catch (e) {
                if (body) body.innerHTML = `<tr><td colspan=\"5\" style=\"text-align:center; padding:1rem; color: var(--danger);\">Failed to load restaurants</td></tr>`;
            }
        }

        function renderRestaurants() {
            const body = document.getElementById('restaurants-list');
            if (!body) return;
            const items = overview.restaurants || [];
            if (!items.length) {
                body.innerHTML = `<tr><td colspan=\"5\" style=\"text-align:center; padding:1rem; color: var(--text-muted);\">No restaurants found</td></tr>`;
                return;
            }
            body.innerHTML = items.map(r => `
                <tr>
                    <td>${r.name}</td>
                    <td>${r.location}</td>
                    <td>${r.cuisine || '-'}</td>
                    <td>${r.priceRange || r.price_range || '-'}</td>
                    <td style="text-align:right;">
                        <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                            <button class="btn btn-outline btn-sm" onclick="viewRestaurant(${r.id})" title="View"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-outline btn-sm" onclick="editRestaurant(${r.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="btn btn-danger btn-sm" onclick="deleteRestaurant(${r.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        function viewRestaurant(id) {
            const r = (overview.restaurants || []).find(x => x.id == id);
            if (!r) return;
            const details = Object.entries(r).map(([k,v]) => `<div><strong>${k}:</strong> ${Array.isArray(v) ? v.join(', ') : v}</div>`).join('');
            if (window.Popup && Popup.modal) {
                Popup.modal({ title: 'Restaurant Details', content: details });
            } else {
                alert(`Restaurant Details\n\n${details.replace(/<[^>]+>/g,'')}`);
            }
        }
        // User actions
        function addNewUser() {
            openProfileDrawer(null, 'create');
        }

        function editUser(userId) {
            openProfileDrawer(userId, 'edit');
        }

        function viewUser(userId) {
            openProfileDrawer(userId, 'view');
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

        function createNewBooking() {
            openBookingCreateDrawer();
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

        async function deleteBooking(bookingId) {
            const ok = await askConfirm('Delete booking', 'Delete this booking?');
            if (!ok) return;
            try {
                const res = await fetch('/api/admin/bookings/delete.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: bookingId })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed');
                notify('Booking deleted', 'success');
                loadDashboardData();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        // Control Center removed. Unified under Users view filtering and export.

        function openProfileDrawer(userId, mode = null) {
            const userData = overview.users.find(u => u.id === userId);
            let effectiveMode = mode;
            if (!effectiveMode) {
                effectiveMode = userData ? 'edit' : 'create';
            }
            const creating = effectiveMode === 'create';
            const viewing = effectiveMode === 'view';

            const idEl = document.getElementById('profile-id');
            const nameEl = document.getElementById('profile-name');
            const emailEl = document.getElementById('profile-email');
            const roleEl = document.getElementById('profile-role');
            const passEl = document.getElementById('profile-password');
            const modeEl = document.getElementById('profile-mode');
            const titleEl = document.getElementById('drawer-title');
            const passHint = document.getElementById('profile-pass-hint');
            const saveBtn = document.querySelector('#profile-drawer .drawer-footer button[type="submit"]');

            if (idEl) idEl.value = userData ? userData.id : '';
            if (nameEl) nameEl.value = userData ? userData.name : '';
            if (emailEl) emailEl.value = userData ? userData.email : '';
            if (roleEl) roleEl.value = userData ? userData.role : 'customer';
            if (passEl) passEl.value = '';
            if (modeEl) modeEl.value = creating ? 'create' : (viewing ? 'view' : 'edit');

            if (titleEl) titleEl.textContent = creating ? 'Add User' : (viewing ? `View ${userData?.name || ''}` : `Edit ${userData?.name || ''}`);

            if (passHint) {
                passHint.textContent = creating ? '(required)' : '(optional)';
            }
            if (passEl) {
                passEl.required = creating;
                passEl.placeholder = creating ? 'Set initial password' : 'Leave blank to keep current';
                passEl.disabled = viewing;
            }

            // Toggle readonly/disabled for view mode
            [nameEl, emailEl, roleEl].forEach(el => { if (el) el.disabled = viewing; });
            if (saveBtn) saveBtn.style.display = viewing ? 'none' : 'inline-flex';

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

        function exportUsersReport() {
            if (!overview.users.length) return notify('No data to export.', 'info');
            const headers = ['ID','Name','Email','Role','Joined'];
            const rows = overview.users.map(u => [u.id, u.name, u.email, u.role, new Date(u.created_at).toLocaleDateString()]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `users-report-${Date.now()}.csv`;
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
            document.getElementById('tour-image').value = tour ? (tour.image || '') : '';
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
            const imageVal = document.getElementById('tour-image').value;
            if (imageVal) payload.image = imageVal;

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

        // Hotel actions & drawer
        function createNewHotel() {
            openHotelDrawer(null);
        }

        function editHotel(id) {
            openHotelDrawer(id);
        }

        function openHotelDrawer(hotelId) {
            const h = (overview.hotels || []).find(x => x.id == hotelId);
            const creating = !h;
            document.getElementById('hotel-mode').value = creating ? 'create' : 'edit';
            document.getElementById('hotel-id').value = h ? h.id : '';
            document.getElementById('hotel-name').value = h ? (h.name || '') : '';
            document.getElementById('hotel-location').value = h ? (h.location || '') : '';
            document.getElementById('hotel-image').value = h ? (h.image || '') : '';
            document.getElementById('hotel-price').value = h ? (h.price || '') : '';
            document.getElementById('hotel-rating').value = h ? (h.rating || '') : '';
            document.getElementById('hotel-room-type').value = h ? (h.room_type || '') : '';
            document.getElementById('hotel-stars').value = h ? (h.hotel_rating || '') : '';
            document.getElementById('hotel-description').value = h ? (h.description || '') : '';
            document.getElementById('hotel-drawer-title').textContent = creating ? 'Add Hotel' : `Edit ${h?.name || ''}`;
            document.getElementById('hotel-drawer').classList.remove('hidden');
        }

        function closeHotelDrawer() {
            document.getElementById('hotel-drawer').classList.add('hidden');
        }

        async function submitHotel(event) {
            event.preventDefault();
            const mode = document.getElementById('hotel-mode').value;
            const payload = {
                id: document.getElementById('hotel-id').value ? parseInt(document.getElementById('hotel-id').value, 10) : undefined,
                name: document.getElementById('hotel-name').value,
                location: document.getElementById('hotel-location').value,
                image: document.getElementById('hotel-image').value || null,
                price: parseFloat(document.getElementById('hotel-price').value),
                rating: document.getElementById('hotel-rating').value ? parseFloat(document.getElementById('hotel-rating').value) : null,
                room_type: document.getElementById('hotel-room-type').value || null,
                hotel_rating: document.getElementById('hotel-stars').value ? parseInt(document.getElementById('hotel-stars').value, 10) : null,
                description: document.getElementById('hotel-description').value || null
            };
            if (!payload.name || !payload.location || !Number.isFinite(payload.price)) {
                return notify('Name, location and valid price are required.', 'error');
            }
            try {
                const endpoint = mode === 'edit' ? '/api/admin/hotels/update.php' : '/api/admin/hotels/create.php';
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to save hotel');
                notify(mode === 'edit' ? 'Hotel updated' : 'Hotel created', 'success');
                closeHotelDrawer();
                loadHotels();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        async function deleteHotel(id) {
            const ok = await askConfirm('Delete hotel', 'Delete this hotel?');
            if (!ok) return;
            try {
                const res = await fetch('/api/admin/hotels/delete.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed');
                notify('Hotel deleted', 'success');
                loadHotels();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        // Restaurant actions & drawer
        function createNewRestaurant() {
            openRestaurantDrawer(null);
        }

        function editRestaurant(id) {
            openRestaurantDrawer(id);
        }

        function openRestaurantDrawer(restaurantId) {
            const r = (overview.restaurants || []).find(x => x.id == restaurantId);
            const creating = !r;
            document.getElementById('restaurant-mode').value = creating ? 'create' : 'edit';
            document.getElementById('restaurant-id').value = r ? r.id : '';
            document.getElementById('restaurant-name').value = r ? (r.name || '') : '';
            document.getElementById('restaurant-location').value = r ? (r.location || '') : '';
            document.getElementById('restaurant-cuisine').value = r ? (r.cuisine || '') : '';
            document.getElementById('restaurant-image').value = r ? (r.image || '') : '';
            document.getElementById('restaurant-price-range').value = r ? (r.priceRange || r.price_range || '') : '';
            document.getElementById('restaurant-rating').value = r ? (r.rating || '') : '';
            document.getElementById('restaurant-description').value = r ? (r.description || '') : '';
            document.getElementById('restaurant-drawer-title').textContent = creating ? 'Add Restaurant' : `Edit ${r?.name || ''}`;
            document.getElementById('restaurant-drawer').classList.remove('hidden');
        }

        function closeRestaurantDrawer() {
            document.getElementById('restaurant-drawer').classList.add('hidden');
        }

        async function submitRestaurant(event) {
            event.preventDefault();
            const mode = document.getElementById('restaurant-mode').value;
            const payload = {
                id: document.getElementById('restaurant-id').value ? parseInt(document.getElementById('restaurant-id').value, 10) : undefined,
                name: document.getElementById('restaurant-name').value,
                location: document.getElementById('restaurant-location').value,
                cuisine: document.getElementById('restaurant-cuisine').value,
                image: document.getElementById('restaurant-image').value || null,
                price_range: document.getElementById('restaurant-price-range').value || null,
                rating: document.getElementById('restaurant-rating').value ? parseFloat(document.getElementById('restaurant-rating').value) : null,
                description: document.getElementById('restaurant-description').value || null
            };
            if (!payload.name || !payload.location || !payload.cuisine) {
                return notify('Name, location and cuisine are required.', 'error');
            }
            try {
                const endpoint = mode === 'edit' ? '/api/admin/restaurants/update.php' : '/api/admin/restaurants/create.php';
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to save restaurant');
                notify(mode === 'edit' ? 'Restaurant updated' : 'Restaurant created', 'success');
                closeRestaurantDrawer();
                loadRestaurants();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        async function deleteRestaurant(id) {
            const ok = await askConfirm('Delete restaurant', 'Delete this restaurant?');
            if (!ok) return;
            try {
                const res = await fetch('/api/admin/restaurants/delete.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed');
                notify('Restaurant deleted', 'success');
                loadRestaurants();
            } catch (e) {
                notify(e.message, 'error');
            }
        }

        // Booking create drawer
        function openBookingCreateDrawer() {
            // populate selects
            const tourSelect = document.getElementById('create-booking-tour');
            const userSelect = document.getElementById('create-booking-user');
            if (tourSelect) {
                tourSelect.innerHTML = (overview.tours || []).map(t => `<option value="${t.id}">${t.title} (${t.location})</option>`).join('');
            }
            if (userSelect) {
                const customers = (overview.users || []).filter(u => u.role === 'customer');
                userSelect.innerHTML = customers.length ? customers.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('') : '<option value="">No customers</option>';
            }
            document.getElementById('booking-create-drawer').classList.remove('hidden');
        }

        function closeBookingCreateDrawer() {
            document.getElementById('booking-create-drawer').classList.add('hidden');
        }

        async function submitBookingCreate(event) {
            event.preventDefault();
            const tour_id = parseInt(document.getElementById('create-booking-tour').value, 10);
            const user_id = parseInt(document.getElementById('create-booking-user').value, 10);
            if (!Number.isFinite(tour_id) || !Number.isFinite(user_id)) {
                return notify('Select valid tour and customer.', 'error');
            }
            try {
                const res = await fetch('/api/bookings/create.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tour_id, user_id })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to create booking');
                notify('Booking created', 'success');
                closeBookingCreateDrawer();
                loadDashboardData();
            } catch (e) {
                notify(e.message, 'error');
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
