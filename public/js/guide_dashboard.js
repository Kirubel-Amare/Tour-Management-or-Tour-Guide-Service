
        // Initialize
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'guide') {
            window.location.href = 'login.html';
        }

        // Set user name
        document.getElementById('user-name').textContent = user.name;

        // Demo data
        let demoTours = [
            {
                id: 1,
                title: "Paris Night Walking Tour",
                location: "Paris, France",
                price: 89.99,
                date: "2025-03-15",
                description: "Experience the magic of Paris at night with our guided walking tour through illuminated streets.",
                image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                bookings: 12,
                rating: 4.8,
                maxParticipants: 15,
                duration: 3,
                status: "active"
            },
            {
                id: 2,
                title: "Tokyo Food Adventure",
                location: "Tokyo, Japan",
                price: 129.99,
                date: "2025-03-20",
                description: "Discover hidden food gems in Tokyo's backstreets with our local food expert guide.",
                image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                bookings: 8,
                rating: 4.9,
                maxParticipants: 10,
                duration: 4,
                status: "active"
            }
        ];

        let demoBookings = [
            {
                id: 1,
                customer: "John Smith",
                tour: "Paris Night Walking Tour",
                date: "2025-03-15",
                status: "confirmed",
                amount: 89.99
            },
            {
                id: 2,
                customer: "Emma Wilson",
                tour: "Tokyo Food Adventure",
                date: "2025-03-20",
                status: "pending",
                amount: 129.99
            },
            {
                id: 3,
                customer: "David Lee",
                tour: "Paris Night Walking Tour",
                date: "2025-03-15",
                status: "confirmed",
                amount: 89.99
            }
        ];

        let demoActivity = [
            {
                type: "booking",
                title: "New booking received",
                description: "John Smith booked Paris Night Tour",
                time: "2 hours ago"
            },
            {
                type: "tour",
                title: "Tour published",
                description: "You published Tokyo Food Adventure",
                time: "1 day ago"
            },
            {
                type: "review",
                title: "New review received",
                description: "5-star review for Paris Night Tour",
                time: "2 days ago"
            }
        ];

        // Tab switching
        function switchTab(tabName) {
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.closest('.nav-item').classList.add('active');

            // Update active tab
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none';
            });
            document.getElementById(tabName + '-tab').style.display = 'block';

            // Load tab data
            if (tabName === 'tours') {
                loadTours();
            } else if (tabName === 'bookings') {
                loadBookings();
            }
        }

        // Load all data
        function loadDashboardData() {
            updateStats();
            loadActivity();
            loadRecentBookings();
            loadTours();
        }

        // Update statistics
        function updateStats() {
            const totalTours = demoTours.length;
            const totalBookings = demoTours.reduce((sum, tour) => sum + tour.bookings, 0);
            const totalRevenue = demoTours.reduce((sum, tour) => sum + (tour.price * tour.bookings), 0);
            const avgRating = demoTours.reduce((sum, tour) => sum + tour.rating, 0) / demoTours.length || 0;

            document.getElementById('total-tours').textContent = totalTours;
            document.getElementById('total-bookings').textContent = totalBookings;
            document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
            document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
            document.getElementById('tour-count').textContent = totalTours;
            document.getElementById('booking-count').textContent = totalBookings;
            document.getElementById('month-revenue').textContent = (totalRevenue * 0.3).toFixed(2);
            document.getElementById('conversion-rate').textContent = '24%';
            document.getElementById('avg-rating-sidebar').textContent = avgRating.toFixed(1);
        }

        // Load activity timeline
        function loadActivity() {
            const container = document.getElementById('activity-timeline');
            container.innerHTML = demoActivity.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="fas fa-${activity.type === 'booking' ? 'user-plus' : activity.type === 'tour' ? 'map-marked-alt' : 'star'}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-description">${activity.description}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('');
        }

        // Load recent bookings
        function loadRecentBookings() {
            const container = document.getElementById('recent-bookings');
            container.innerHTML = demoBookings.map(booking => `
                <tr>
                    <td><strong>${booking.customer}</strong></td>
                    <td>${booking.tour}</td>
                    <td>${new Date(booking.date).toLocaleDateString()}</td>
                    <td><span class="booking-status status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
                    <td><strong>$${booking.amount}</strong></td>
                </tr>
            `).join('');
        }

        // Load tours
        function loadTours() {
            const container = document.getElementById('tours-list');
            if (demoTours.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                        <i class="fas fa-compass" style="font-size: 3rem; color: var(--border); margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--text-muted); margin-bottom: 0.5rem;">No Tours Created Yet</h3>
                        <p style="color: var(--text-muted);">Create your first tour to get started!</p>
                        <button class="btn btn-primary" onclick="showCreateTourModal()" style="margin-top: 1rem;">
                            <i class="fas fa-plus"></i> Create Your First Tour
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = demoTours.map(tour => createTourCard(tour)).join('');
            }
        }

        // Create tour card
        function createTourCard(tour) {
            const formattedDate = new Date(tour.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
                <div class="tour-card">
                    <div class="tour-image" style="background-image: url('${tour.image}');">
                        <span class="tour-badge">${tour.status.toUpperCase()}</span>
                    </div>
                    <div class="tour-content">
                        <h3 class="tour-title">${tour.title}</h3>
                        <div class="tour-meta">
                            <span class="tour-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                ${tour.location}
                            </span>
                            <span class="tour-meta-item">
                                <i class="fas fa-clock"></i>
                                ${tour.duration}h
                            </span>
                        </div>
                        <p class="tour-description">${tour.description}</p>
                        <div class="tour-footer">
                            <div class="tour-stats">
                                <div class="tour-price">$${tour.price}</div>
                                <div style="text-align: right;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-star" style="color: var(--warning);"></i>
                                        <span style="font-weight: 600;">${tour.rating}</span>
                                    </div>
                                    <small style="color: var(--text-muted);">${tour.bookings} bookings</small>
                                </div>
                            </div>
                            <div class="tour-actions">
                                <button onclick="editTour(${tour.id})" class="btn btn-primary btn-sm">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="viewTourDetails(${tour.id})" class="btn btn-outline btn-sm" style="border-color: var(--border);">
                                    <i class="fas fa-eye"></i> View
                                </button>
                                <button onclick="deleteTour(${tour.id})" class="btn btn-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Tour actions
        function showCreateTourModal() {
            document.getElementById('create-tour-modal').style.display = 'block';
            document.getElementById('tours-tab').style.display = 'none';
            document.getElementById('dashboard-tab').style.display = 'none';
        }

        function closeCreateTourModal() {
            document.getElementById('create-tour-modal').style.display = 'none';
            document.getElementById('tours-tab').style.display = 'block';
        }

        // Create tour form handler
        document.getElementById('create-tour-form').addEventListener('submit', function (e) {
            e.preventDefault();

            const newTour = {
                id: demoTours.length + 1,
                title: document.getElementById('tour-title').value,
                location: document.getElementById('tour-location').value,
                price: parseFloat(document.getElementById('tour-price').value),
                date: document.getElementById('tour-date').value,
                description: document.getElementById('tour-desc').value,
                image: document.getElementById('tour-image').value || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                bookings: 0,
                rating: 0,
                maxParticipants: parseInt(document.getElementById('tour-max-participants').value),
                duration: parseInt(document.getElementById('tour-duration').value),
                status: "active"
            };

            demoTours.unshift(newTour);

            // Add to activity
            demoActivity.unshift({
                type: "tour",
                title: "Tour published",
                description: `You published ${newTour.title}`,
                time: "Just now"
            });

            alert('Tour created successfully!');
            this.reset();

            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('tour-date').value = tomorrow.toISOString().split('T')[0];

            closeCreateTourModal();
            loadDashboardData();
        });

        function editTour(id) {
            const tour = demoTours.find(t => t.id === id);
            if (tour) {
                document.getElementById('tour-title').value = tour.title;
                document.getElementById('tour-location').value = tour.location;
                document.getElementById('tour-price').value = tour.price;
                document.getElementById('tour-date').value = tour.date;
                document.getElementById('tour-desc').value = tour.description;
                document.getElementById('tour-image').value = tour.image;
                document.getElementById('tour-max-participants').value = tour.maxParticipants;
                document.getElementById('tour-duration').value = tour.duration;

                showCreateTourModal();
                alert('Tour loaded for editing. Update and click "Publish Tour" to save changes.');
            }
        }

        function viewTourDetails(id) {
            const tour = demoTours.find(t => t.id === id);
            if (tour) {
                alert(`Tour Details:\n\nTitle: ${tour.title}\nLocation: ${tour.location}\nPrice: $${tour.price}\nDate: ${new Date(tour.date).toLocaleDateString()}\nBookings: ${tour.bookings}\nRating: ${tour.rating}/5.0`);
            }
        }

        function deleteTour(id) {
            if (confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
                demoTours = demoTours.filter(t => t.id !== id);
                loadDashboardData();
            }
        }

        // Quick actions
        function createNewTour() {
            switchTab('tours');
            showCreateTourModal();
        }

        function viewCalendar() {
            alert('Calendar view would open here. This feature shows all your scheduled tours and bookings.');
        }

        function exportReports() {
            alert('Exporting reports... This would generate a PDF/Excel report of your tours, bookings, and revenue.');
        }

        function sendNewsletter() {
            alert('Newsletter modal would open here. Send updates to your past customers about new tours.');
        }

        // Logout
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function () {
            // Set minimum date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('tour-date').value = tomorrow.toISOString().split('T')[0];
            document.getElementById('tour-date').min = tomorrow.toISOString().split('T')[0];

            // Initialize date picker
            flatpickr("#tour-date", {
                minDate: "today",
                dateFormat: "Y-m-d",
            });

            // Load initial data
            loadDashboardData();
        });
