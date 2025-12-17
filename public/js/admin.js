 // Initialize
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            window.location.href = 'login.html';
        }

        // Set admin info
        document.getElementById('admin-name').textContent = user.name;
        document.getElementById('admin-greeting').textContent = user.name.split(' ')[0];

        // Demo data
        let demoUsers = [
            { id: 1, name: "John Tourist", email: "john@example.com", role: "tourist", status: "active", joined: "2024-01-15" },
            { id: 2, name: "Sarah Guide", email: "sarah@example.com", role: "guide", status: "active", joined: "2024-01-10" },
            { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "tourist", status: "pending", joined: "2024-02-01" },
            { id: 4, name: "Emma Wilson", email: "emma@example.com", role: "guide", status: "active", joined: "2024-01-20" },
            { id: 5, name: "Admin User", email: "admin@example.com", role: "admin", status: "active", joined: "2024-01-01" }
        ];

        let demoTours = [
            { id: 1, title: "Paris Night Tour", location: "Paris, France", guide: "Sarah Guide", price: 89.99, status: "active", bookings: 12, category: "Cultural" },
            { id: 2, title: "Tokyo Food Adventure", location: "Tokyo, Japan", guide: "Kenji Tanaka", price: 129.99, status: "active", bookings: 8, category: "Food" },
            { id: 3, title: "New York Helicopter", location: "New York, USA", guide: "Mike Johnson", price: 299.99, status: "pending", bookings: 3, category: "Adventure" },
            { id: 4, title: "Bali Waterfalls", location: "Bali, Indonesia", guide: "Made Wijaya", price: 79.99, status: "active", bookings: 15, category: "Nature" }
        ];

        let demoBookings = [
            { id: 1, tourist: "John Tourist", tour: "Paris Night Tour", date: "2024-03-15", status: "confirmed", amount: 89.99 },
            { id: 2, tourist: "Emma Wilson", tour: "Tokyo Food Adventure", date: "2024-03-20", status: "pending", amount: 129.99 },
            { id: 3, tourist: "Mike Johnson", tour: "New York Helicopter", date: "2024-03-25", status: "confirmed", amount: 299.99 },
            { id: 4, tourist: "Sarah Guide", tour: "Bali Waterfalls", date: "2024-04-05", status: "cancelled", amount: 79.99 }
        ];

        let demoActivity = [
            { type: "user", title: "New user registered", description: "Mike Johnson joined as a tourist", time: "2 hours ago" },
            { type: "tour", title: "Tour published", description: "Paris Night Tour was created", time: "1 day ago" },
            { type: "booking", title: "New booking", description: "John booked Tokyo Food Adventure", time: "2 days ago" },
            { type: "review", title: "New review", description: "5-star review for Paris Night Tour", time: "3 days ago" },
            { type: "user", title: "User role updated", description: "Emma Wilson promoted to guide", time: "4 days ago" }
        ];

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', () => {
            loadDashboardData();
            initializeCharts();
            loadActivity();
            
            // Set last updated time
            document.getElementById('last-updated').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
        function loadDashboardData() {
            document.getElementById('total-users').textContent = demoUsers.length;
            document.getElementById('total-tours').textContent = demoTours.length;
            document.getElementById('total-bookings').textContent = demoBookings.length;
            
            const totalRevenue = demoBookings.reduce((sum, booking) => sum + booking.amount, 0);
            document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
            
            // Update sidebar counts
            document.getElementById('user-count').textContent = demoUsers.length;
            document.getElementById('tour-count').textContent = demoTours.length;
            document.getElementById('booking-count').textContent = demoBookings.length;
        }

        // Initialize charts
        function initializeCharts() {
            // Revenue Chart
            const revenueCtx = document.getElementById('revenueChart').getContext('2d');
            new Chart(revenueCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Revenue',
                        data: [12000, 19000, 15000, 25000, 22000, 30000],
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
                    labels: ['Tourists', 'Guides', 'Admins'],
                    datasets: [{
                        data: [8, 4, 1],
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
            container.innerHTML = demoActivity.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="fas fa-${activity.type === 'user' ? 'user-plus' : activity.type === 'tour' ? 'map-marked-alt' : activity.type === 'booking' ? 'calendar-plus' : 'star'}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">${activity.description}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
        }

        // Load users
        function loadUsers() {
            const container = document.getElementById('users-list');
            container.innerHTML = demoUsers.map(user => `
                <tr>
                    <td>#${user.id}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div style="width: 36px; height: 36px; background: ${user.role === 'admin' ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' : user.role === 'guide' ? 'linear-gradient(135deg, var(--secondary) 0%, #d97706 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                ${user.name.charAt(0)}
                            </div>
                            <span style="font-weight: 500;">${user.name}</span>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="status-badge ${user.role === 'admin' ? 'status-active' : user.role === 'guide' ? 'status-pending' : 'status-inactive'}">
                            ${user.role.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-pending'}">
                            ${user.status.toUpperCase()}
                        </span>
                    </td>
                    <td>${new Date(user.joined).toLocaleDateString()}</td>
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
            const filtered = demoUsers.filter(user => 
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
                        <td>${user.status.toUpperCase()}</td>
                        <td>${new Date(user.joined).toLocaleDateString()}</td>
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
            if (demoTours.length === 0) {
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
                                ${demoTours.map(tour => `
                                    <tr>
                                        <td>#${tour.id}</td>
                                        <td><strong>${tour.title}</strong></td>
                                        <td>${tour.location}</td>
                                        <td>${tour.guide}</td>
                                        <td>
                                            <span class="status-badge" style="background: ${tour.category === 'Cultural' ? 'rgba(79, 70, 229, 0.1)' : tour.category === 'Food' ? 'rgba(245, 158, 11, 0.1)' : tour.category === 'Adventure' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${tour.category === 'Cultural' ? 'var(--primary)' : tour.category === 'Food' ? 'var(--secondary)' : tour.category === 'Adventure' ? '#3b82f6' : '#10b981'};">${tour.category}</span>
                                        </td>
                                        <td><strong>$${tour.price}</strong></td>
                                        <td>
                                            <span class="status-badge ${tour.status === 'active' ? 'status-active' : 'status-pending'}">
                                                ${tour.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>${tour.bookings}</td>
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
            if (demoBookings.length === 0) {
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
                                ${demoBookings.map(booking => `
                                    <tr>
                                        <td>#${booking.id}</td>
                                        <td>${booking.tourist}</td>
                                        <td>${booking.tour}</td>
                                        <td>${new Date(booking.date).toLocaleDateString()}</td>
                                        <td>
                                            <span class="status-badge ${booking.status === 'confirmed' ? 'status-active' : booking.status === 'pending' ? 'status-pending' : 'status-inactive'}">
                                                ${booking.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td><strong>$${booking.amount}</strong></td>
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
            const user = demoUsers.find(u => u.id === userId);
            if (user) {
                alert(`Edit user: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nStatus: ${user.status}`);
            }
        }

        function deleteUser(userId) {
            if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                demoUsers = demoUsers.filter(u => u.id !== userId);
                loadUsers();
                loadDashboardData();
            }
        }

        // Tour actions
        function createNewTour() {
            alert('Create New Tour form would open here');
        }

        function editTour(tourId) {
            const tour = demoTours.find(t => t.id === tourId);
            if (tour) {
                alert(`Edit tour: ${tour.title}\nLocation: ${tour.location}\nPrice: $${tour.price}\nStatus: ${tour.status}`);
            }
        }

        function deleteTour(tourId) {
            if (confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
                demoTours = demoTours.filter(t => t.id !== tourId);
                loadTours();
                loadDashboardData();
            }
        }

        // Booking actions
        function viewBooking(bookingId) {
            const booking = demoBookings.find(b => b.id === bookingId);
            if (booking) {
                alert(`Booking Details:\n\nTourist: ${booking.tourist}\nTour: ${booking.tour}\nDate: ${booking.date}\nStatus: ${booking.status}\nAmount: $${booking.amount}`);
            }
        }

        function updateBooking(bookingId) {
            const booking = demoBookings.find(b => b.id === bookingId);
            if (booking) {
                alert(`Update booking status for: ${booking.tour}`);
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
