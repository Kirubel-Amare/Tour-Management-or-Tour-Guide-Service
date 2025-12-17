// Demo data for all services
        const demoPlaces = [
            {
                id: 1,
                name: "Paris, France",
                type: "City",
                continent: "Europe",
                climate: "Temperate",
                description: "The romantic capital of France, known for its art, fashion, and cuisine.",
                image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                rating: 4.8,
                reviews: 1245,
                features: ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Champs-Élysées"]
            },
            {
                id: 2,
                name: "Bali, Indonesia",
                type: "Beach",
                continent: "Asia",
                climate: "Tropical",
                description: "Tropical paradise known for its forested volcanic mountains, iconic rice paddies, beaches and coral reefs.",
                image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                rating: 4.9,
                reviews: 892,
                features: ["Ubud", "Kuta Beach", "Tanah Lot", "Uluwatu Temple"]
            },
            {
                id: 3,
                name: "Tokyo, Japan",
                type: "City",
                continent: "Asia",
                climate: "Temperate",
                description: "Vibrant metropolis blending ultramodern and traditional, from neon-lit skyscrapers to historic temples.",
                image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                rating: 4.7,
                reviews: 1103,
                features: ["Shibuya Crossing", "Tokyo Tower", "Senso-ji Temple", "Meiji Shrine"]
            }
        ];

        const demoTours = [
            {
                id: 1,
                title: "Paris Night Walking Tour",
                location: "Paris, France",
                price: 89.99,
                duration: "3 hours",
                rating: 4.8,
                reviews: 124,
                description: "Experience the magic of Paris at night with our guided walking tour through illuminated streets.",
                image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                features: ["Eiffel Tower view", "Local insights", "Hidden gems", "Photo opportunities"]
            },
            {
                id: 2,
                title: "Tokyo Food Adventure",
                location: "Tokyo, Japan",
                price: 129.99,
                duration: "4 hours",
                rating: 4.9,
                reviews: 89,
                description: "Discover hidden food gems in Tokyo's backstreets with our local food expert guide.",
                image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                features: ["Street food tasting", "Local markets", "Cultural insights", "Hands-on experience"]
            }
        ];

        const demoHotels = [
            {
                id: 1,
                name: "Paris Luxury Hotel",
                location: "Paris, France",
                price: 299.99,
                rating: 4.8,
                reviews: 456,
                description: "5-star hotel in the heart of Paris with panoramic views of the Eiffel Tower.",
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                roomType: "Suite",
                hotelRating: 5,
                amenities: ["Wi-Fi", "Pool", "Spa", "Restaurant", "Gym"]
            },
            {
                id: 2,
                name: "Tokyo Central Hotel",
                location: "Tokyo, Japan",
                price: 199.99,
                rating: 4.6,
                reviews: 321,
                description: "Modern hotel located in central Tokyo with easy access to all major attractions.",
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                roomType: "Double",
                hotelRating: 4,
                amenities: ["Wi-Fi", "Restaurant", "Concierge", "Laundry"]
            }
        ];

        const demoRestaurants = [
            {
                id: 1,
                name: "Le Gourmet Paris",
                location: "Paris, France",
                cuisine: "French",
                priceRange: "$$$$",
                rating: 4.9,
                reviews: 287,
                description: "Michelin-starred restaurant offering exquisite French cuisine with a modern twist.",
                image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                features: ["Fine dining", "Wine pairing", "Romantic ambiance", "Chef's table"]
            },
            {
                id: 2,
                name: "Tokyo Sushi Master",
                location: "Tokyo, Japan",
                cuisine: "Japanese",
                priceRange: "$$$",
                rating: 4.8,
                reviews: 412,
                description: "Authentic sushi experience with fresh ingredients and master chefs.",
                image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                features: ["Omakase", "Sushi bar", "Fresh seafood", "Traditional"]
            }
        ];

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            loadPlaces();
            loadTours();
            loadHotels();
            loadRestaurants();
            
            // Setup event listeners
            setupEventListeners();
            
            // Check login status
            const user = JSON.parse(localStorage.getItem('user'));
            const authLinks = document.getElementById('auth-links');
            const userLinks = document.getElementById('user-links');

            if (user && authLinks && userLinks) {
                authLinks.style.display = 'none';
                userLinks.style.display = 'inline-block';
            }
        });

        // Switch between services
        function switchService(serviceName) {
            // Update active tab
            document.querySelectorAll('.service-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.closest('.service-tab').classList.add('active');

            // Hide all sections and show selected
            document.querySelectorAll('.service-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${serviceName}-section`).classList.add('active');

            // Scroll to section
            document.getElementById(`${serviceName}-section`).scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Setup event listeners
        function setupEventListeners() {
            // Taxi booking form
            document.getElementById('schedule').addEventListener('change', function() {
                document.getElementById('custom-time').style.display = 
                    this.value === 'custom' ? 'block' : 'none';
            });
            
            // Calculate fare on vehicle type change
            document.getElementById('vehicle-type').addEventListener('change', calculateFare);
        }

        // Load places
        function loadPlaces() {
            const container = document.getElementById('places-list');
            container.innerHTML = demoPlaces.map(createPlaceCard).join('');
        }

        function createPlaceCard(place) {
            return `
                <div class="service-card">
                    <div class="service-image" style="background-image: url('${place.image}');">
                        <span class="service-badge">${place.type}</span>
                    </div>
                    <div class="service-content">
                        <h3 class="service-title">
                            ${place.name}
                            <span class="service-rating">
                                <i class="fas fa-star"></i> ${place.rating}
                            </span>
                        </h3>
                        <div class="service-location">
                            <i class="fas fa-globe"></i>
                            ${place.continent} • ${place.climate}
                        </div>
                        <p class="service-description">${place.description}</p>
                        <div class="service-features">
                            ${place.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        </div>
                        <div class="service-footer">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <small style="color: var(--text-muted);">${place.reviews} reviews</small>
                                </div>
                                <button onclick="viewPlaceDetails(${place.id})" class="btn btn-outline" style="border-color: var(--border);">
                                    <i class="fas fa-eye"></i> Explore
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Load tours
        function loadTours() {
            const container = document.getElementById('tours-list');
            container.innerHTML = demoTours.map(createTourCard).join('');
        }

        function createTourCard(tour) {
            return `
                <div class="service-card">
                    <div class="service-image" style="background-image: url('${tour.image}');">
                        <span class="service-badge">Tour</span>
                    </div>
                    <div class="service-content">
                        <h3 class="service-title">
                            ${tour.title}
                            <span class="service-rating">
                                <i class="fas fa-star"></i> ${tour.rating}
                            </span>
                        </h3>
                        <div class="service-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${tour.location} • ${tour.duration}
                        </div>
                        <p class="service-description">${tour.description}</p>
                        <div class="service-features">
                            ${tour.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        </div>
                        <div class="service-footer">
                            <div class="service-price">$${tour.price} <span style="font-size: 0.9rem; color: var(--text-muted);">per person</span></div>
                            <div class="service-actions">
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

        // Load hotels
        function loadHotels() {
            const container = document.getElementById('hotels-list');
            container.innerHTML = demoHotels.map(createHotelCard).join('');
        }

        function createHotelCard(hotel) {
            return `
                <div class="service-card">
                    <div class="service-image" style="background-image: url('${hotel.image}');">
                        <span class="service-badge">${hotel.hotelRating}★</span>
                    </div>
                    <div class="service-content">
                        <h3 class="service-title">
                            ${hotel.name}
                            <span class="service-rating">
                                <i class="fas fa-star"></i> ${hotel.rating}
                            </span>
                        </h3>
                        <div class="service-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${hotel.location} • ${hotel.roomType} Room
                        </div>
                        <p class="service-description">${hotel.description}</p>
                        <div class="hotel-amenities">
                            ${hotel.amenities.map(amenity => `
                                <div class="amenity-item">
                                    <i class="fas fa-check"></i> ${amenity}
                                </div>
                            `).join('')}
                        </div>
                        <div class="service-footer">
                            <div class="service-price">$${hotel.price} <span style="font-size: 0.9rem; color: var(--text-muted);">per night</span></div>
                            <div class="service-actions">
                                <button onclick="viewHotelDetails(${hotel.id})" class="btn btn-outline" style="border-color: var(--border);">
                                    <i class="fas fa-info-circle"></i> Details
                                </button>
                                <button onclick="bookHotel(${hotel.id})" class="btn btn-primary">
                                    <i class="fas fa-bed"></i> Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Load restaurants
        function loadRestaurants() {
            const container = document.getElementById('restaurants-list');
            container.innerHTML = demoRestaurants.map(createRestaurantCard).join('');
        }

        function createRestaurantCard(restaurant) {
            return `
                <div class="service-card">
                    <div class="service-image" style="background-image: url('${restaurant.image}');">
                        <span class="service-badge">${restaurant.cuisine}</span>
                    </div>
                    <div class="service-content">
                        <h3 class="service-title">
                            ${restaurant.name}
                            <span class="service-rating">
                                <i class="fas fa-star"></i> ${restaurant.rating}
                            </span>
                        </h3>
                        <div class="service-location">
                            <i class="fas fa-map-marker-alt"></i>
                            ${restaurant.location} • ${restaurant.priceRange}
                        </div>
                        <p class="service-description">${restaurant.description}</p>
                        <div class="service-features">
                            ${restaurant.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                        </div>
                        <div class="service-footer">
                            <div class="service-actions">
                                <button onclick="viewRestaurantDetails(${restaurant.id})" class="btn btn-outline" style="border-color: var(--border);">
                                    <i class="fas fa-info-circle"></i> Details
                                </button>
                                <button onclick="bookRestaurant(${restaurant.id})" class="btn btn-primary">
                                    <i class="fas fa-utensils"></i> Reserve Table
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Search functions
        function searchPlaces() {
            const query = document.getElementById('places-search').value.toLowerCase();
            alert(`Searching places for: ${query}\nThis would filter the places list.`);
        }

        function searchTours() {
            const query = document.getElementById('tours-search').value.toLowerCase();
            alert(`Searching tours for: ${query}\nThis would filter the tours list.`);
        }

        function searchHotels() {
            const query = document.getElementById('hotels-search').value.toLowerCase();
            alert(`Searching hotels for: ${query}\nThis would filter the hotels list.`);
        }

        function searchRestaurants() {
            const query = document.getElementById('restaurants-search').value.toLowerCase();
            alert(`Searching restaurants for: ${query}\nThis would filter the restaurants list.`);
        }

        // Filter functions
        function filterPlaces() {
            const continent = document.getElementById('continent-filter').value;
            const type = document.getElementById('type-filter').value;
            const climate = document.getElementById('climate-filter').value;
            alert(`Filtering places by:\nContinent: ${continent}\nType: ${type}\nClimate: ${climate}`);
        }

        function filterTours() {
            // Similar implementation for tours
        }

        function filterHotels() {
            // Similar implementation for hotels
        }

        function filterRestaurants() {
            // Similar implementation for restaurants
        }

        // View details functions
        function viewPlaceDetails(placeId) {
            const place = demoPlaces.find(p => p.id === placeId);
            if (place) {
                alert(`Place Details:\n\n${place.name}\nType: ${place.type}\nContinent: ${place.continent}\nClimate: ${place.climate}\nRating: ${place.rating}★\n\n${place.description}`);
            }
        }

        function viewTourDetails(tourId) {
            const tour = demoTours.find(t => t.id === tourId);
            if (tour) {
                alert(`Tour Details:\n\n${tour.title}\nLocation: ${tour.location}\nDuration: ${tour.duration}\nPrice: $${tour.price}\nRating: ${tour.rating}★\n\n${tour.description}`);
            }
        }

        function viewHotelDetails(hotelId) {
            const hotel = demoHotels.find(h => h.id === hotelId);
            if (hotel) {
                alert(`Hotel Details:\n\n${hotel.name}\nLocation: ${hotel.location}\nPrice: $${hotel.price}/night\nRating: ${hotel.rating}★\nHotel Stars: ${hotel.hotelRating}★\nRoom Type: ${hotel.roomType}\n\n${hotel.description}`);
            }
        }

        function viewRestaurantDetails(restaurantId) {
            const restaurant = demoRestaurants.find(r => r.id === restaurantId);
            if (restaurant) {
                alert(`Restaurant Details:\n\n${restaurant.name}\nLocation: ${restaurant.location}\nCuisine: ${restaurant.cuisine}\nPrice Range: ${restaurant.priceRange}\nRating: ${restaurant.rating}★\n\n${restaurant.description}`);
            }
        }

        // Booking functions
        function bookTour(tourId) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login to book tours.');
                window.location.href = 'login.html';
                return;
            }
            
            const tour = demoTours.find(t => t.id === tourId);
            if (tour) {
                alert(`Booking tour: ${tour.title}\nPrice: $${tour.price}\n\nPlease confirm your booking.`);
            }
        }

        function bookHotel(hotelId) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login to book hotels.');
                window.location.href = 'login.html';
                return;
            }
            
            const hotel = demoHotels.find(h => h.id === hotelId);
            if (hotel) {
                alert(`Booking hotel: ${hotel.name}\nPrice: $${hotel.price}/night\n\nPlease select your dates and confirm booking.`);
            }
        }

        function bookRestaurant(restaurantId) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login to book restaurant tables.');
                window.location.href = 'login.html';
                return;
            }
            
            const restaurant = demoRestaurants.find(r => r.id === restaurantId);
            if (restaurant) {
                alert(`Reserving table at: ${restaurant.name}\nCuisine: ${restaurant.cuisine}\nPrice Range: ${restaurant.priceRange}\n\nPlease select date, time, and number of guests.`);
            }
        }

        // Taxi booking
        function calculateFare() {
            const vehicleType = document.getElementById('vehicle-type').value;
            const rates = {
                'standard': 2.5,
                'premium': 3.5,
                'van': 4.5,
                'luxury': 6.0
            };
            
            const rate = rates[vehicleType] || 2.5;
            const distance = 15; // Example distance in km
            const fare = distance * rate;
            
            document.getElementById('estimated-distance').textContent = `${distance} km`;
            document.getElementById('estimated-time').textContent = `${Math.round(distance * 2.5)} minutes`;
            document.getElementById('estimated-fare').textContent = `$${fare.toFixed(2)}`;
        }

        function orderTaxi(e) {
            e.preventDefault();
            
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Please login to book a taxi.');
                window.location.href = 'login.html';
                return;
            }
            
            const pickup = document.getElementById('pickup-location').value;
            const destination = document.getElementById('destination').value;
            const vehicleType = document.getElementById('vehicle-type').value;
            const schedule = document.getElementById('schedule').value;
            
            if (!pickup || !destination) {
                alert('Please enter both pickup location and destination.');
                return;
            }
            
            alert(`Taxi booked successfully!\n\nPickup: ${pickup}\nDestination: ${destination}\nVehicle: ${vehicleType}\nSchedule: ${schedule}\n\nYour driver will arrive in 5-10 minutes.`);
            
            // Reset form
            e.target.reset();
            calculateFare();
        }

        // Initialize fare calculation
        calculateFare();
