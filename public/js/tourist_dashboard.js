
        // Initialize
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'tourist') {
            window.location.href = 'login.html';
        }

        // Set user info
        document.getElementById('user-name').textContent = user.name;
        document.getElementById('user-greeting').textContent = user.name.split(' ')[0];

        // Demo data
        let allTours = [
            {
                id: 1,
                title: "Paris Night Walking Tour",
                location: "Paris, France",
                price: 89.99,
                date: "2025-03-15",
                description: "Experience the magic of Paris at night with our guided walking tour through illuminated streets.",
                image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: { name: "Sarah Guide", rating: 4.8 },
                duration: "3 hours",
                groupSize: "Small group (max 12)",
                rating: 4.8,
                reviews: 124,
                category: "Walking Tour",
                highlights: ["Eiffel Tower view", "Local insights", "Hidden gems", "Photo opportunities"]
            },
            {
                id: 2,
                title: "Tokyo Food Adventure",
                location: "Tokyo, Japan",
                price: 129.99,
                date: "2025-03-20",
                description: "Discover hidden food gems in Tokyo's backstreets with our local food expert guide.",
                image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: { name: "Kenji Tanaka", rating: 4.9 },
                duration: "4 hours",
                groupSize: "Private tour",
                rating: 4.9,
                reviews: 89,
                category: "Food Tour",
                highlights: ["Street food tasting", "Local markets", "Cultural insights", "Hands-on experience"]
            },
            {
                id: 3,
                title: "New York City Helicopter Tour",
                location: "New York, USA",
                price: 299.99,
                date: "2025-03-25",
                description: "See the iconic skyline of New York City from a breathtaking helicopter perspective.",
                image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: { name: "Mike Johnson", rating: 4.7 },
                duration: "1 hour",
                groupSize: "Shared flight (max 6)",
                rating: 4.7,
                reviews: 56,
                category: "Adventure",
                highlights: ["Aerial views", "Statue of Liberty", "Central Park", "Professional pilot"]
            }
        ];

        let demoBookings = [
            {
                id: 1,
                tourId: 1,
                tourTitle: "Paris Night Walking Tour",
                date: "2025-03-15",
                status: "confirmed",
                price: 89.99,
                guide: "Sarah Guide",
                participants: 2
            },
            {
                id: 2,
                tourId: 2,
                tourTitle: "Tokyo Food Adventure",
                date: "2025-03-20",
                status: "pending",
                price: 129.99,
                guide: "Kenji Tanaka",
                participants: 1
            }
        ];

        // Load all data
        function loadDashboardData() {
            loadTours();
            loadBookings();
            updateStats();
        }

        // Load tours
        function loadTours() {
            const container = document.getElementById('tours-list');
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;"><span class="loading"></span> Loading tours...</div>';
            
            setTimeout(() => {
                if (allTours.length === 0) {
                    container.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-compass"></i>
                            <h3>No Tours Available</h3>
                            <p>Check back later for new tour offerings.</p>
                        </div>
                    `;
                } else {
                    container.innerHTML = allTours.map(createTourCard).join('');
                    loadRecommendedTours();
                }
            }, 500);
        }

        // Load recommended tours
        function loadRecommendedTours() {
            const container = document.getElementById('recommended-tours');
            const recommended = allTours.slice(0, 2); // First 2 as recommended
            container.innerHTML = recommended.map(createTourCard).join('');
        }

        // Create tour card
        function createTourCard(tour) {
            const formattedDate = new Date(tour.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            return `
                <div class="tour-card">
                    <div class="tour-image" style="background-image: url('${tour.image}');">
                        <span class="tour-badge">${tour.category}</span>
                    </div>
                    <div class="tour-content">
                        <div class="tour-header">
                            <h3 class="tour-title">${tour.title}</h3>
                            <div class="tour-location">
                                <i class="fas fa-map-marker-alt"></i>
                                ${tour.location}
                            </div>
                        </div>
                        
                        <div class="tour-meta">
                            <span class="tour-meta-item">
                                <i class="fas fa-calendar-alt"></i>
                                ${formattedDate}
                            </span>
                            <span class="tour-meta-item">
                                <i class="fas fa-clock"></i>
                                ${tour.duration}
                            </span>
                            <span class="tour-meta-item">
                                <i class="fas fa-star"></i>
                                ${tour.rating} (${tour.reviews})
                            </span>
                        </div>
                        
                        <p class="tour-description">${tour.description}</p>
                        
                        <div class="tour-guide">
                            <div class="guide-avatar">${tour.guide.name.charAt(0)}</div>
                            <div class="guide-info">
                                <h4>${tour.guide.name}</h4>
                                <p>Guide · ${tour.guide.rating}★ Rating</p>
                            </div>
                        </div>
                        
                        <div class="tour-footer">
                            <div class="tour-price">$${tour.price} <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">per person</span></div>
                            <div class="tour-actions">
                                <button onclick="viewTourDetails(${tour.id})" class="btn btn-outline" style="border-color: var(--border);">
                                    <i class="fas fa-info-circle"></i> Details
                                </button>
                                <button onclick="bookTour(${tour.id})" class="btn btn-primary">
                                    <i class="fas fa-calendar-plus"></i> Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Load bookings
        function loadBookings() {
            const container = document.getElementById('bookings-list');
            if (demoBookings.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-calendar-plus" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <p>No bookings yet</p>
                        <p style="font-size: 0.9rem; margin-top: 0.5rem;">Book your first tour to get started!</p>
                    </div>
                `;
            } else {
                container.innerHTML = demoBookings.map(createBookingCard).join('');
            }
            
            updateBookingCount();
            updateNextTrip();
        }

        // Create booking card
        function createBookingCard(booking) {
            const formattedDate = new Date(booking.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            return `
                <div class="booking-item">
                    <div class="booking-header">
                        <div>
                            <div class="booking-title">${booking.tourTitle}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${formattedDate}</div>
                        </div>
                        <span class="booking-status status-${booking.status}">${booking.status}</span>
                    </div>
                    
                    <div class="booking-details">
                        <div class="booking-details-item">
                            <span>Guide:</span>
                            <span style="font-weight: 600;">${booking.guide}</span>
                        </div>
                        <div class="booking-details-item">
                            <span>Participants:</span>
                            <span>${booking.participants}</span>
                        </div>
                        <div class="booking-details-item">
                            <span>Total:</span>
                            <span style="font-weight: 600; color: var(--tourist-primary);">$${booking.price}</span>
                        </div>
                    </div>
                    
                    <div class="booking-actions">
                        <button onclick="cancelBooking(${booking.id})" class="btn btn-danger btn-sm" ${booking.status === 'confirmed' ? '' : 'disabled'} style="opacity: ${booking.status === 'confirmed' ? '1' : '0.5'};">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button onclick="viewBookingDetails(${booking.id})" class="btn btn-outline btn-sm" style="border-color: var(--border);">
                            <i class="fas fa-eye"></i> Details
                        </button>
                    </div>
                </div>
            `;
        }

        // Update statistics
        function updateStats() {
            document.getElementById('total-bookings').textContent = demoBookings.length;
            
            const upcoming = demoBookings.filter(b => new Date(b.date) > new Date()).length;
            document.getElementById('upcoming-tours').textContent = upcoming;
            
            const locations = [...new Set(demoBookings.map(b => b.tourTitle.split(' ').pop()))];
            document.getElementById('countries-visited').textContent = locations.length;
            
            const totalSpent = demoBookings.reduce((sum, b) => sum + b.price, 0);
            document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;
            
            const avgRating = allTours.reduce((sum, t) => sum + t.rating, 0) / allTours.length || 0;
            document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
        }

        function updateBookingCount() {
            document.getElementById('booking-count').textContent = demoBookings.length;
        }

        function updateNextTrip() {
            const nextTrip = demoBookings
                .filter(b => new Date(b.date) > new Date())
                .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
            
            const container = document.getElementById('next-trip');
            if (nextTrip) {
                const formattedDate = new Date(nextTrip.date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });
                container.innerHTML = `
                    <div style="font-weight: 600; color: var(--dark); margin-bottom: 0.25rem;">${nextTrip.tourTitle}</div>
                    <div style="color: var(--tourist-primary); font-size: 0.85rem;">
                        <i class="fas fa-calendar-alt"></i> ${formattedDate}
                    </div>
                `;
            } else {
                container.textContent = 'No upcoming trips';
            }
        }

        // Tour actions
        function viewTourDetails(tourId) {
            const tour = allTours.find(t => t.id === tourId);
            if (!tour) return;
            
            document.getElementById('modal-tour-title').textContent = tour.title;
            
            const formattedDate = new Date(tour.date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            
            document.getElementById('modal-tour-content').innerHTML = `
                <div style="margin-bottom: 1.5rem;">
                    <img src="${tour.image}" alt="${tour.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: var(--radius); margin-bottom: 1rem;">
                    <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 1.5rem;">${tour.description}</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="padding: 0.75rem; background: #f8fafc; border-radius: var(--radius);">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Date</div>
                        <div style="font-weight: 600;">${formattedDate}</div>
                    </div>
                    <div style="padding: 0.75rem; background: #f8fafc; border-radius: var(--radius);">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Duration</div>
                        <div style="font-weight: 600;">${tour.duration}</div>
                    </div>
                    <div style="padding: 0.75rem; background: #f8fafc; border-radius: var(--radius);">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Group Size</div>
                        <div style="font-weight: 600;">${tour.groupSize}</div>
                    </div>
                    <div style="padding: 0.75rem; background: #f8fafc; border-radius: var(--radius);">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">Rating</div>
                        <div style="font-weight: 600; color: var(--tourist-secondary);">${tour.rating} ★ (${tour.reviews} reviews)</div>
                    </div>
                </div>
                
                <h4 style="margin-bottom: 0.75rem; color: var(--dark);">Tour Highlights</h4>
                <ul style="margin-bottom: 1.5rem; padding-left: 1.5rem; color: var(--text-muted);">
                    ${tour.highlights.map(highlight => `<li style="margin-bottom: 0.5rem;">${highlight}</li>`).join('')}
                </ul>
                
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: var(--radius);">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, var(--tourist-accent) 0%, #7c3aed 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.2rem;">
                        ${tour.guide.name.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 600; color: var(--dark);">${tour.guide.name}</div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">Professional Guide</div>
                        <div style="color: var(--tourist-secondary); font-size: 0.85rem;">
                            <i class="fas fa-star"></i> ${tour.guide.rating} Guide Rating
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                    <div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">Price per person</div>
                        <div style="font-size: 2rem; font-weight: 700; color: var(--tourist-primary);">$${tour.price}</div>
                    </div>
                    <button onclick="bookTour(${tour.id}); closeTourModal();" class="btn btn-primary" style="padding: 0.75rem 2rem;">
                        <i class="fas fa-calendar-plus"></i> Book Now
                    </button>
                </div>
            `;
            
            document.getElementById('tour-modal').style.display = 'flex';
        }

        function closeTourModal() {
            document.getElementById('tour-modal').style.display = 'none';
        }

        function bookTour(tourId) {
            const tour = allTours.find(t => t.id === tourId);
            if (!tour) return;
            
            if (confirm(`Book "${tour.title}" for $${tour.price}?`)) {
                const newBooking = {
                    id: demoBookings.length + 1,
                    tourId: tour.id,
                    tourTitle: tour.title,
                    date: tour.date,
                    status: "pending",
                    price: tour.price,
                    guide: tour.guide.name,
                    participants: 1
                };
                
                demoBookings.push(newBooking);
                
                // Add to activity
                alert('Booking request submitted! The guide will confirm your booking soon.');
                
                // Update dashboard
                loadBookings();
                updateStats();
            }
        }

        // Booking actions
        function cancelBooking(bookingId) {
            if (confirm('Are you sure you want to cancel this booking?')) {
                demoBookings = demoBookings.map(b => 
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                );
                loadBookings();
                updateStats();
            }
        }

        function viewBookingDetails(bookingId) {
            const booking = demoBookings.find(b => b.id === bookingId);
            if (!booking) return;
            
            alert(`Booking Details:\n\nTour: ${booking.tourTitle}\nDate: ${new Date(booking.date).toLocaleDateString()}\nStatus: ${booking.status}\nGuide: ${booking.guide}\nParticipants: ${booking.participants}\nTotal: $${booking.price}`);
        }

        // Search and filter
        function searchTours() {
            const query = document.getElementById('search-input').value.toLowerCase();
            filterTours();
        }

        function filterTours() {
            const query = document.getElementById('search-input').value.toLowerCase();
            const locationFilter = document.getElementById('location-filter').value;
            const priceFilter = document.getElementById('price-filter').value;
            const ratingFilter = document.getElementById('rating-filter').value;
            
            let filtered = allTours.filter(tour => {
                // Text search
                if (query && !(
                    tour.title.toLowerCase().includes(query) ||
                    tour.location.toLowerCase().includes(query) ||
                    tour.description.toLowerCase().includes(query) ||
                    tour.guide.name.toLowerCase().includes(query)
                )) return false;
                
                // Location filter
                if (locationFilter && !tour.location.includes(locationFilter)) return false;
                
                // Price filter
                if (priceFilter) {
                    const [min, max] = priceFilter === '500+' ? [500, Infinity] : priceFilter.split('-').map(Number);
                    if (tour.price < min || tour.price > max) return false;
                }
                
                // Rating filter
                if (ratingFilter && tour.rating < parseFloat(ratingFilter)) return false;
                
                return true;
            });
            
            const container = document.getElementById('tours-list');
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No Tours Found</h3>
                        <p>Try adjusting your search or filters</p>
                        <button onclick="clearFilters()" class="btn btn-outline" style="margin-top: 1rem; border-color: var(--border);">
                            Clear Filters
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = filtered.map(createTourCard).join('');
            }
        }

        function clearFilters() {
            document.getElementById('search-input').value = '';
            document.getElementById('location-filter').value = '';
            document.getElementById('price-filter').value = '';
            document.getElementById('rating-filter').value = '';
            loadTours();
        }

        function refreshTours() {
            loadTours();
        }

        function viewAllRecommended() {
            alert('This would show all recommended tours based on your preferences and booking history.');
        }

        // Logout
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            loadDashboardData();
            
            // Close modal when clicking outside
            document.getElementById('tour-modal').addEventListener('click', function(e) {
                if (e.target === this) {
                    closeTourModal();
                }
            });
            
            // Search on Enter key
            document.getElementById('search-input').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchTours();
                }
            });
        });

