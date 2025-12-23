let places = [];
let tours = [];
let hotels = [];
let restaurants = [];
const PUBLIC_API_KEY = window.__PUBLIC_API_KEY__ || window.__REVIEW_API_KEY__ || 'demo-api-key';

document.addEventListener('DOMContentLoaded', () => {
    initServicesPage();
});

async function initServicesPage() {
    await Promise.all([loadPlaces(), loadTours(), loadHotels(), loadRestaurants()]);
    setupEventListeners();
    calculateFare();
    syncAuthLinks();
}

function syncAuthLinks() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authLinks = document.getElementById('auth-links');
    const userLinks = document.getElementById('user-links');
    if (user && authLinks && userLinks) {
        authLinks.style.display = 'none';
        userLinks.style.display = 'inline-block';
    }
}

function switchService(serviceName) {
    document.querySelectorAll('.service-tab').forEach(tab => tab.classList.remove('active'));
    event.target.closest('.service-tab').classList.add('active');

    document.querySelectorAll('.service-section').forEach(section => section.classList.remove('active'));
    document.getElementById(`${serviceName}-section`).classList.add('active');
    document.getElementById(`${serviceName}-section`).scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setupEventListeners() {
    const scheduleSelect = document.getElementById('schedule');
    if (scheduleSelect) {
        scheduleSelect.addEventListener('change', function () {
            document.getElementById('custom-time').style.display = this.value === 'custom' ? 'block' : 'none';
        });
    }

    const vehicleSelect = document.getElementById('vehicle-type');
    if (vehicleSelect) {
        vehicleSelect.addEventListener('change', calculateFare);
    }
}

async function loadPlaces() {
    try {
        const response = await fetch('/api/places/read.php');
        const payload = await response.json();
        const mapped = Array.isArray(payload) ? payload.map(mapPlace) : [];
        places = mapped;
    } catch (err) {
        console.error('Failed to load places', err);
        places = [];
    }
    renderPlaces(filterPlacesData());
}

async function loadTours() {
    try {
        const response = await fetch('/api/tours/read.php');
        const payload = await response.json();
        const mapped = Array.isArray(payload) ? payload.map(mapTour) : [];
        tours = mapped;
    } catch (err) {
        console.error('Failed to load tours', err);
        tours = [];
    }
    renderTours(filterToursData());
}

async function loadHotels(cityInput) {
    try {
        const city = (cityInput || '').trim();
        const qs = city ? `?city=${encodeURIComponent(city)}` : '';
        const response = await fetch(`/api/v1/hotels.php${qs}`, {
            headers: { 'X-API-KEY': PUBLIC_API_KEY }
        });
        const payload = await response.json();
        const incoming = payload?.data || payload || [];
        hotels = Array.isArray(incoming) && incoming.length ? incoming.map(mapHotel) : [];
    } catch (err) {
        console.error('Failed to load hotels', err);
        hotels = [];
    }
    renderHotels(filterHotelsData());

    const hotelSearch = document.getElementById('hotels-search');
    if (hotelSearch && !hotelSearch.dataset.wired) {
        hotelSearch.dataset.wired = 'true';
        hotelSearch.addEventListener('input', debounce(async (e) => {
            const value = e.target.value || '';
            await loadHotels(value);
        }, 500));
    }
}

async function loadRestaurants(cityInput) {
    try {
        const city = (cityInput || '').trim();
        const qs = city ? `?city=${encodeURIComponent(city)}` : '';
        const response = await fetch(`/api/v1/restaurants.php${qs}`, {
            headers: { 'X-API-KEY': PUBLIC_API_KEY }
        });
        const payload = await response.json();
        const incoming = payload?.data || payload || [];
        restaurants = Array.isArray(incoming) && incoming.length ? incoming.map(mapRestaurant) : [];
    } catch (err) {
        console.error('Failed to load restaurants', err);
        restaurants = [];
    }
    renderRestaurants(filterRestaurantsData());

    const restaurantSearch = document.getElementById('restaurants-search');
    if (restaurantSearch && !restaurantSearch.dataset.wired) {
        restaurantSearch.dataset.wired = 'true';
        restaurantSearch.addEventListener('input', debounce(async (e) => {
            const value = e.target.value || '';
            await loadRestaurants(value);
        }, 500));
    }
}

function mapPlace(raw, idx) {
    return {
        id: raw.id || idx || Date.now(),
        name: raw.name || 'Destination',
        type: raw.type || raw.category || 'Destination',
        continent: raw.continent || raw.country || raw.city || 'Unknown',
        climate: raw.climate || 'Temperate',
        rating: raw.rating || 4.6,
        description: raw.description || 'Discover new destinations curated for travelers.',
        image: raw.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        reviews: raw.reviews || 120,
        features: raw.features || []
    };
}

function mapTour(raw, idx) {
    return {
        id: raw.id || idx || Date.now(),
        title: raw.title || 'Tour',
        location: raw.location || 'TBD',
        price: Number(raw.price || 0).toFixed(2),
        duration: raw.duration || raw.schedule_date || 'Flexible',
        rating: raw.rating || 4.5,
        reviews: raw.reviews || 75,
        description: raw.description || 'Tour details coming soon.',
        image: raw.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        features: raw.features || ['Local guide', 'Small group', 'Flexible schedule']
    };
}

function mapHotel(raw, idx) {
    return {
        id: raw.id || idx || Date.now(),
        name: raw.name || 'Hotel',
        location: raw.location || (raw.address?.cityName) || 'Unknown',
        price: Number(raw.price || 0).toFixed(2),
        rating: raw.rating || raw.hotelRating || 4.4,
        reviews: raw.reviews || 50,
        description: raw.description || 'Comfortable stay provided by partner hotel.',
        image: raw.image || 'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?auto=format&fit=crop&w=800&q=80',
        roomType: raw.roomType || raw.room_type || 'Standard',
        hotelRating: raw.hotelRating || raw.hotel_rating || 4,
        amenities: raw.amenities || ['Wi-Fi', 'Breakfast']
    };
}

function mapRestaurant(raw, idx) {
    return {
        id: raw.id || idx || Date.now(),
        name: raw.name || 'Restaurant',
        location: raw.location || 'Unknown',
        cuisine: raw.cuisine || 'International',
        priceRange: raw.priceRange || raw.price_range || '$$',
        rating: raw.rating || 4.5,
        reviews: raw.reviews || 40,
        description: raw.description || 'Great food from our partner restaurant.',
        image: raw.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        features: raw.features || ['Family friendly']
    };
}

function renderPlaces(data) {
    const container = document.getElementById('places-list');
    container.innerHTML = data.map(createPlaceCard).join('');
}

function renderTours(data) {
    const container = document.getElementById('tours-list');
    container.innerHTML = data.map(createTourCard).join('');
}

function renderHotels(data) {
    const container = document.getElementById('hotels-list');
    container.innerHTML = data.map(createHotelCard).join('');
}

function renderRestaurants(data) {
    const container = document.getElementById('restaurants-list');
    container.innerHTML = data.map(createRestaurantCard).join('');
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
                    ${(place.features || []).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
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
                    ${(tour.features || []).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
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
                    ${(hotel.amenities || []).map(amenity => `
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
                    ${(restaurant.features || []).map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
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

function searchPlaces() {
    renderPlaces(filterPlacesData());
}

function searchTours() {
    renderTours(filterToursData());
}

function searchHotels() {
    const value = document.getElementById('hotels-search').value || '';
    loadHotels(value);
}

function searchRestaurants() {
    const value = document.getElementById('restaurants-search').value || '';
    loadRestaurants(value);
}

function filterPlaces() {
    renderPlaces(filterPlacesData());
}

function filterTours() {
    renderTours(filterToursData());
}

function filterHotels() {
    renderHotels(filterHotelsData());
}

function filterRestaurants() {
    renderRestaurants(filterRestaurantsData());
}

function filterPlacesData() {
    const query = (document.getElementById('places-search').value || '').toLowerCase();
    const continent = document.getElementById('continent-filter').value;
    const type = document.getElementById('type-filter').value;
    const climate = document.getElementById('climate-filter').value;
    return places.filter(p =>
        (!query || p.name.toLowerCase().includes(query)) &&
        (!continent || p.continent === continent) &&
        (!type || p.type === type) &&
        (!climate || p.climate === climate)
    );
}

function filterToursData() {
    const query = (document.getElementById('tours-search').value || '').toLowerCase();
    const priceRange = document.getElementById('tours-price-filter').value;
    const duration = document.getElementById('duration-filter').value;
    const rating = document.getElementById('rating-filter').value;

    return tours.filter(t => {
        const price = parseFloat(t.price);
        const matchesQuery = !query || t.title.toLowerCase().includes(query) || t.location.toLowerCase().includes(query);
        const matchesPrice = !priceRange || (
            (priceRange === '0-50' && price < 50) ||
            (priceRange === '50-100' && price >= 50 && price <= 100) ||
            (priceRange === '100-200' && price >= 100 && price <= 200) ||
            (priceRange === '200+' && price >= 200)
        );
        const matchesDuration = !duration || (t.duration && t.duration.toString().includes(duration));
        const matchesRating = !rating || Number(t.rating) >= Number(rating);
        return matchesQuery && matchesPrice && matchesDuration && matchesRating;
    });
}

function filterHotelsData() {
    const query = (document.getElementById('hotels-search').value || '').toLowerCase();
    const room = document.getElementById('room-type-filter').value;
    const star = document.getElementById('hotel-rating-filter').value;
    const priceRange = document.getElementById('hotel-price-filter').value;

    return hotels.filter(h => {
        const price = parseFloat(h.price);
        const matchesQuery = !query || h.name.toLowerCase().includes(query) || h.location.toLowerCase().includes(query);
        const matchesRoom = !room || h.roomType === room;
        const matchesStar = !star || Number(h.hotelRating) >= Number(star);
        const matchesPrice = !priceRange || (
            (priceRange === '0-100' && price < 100) ||
            (priceRange === '100-200' && price >= 100 && price <= 200) ||
            (priceRange === '200-500' && price >= 200 && price <= 500) ||
            (priceRange === '500+' && price >= 500)
        );
        return matchesQuery && matchesRoom && matchesStar && matchesPrice;
    });
}

// simple debounce to avoid hammering API on every keystroke
function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), delay);
    };
}

function filterRestaurantsData() {
    const query = (document.getElementById('restaurants-search').value || '').toLowerCase();
    const cuisine = document.getElementById('cuisine-filter').value;
    const price = document.getElementById('restaurant-price-filter').value;
    const rating = document.getElementById('restaurant-rating-filter').value;

    return restaurants.filter(r => {
        const matchesQuery = !query || r.name.toLowerCase().includes(query) || r.location.toLowerCase().includes(query);
        const matchesCuisine = !cuisine || r.cuisine === cuisine;
        const matchesPrice = !price || r.priceRange === price;
        const matchesRating = !rating || Number(r.rating) >= Number(rating);
        return matchesQuery && matchesCuisine && matchesPrice && matchesRating;
    });
}

function viewPlaceDetails(placeId) {
    const place = places.find(p => p.id === placeId);
    if (!place) return;
    alert(`Place Details:\n\n${place.name}\nType: ${place.type}\nRegion: ${place.continent}\nClimate: ${place.climate}\nRating: ${place.rating}★\n\n${place.description}`);
}

function viewTourDetails(tourId) {
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;
    alert(`Tour Details:\n\n${tour.title}\nLocation: ${tour.location}\nDuration: ${tour.duration}\nPrice: $${tour.price}\nRating: ${tour.rating}★\n\n${tour.description}`);
}

function viewHotelDetails(hotelId) {
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return;
    alert(`Hotel Details:\n\n${hotel.name}\nLocation: ${hotel.location}\nPrice: $${hotel.price}/night\nRating: ${hotel.rating}★\nHotel Stars: ${hotel.hotelRating}★\nRoom Type: ${hotel.roomType}\n\n${hotel.description}`);
}

function viewRestaurantDetails(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return;
    alert(`Restaurant Details:\n\n${restaurant.name}\nLocation: ${restaurant.location}\nCuisine: ${restaurant.cuisine}\nPrice Range: ${restaurant.priceRange}\nRating: ${restaurant.rating}★\n\n${restaurant.description}`);
}

async function bookTour(tourId) {
    const user = requireAuth('Please login to book tours.');
    if (!user) return;

    const tour = tours.find(t => t.id === tourId);
    if (!tour) return alert('Tour not found.');

    try {
        const response = await fetch('/api/bookings/create.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_id: tour.id, user_id: user.id })
        });

        if (response.ok) {
            alert(`Booking confirmed for ${tour.title}`);
        } else {
            alert('Booking failed.');
        }
    } catch (err) {
        console.error('Booking error', err);
        alert('Unable to book tour right now.');
    }
}

async function bookHotel(hotelId) {
    const user = requireAuth('Please login to book hotels.');
    if (!user) return;

    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return alert('Hotel not found.');

    const today = new Date();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
        // POST without sending X-API-KEY
        const response = await fetch('/api/v1/hotels.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user,
                hotel_id: hotel.id,
                check_in: today.toISOString().split('T')[0],
                check_out: tomorrow.toISOString().split('T')[0],
                guests: 2,
                roomType: hotel.roomType
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
            alert(`Hotel booked! Confirmation: ${payload.data?.confirmation || 'pending'}`);
        } else {
            const msg = payload?.message || 'Hotel booking failed (provider may not support booking).';
            alert(msg);
        }
    } catch (err) {
        console.error('Hotel booking error', err);
        alert('Unable to book hotel right now.');
    }
}


async function bookRestaurant(restaurantId) {
    const user = requireAuth('Please login to book restaurant tables.');
    if (!user) return;

    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) return alert('Restaurant not found.');

    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    try {
        const response = await fetch('/api/v1/restaurants.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': PUBLIC_API_KEY
            },
            body: JSON.stringify({
                user,
                restaurant_id: restaurant.id,
                date: now.toISOString().split('T')[0],
                time,
                guests: 2
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
            alert(`Reservation placed! Confirmation: ${payload.data?.confirmation || 'pending'}`);
        } else {
            const msg = payload?.message || 'Reservation failed (provider may not support booking in this environment).';
            alert(msg);
        }
    } catch (err) {
        console.error('Restaurant booking error', err);
        alert('Unable to reserve table right now.');
    }
}

function requireAuth(message) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert(message);
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function calculateFare() {
    const vehicleType = document.getElementById('vehicle-type').value;
    const rates = {
        standard: 2.5,
        premium: 3.5,
        van: 4.5,
        luxury: 6.0
    };

    const rate = rates[vehicleType] || 2.5;
    const distance = 15;
    const fare = distance * rate;

    document.getElementById('estimated-distance').textContent = `${distance} km`;
    document.getElementById('estimated-time').textContent = `${Math.round(distance * 2.5)} minutes`;
    document.getElementById('estimated-fare').textContent = `$${fare.toFixed(2)}`;
}

async function orderTaxi(e) {
    e.preventDefault();

    const user = requireAuth('Please login to book a taxi.');
    if (!user) return;

    const pickup = document.getElementById('pickup-location').value;
    const destination = document.getElementById('destination').value;
    const vehicleType = document.getElementById('vehicle-type').value || 'standard';
    const schedule = document.getElementById('schedule').value;
    const customTime = document.getElementById('scheduled-time').value;

    function isLonLat(v) {
        const re = /^\s*-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\s*$/;
        return re.test(v);
    }
    if (!pickup || !destination) {
        alert('Please enter both pickup and destination coordinates (lon,lat).');
        return;
    }
    if (!isLonLat(pickup) || !isLonLat(destination)) {
        alert('Coordinates must be in "longitude,latitude" format, e.g., -73.9857, 40.7484');
        return;
    }

    try {
        const response = await fetch('/api/v1/taxis.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': PUBLIC_API_KEY
            },
            body: JSON.stringify({
                user_id: user.id,
                pickup_location: pickup,
                dropoff_location: destination,
                vehicle_type: vehicleType,
                schedule,
                pickup_time: customTime || undefined,
                service_id: null
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
            const ride = payload.data || {};
            alert(`Taxi booked!\n\nPickup: ${ride.pickup}\nDestination: ${ride.destination}\nVehicle: ${ride.vehicleType}\nFare: $${ride.fare}\nETA: ${ride.eta_minutes} minutes\nConfirmation: ${ride.ride_id || 'pending'}`);
        } else {
            const msg = payload?.message || 'Taxi booking failed (provider may not support booking).';
            alert(msg);
        }
    } catch (err) {
        console.error('Taxi booking error', err);
        alert('Unable to book taxi right now.');
    }

    e.target.reset();
    calculateFare();
}

async function loadTaxis() {
    try {
        const response = await fetch('/api/v1/taxis.php', {
            headers: { 'X-API-KEY': PUBLIC_API_KEY }
        }); // GET request
        const payload = await response.json();
        const taxis = payload.data || [];
        
        renderTaxis(taxis); // Render function for your UI
    } catch (err) {
        console.error('Failed to load taxis', err);
        renderTaxis([]); // Empty if failed
    }
}

function renderTaxis(taxis) {
    const container = document.getElementById('taxis-list');
    if (!container) return;

    container.innerHTML = taxis.map(t => `
        <div class="taxi-card">
            <h3>${t.name || 'Taxi'}</h3>
            <p>Vehicle: ${t.vehicle_type || 'Standard'}</p>
            <p>Capacity: ${t.capacity || 4}</p>
            <p>Price per km: $${t.price_per_km || 0}</p>
            <p>ETA: ${t.eta_minutes || 'N/A'} min</p>
            <button onclick="orderTaxi(event)">Book Now</button>
        </div>
    `).join('');
}
