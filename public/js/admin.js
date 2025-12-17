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

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            loadDashboardData();
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

                if (loading) {
                    loading.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
            } catch (error) {
                console.error('Error loading admin overview', error);
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
                                                ${booking.status.toUpperCase()}
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
            alert('Add New User form would open here');
        }

        function editUser(userId) {
            const user = overview.users.find(u => u.id === userId);
            if (user) {
                alert(`Edit user: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}`);
            }
        }

        function deleteUser(userId) {
            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                alert('User deletion is not implemented yet.');
            }
        }

        // Tour actions
        function createNewTour() {
            alert('Create New Tour form would open here');
        }

        function editTour(tourId) {
            const tour = overview.tours.find(t => t.id === tourId);
            if (tour) {
                alert(`Edit tour: ${tour.title}\nLocation: ${tour.location}\nPrice: $${tour.price}`);
            }
        }

        function deleteTour(tourId) {
            if (confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
                alert('Tour deletion is not implemented yet.');
            }
        }

        // Booking actions
        function viewBooking(bookingId) {
            const booking = overview.bookings.find(b => b.id === bookingId);
            if (booking) {
                alert(`Booking Details:\n\nTourist: ${booking.tourist_name}\nTour: ${booking.tour_title}\nBooked: ${new Date(booking.booking_date).toLocaleString()}\nStatus: ${booking.status}\nAmount: $${booking.price}`);
            }
        }

        function updateBooking(bookingId) {
            const booking = overview.bookings.find(b => b.id === bookingId);
            if (booking) {
                alert(`Update booking status for: ${booking.tour_title}`);
            }
        }

        // Quick actions
        function generateReport() {
            alert('Generating monthly report... This would download a PDF report with platform statistics.');
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
