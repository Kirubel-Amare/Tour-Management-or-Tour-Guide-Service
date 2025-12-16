 // Demo tours data
        const demoTours = [
            {
                id: 1,
                title: "Paris Night Walking Tour",
                location: "Paris, France",
                schedule_date: "2025-03-15",
                description: "Experience the magic of Paris at night with our guided walking tour through illuminated streets.",
                price: 89.99,
                rating: 4.8,
                reviews: 124,
                duration: "3 hours",
                category: "Cultural",
                image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: "Sarah Guide",
                groupSize: "Small group (max 12)"
            },
            {
                id: 2,
                title: "Tokyo Food Adventure",
                location: "Tokyo, Japan",
                schedule_date: "2025-03-20",
                description: "Discover hidden food gems in Tokyo's backstreets with our local food expert guide.",
                price: 129.99,
                rating: 4.9,
                reviews: 89,
                duration: "4 hours",
                category: "Food",
                image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: "Kenji Tanaka",
                groupSize: "Private tour"
            },
            {
                id: 3,
                title: "New York City Helicopter Tour",
                location: "New York, USA",
                schedule_date: "2025-03-25",
                description: "See the iconic skyline of New York City from a breathtaking helicopter perspective.",
                price: 299.99,
                rating: 4.7,
                reviews: 56,
                duration: "1 hour",
                category: "Adventure",
                image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: "Mike Johnson",
                groupSize: "Shared flight (max 6)"
            },
            {
                id: 4,
                title: "Roman Colosseum & Ancient Rome Tour",
                location: "Rome, Italy",
                schedule_date: "2025-04-10",
                description: "Step back in time and explore the ancient ruins of Rome with an expert historian guide.",
                price: 159.99,
                rating: 4.9,
                reviews: 203,
                duration: "3.5 hours",
                category: "Historical",
                image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: "Marco Rossi",
                groupSize: "Small group (max 15)"
            },
            {
                id: 5,
                title: "Bali Waterfall Adventure",
                location: "Bali, Indonesia",
                schedule_date: "2025-04-05",
                description: "Discover hidden waterfalls and lush jungles in this full-day Balinese adventure.",
                price: 79.99,
                rating: 4.8,
                reviews: 94,
                duration: "8 hours",
                category: "Nature",
                image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: "Made Wijaya",
                groupSize: "Small group (max 10)"
            },
            {
                id: 6,
                title: "Sydney Opera House & Harbor Tour",
                location: "Sydney, Australia",
                schedule_date: "2025-04-15",
                description: "Experience Sydney's iconic landmarks including a guided tour inside the Opera House.",
                price: 149.99,
                rating: 4.8,
                reviews: 167,
                duration: "4 hours",
                category: "Cultural",
                image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                guide: "James Wilson",
                groupSize: "Small group (max 12)"
            }
        ];

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadTours();
            setupEventListeners();
        });

        // Load tours
        function loadTours() {
            const container = document.getElementById('tours-container');
            
            // Simulate API delay
            setTimeout(() => {
                container.innerHTML = demoTours.map(createTourCard).join('');
                updateResultsCount(demoTours.length);
                
                // Load featured tours (first 3 as featured)
                const featuredContainer = document.getElementById('featured-tours');
                const featured = demoTours.slice(0, 3);
                featuredContainer.innerHTML = featured.map(createTourCard).join('');
            }, 1000);
        }

        // Create tour card
        function createTourCard(tour) {
            const formattedDate = new Date(tour.schedule_date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            
            return `
                <div class="tour-card-enhanced">
                    <div class="tour-image-container">
                        <img src="${tour.image}" alt="${tour.title}" class="tour-image">
                        <span class="tour-badge">${tour.category}</span>
                    </div>
                    <div class="tour-info">
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
                                <i class="fas fa-user-friends"></i>
                                ${tour.groupSize}
                            </span>
                        </div>
                        
                        <p class="tour-description">${tour.description}</p>
                        
                        <div class="tour-footer">
                            <div class="tour-price-container">
                                <div class="tour-price">$${tour.price}</div>
                                <div class="tour-rating">
                                    <i class="fas fa-star"></i>
                                    ${tour.rating} (${tour.reviews})
                                </div>
                            </div>
                            
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

        // Setup event listeners
        function setupEventListeners() {
            const searchInput = document.getElementById('search-input');
            const searchBtn = document.getElementById('search-btn');
            const clearBtn = document.getElementById('clear-filters');
            
            // Search on button click
            searchBtn.addEventListener('click', filterTours);
            
            // Search on Enter key
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    filterTours();
                }
            });
            
            // Clear filters
            clearBtn.addEventListener('click', clearFilters);
            
            // Filter on select change
            ['destination-filter', 'price-filter', 'date-filter', 'category-filter'].forEach(id => {
                document.getElementById(id).addEventListener('change', filterTours);
            });
        }

        // Filter tours
        function filterTours() {
            const searchQuery = document.getElementById('search-input').value.toLowerCase();
            const destination = document.getElementById('destination-filter').value;
            const priceRange = document.getElementById('price-filter').value;
            const dateFilter = document.getElementById('date-filter').value;
            const category = document.getElementById('category-filter').value;
            
            let filtered = demoTours.filter(tour => {
                // Search query
                if (searchQuery && !(
                    tour.title.toLowerCase().includes(searchQuery) ||
                    tour.location.toLowerCase().includes(searchQuery) ||
                    tour.description.toLowerCase().includes(searchQuery) ||
                    tour.guide.toLowerCase().includes(searchQuery)
                )) return false;
                
                // Destination filter
                if (destination && !tour.location.includes(destination)) return false;
                
                // Price filter
                if (priceRange) {
                    const [min, max] = priceRange === '500+' ? [500, Infinity] : priceRange.split('-').map(Number);
                    if (tour.price < min || tour.price > max) return false;
                }
                
                // Date filter
                if (dateFilter) {
                    const tourDate = new Date(tour.schedule_date);
                    const now = new Date();
                    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
                    const next3Months = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
                    
                    if (dateFilter === 'this-month' && tourDate.getMonth() !== now.getMonth()) return false;
                    if (dateFilter === 'next-month' && tourDate.getMonth() !== nextMonth.getMonth()) return false;
                    if (dateFilter === 'next-3-months' && tourDate > next3Months) return false;
                }
                
                // Category filter
                if (category && tour.category !== category) return false;
                
                return true;
            });
            
            displayFilteredTours(filtered);
        }

        // Display filtered tours
        function displayFilteredTours(tours) {
            const container = document.getElementById('tours-container');
            
            if (tours.length === 0) {
                container.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No Tours Found</h3>
                        <p>Try adjusting your search criteria or clear filters</p>
                        <button onclick="clearFilters()" class="btn btn-outline" style="margin-top: 1rem; border-color: var(--border);">
                            Clear All Filters
                        </button>
                    </div>
                `;
            } else {
                container.innerHTML = tours.map(createTourCard).join('');
            }
            
            updateResultsCount(tours.length);
        }

        // Update results count
        function updateResultsCount(count) {
            const countElement = document.getElementById('results-count');
            if (count === 0) {
                countElement.textContent = 'No tours found';
            } else if (count === 1) {
                countElement.textContent = '1 tour found';
            } else {
                countElement.textContent = `${count} tours found`;
            }
        }

        // Clear all filters
        function clearFilters() {
            document.getElementById('search-input').value = '';
            document.getElementById('destination-filter').value = '';
            document.getElementById('price-filter').value = '';
            document.getElementById('date-filter').value = '';
            document.getElementById('category-filter').value = '';
            
            const container = document.getElementById('tours-container');
            container.innerHTML = demoTours.map(createTourCard).join('');
            updateResultsCount(demoTours.length);
        }

        // Tour actions
        function viewTourDetails(tourId) {
            const tour = demoTours.find(t => t.id === tourId);
            if (!tour) return;
            
            alert(`Tour Details:\n\n${tour.title}\nLocation: ${tour.location}\nDate: ${new Date(tour.schedule_date).toLocaleDateString()}\nDuration: ${tour.duration}\nPrice: $${tour.price}\nGuide: ${tour.guide}\n\n${tour.description}`);
        }

        function bookTour(tourId) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login or register to book tours.');
                window.location.href = 'login.html';
                return;
            }
            
            const tour = demoTours.find(t => t.id === tourId);
            if (!tour) return;
            
            if (confirm(`Book "${tour.title}" for $${tour.price}?`)) {
                alert('Booking request sent! Please check your email for confirmation.');
            }
        }
