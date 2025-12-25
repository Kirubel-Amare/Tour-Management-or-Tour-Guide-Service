let places = [];
let tours = [];
let hotels = [];
let restaurants = [];
let taxis = [];
let hotelsStatus = { error: '', empty: false };
let restaurantsStatus = { error: '', empty: false };
let taxisStatus = { error: '', empty: false };
let placesPage = 1;
let toursPage = 1;
let hotelsPage = 1;
let restaurantsPage = 1;
let taxisPage = 1;
const ITEMS_PER_PAGE = 9;
const PUBLIC_API_KEY = window.__PUBLIC_API_KEY__ || window.__REVIEW_API_KEY__ || 'demo-api-key';
const RESTAURANT_PLACEHOLDER = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

// Modal-based message box to replace native alerts
const nativeAlert = window.alert;
function initMessageBox() {
    const modal = document.getElementById('message-modal');
    if (!modal || modal.dataset.wired) return;
    modal.dataset.wired = 'true';

    const dialog = modal.querySelector('.msg-dialog');
    const titleEl = document.getElementById('msg-title');
    const bodyEl = document.getElementById('msg-body');
    const okBtn = document.getElementById('msg-ok');
    const closeElements = modal.querySelectorAll('[data-close]');

    const close = () => modal.classList.remove('show');

    closeElements.forEach(el => el.addEventListener('click', close));
    okBtn?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target.dataset.close === 'true') close();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) close();
    });

    const showMessageBox = (message, { title = 'Message', type = 'info' } = {}) => {
        if (!modal) return nativeAlert(message);
        dialog.classList.remove('info', 'success', 'error');
        dialog.classList.add(type || 'info');
        titleEl.textContent = title;
        bodyEl.textContent = Array.isArray(message) ? message.join('\n') : message;
        modal.classList.add('show');
        okBtn?.focus({ preventScroll: true });
    };

    // Override window.alert to use the message box
    window.alert = (msg) => showMessageBox(String(msg));

    // Expose helper for explicit typed messages
    window.showMessageBox = showMessageBox;
}

document.addEventListener('DOMContentLoaded', () => {
    initMessageBox();
    initServicesPage();
});

async function initServicesPage() {
    await Promise.all([loadPlaces(), loadTours(), loadHotels(), loadRestaurants(), loadTaxis()]);
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
        if (!response.ok) throw new Error(`Places API responded ${response.status}`);
        const payload = await response.json();
        const mapped = Array.isArray(payload) ? payload.map(mapPlace) : [];
        places = mapped;
        placesPage = 1;
        if (!mapped.length) {
            showMessageBox?.('No places found from the API.', { title: 'Places', type: 'error' });
        }
    } catch (err) {
        console.error('Failed to load places', err);
        places = [];
        showMessageBox?.('Unable to load places. Please try again later.', { title: 'Places', type: 'error' });
    }
    renderPlaces(filterPlacesData());
}

async function loadTours() {
    try {
        const response = await fetch('/api/tours/read.php');
        if (!response.ok) throw new Error(`Tours API responded ${response.status}`);
        const payload = await response.json();
        const mapped = Array.isArray(payload) ? payload.map(mapTour) : [];
        tours = mapped;
        toursPage = 1;
        if (!mapped.length) {
            showMessageBox?.('No tours found from the API.', { title: 'Tours', type: 'error' });
        }
    } catch (err) {
        console.error('Failed to load tours', err);
        tours = [];
        showMessageBox?.('Unable to load tours. Please try again later.', { title: 'Tours', type: 'error' });
    }
    renderTours(filterToursData());
}

async function loadHotels(cityInput) {
    try {
        hotelsStatus = { error: '', empty: false };
        const city = (cityInput || '').trim();
        const qs = city ? `?city=${encodeURIComponent(city)}` : '';
        // Fetch partner hotels through backend proxy
        const response = await fetch(`/api/integrations/hotels.php${qs}`);
        if (!response.ok) throw new Error(`Hotels API responded ${response.status}`);
        const payload = await response.json();
        const incoming = payload?.data?.data?.hotels || payload?.data?.hotels || payload?.data || payload || [];
        hotels = Array.isArray(incoming) && incoming.length ? incoming.map(mapExternalHotel) : [];
        hotelsPage = 1;
        if (!hotels.length) {
            hotelsStatus.empty = true;
            showMessageBox?.('No hotels returned by the partner API.', { title: 'Hotels', type: 'error' });
        }
    } catch (err) {
        console.error('Failed to load hotels', err);
        hotels = [];
        hotelsStatus = { error: err?.message || 'Unable to load hotels.', empty: false };
        showMessageBox?.('Unable to load hotels. Please try again later.', { title: 'Hotels', type: 'error' });
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
        restaurantsStatus = { error: '', empty: false };
        const city = (cityInput || '').trim();
        const qs = city ? `?city=${encodeURIComponent(city)}` : '';
        const response = await fetch(`/api/v1/restaurants.php${qs}`, {
            headers: { 'X-API-KEY': PUBLIC_API_KEY }
        });
        if (!response.ok) throw new Error(`Restaurants API responded ${response.status}`);
        const payload = await response.json();
        const incoming = payload?.data || payload || [];
        restaurants = Array.isArray(incoming) && incoming.length ? incoming.map(mapRestaurant) : [];
        if (!restaurants.length) {
            restaurantsStatus.empty = true;
            showMessageBox?.('No restaurants returned by the API.', { title: 'Restaurants', type: 'error' });
        }
    } catch (err) {
        console.error('Failed to load restaurants', err);
        restaurants = [];
        restaurantsStatus = { error: err?.message || 'Unable to load restaurants.', empty: false };
        showMessageBox?.('Unable to load restaurants. Please try again later.', { title: 'Restaurants', type: 'error' });
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
        hotels: [],
        hotelsPage: 1,
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
        restaurants: [],
        restaurantsPage: 1,
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
        taxis: [],
        taxisPage: 1,
        reviews: raw.reviews || 50,
        description: raw.description || 'Comfortable stay provided by partner hotel.',
        image: raw.image || 'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?auto=format&fit=crop&w=800&q=80',
        roomType: raw.roomType || raw.room_type || 'Standard',
        hotelRating: raw.hotelRating || raw.hotel_rating || 4,
        amenities: raw.amenities || ['Wi-Fi', 'Breakfast']
    };
}

function mapExternalHotel(raw, idx) {
    return {
        id: raw.id || idx || Date.now(),
        name: raw.name || 'Hotel',
        location: raw.city ? `${raw.city}${raw.country ? ', ' + raw.country : ''}` : (raw.location || 'Unknown'),
        price: Number(raw.price || raw.base_price || 0).toFixed(2),
        rating: raw.rating || raw.star_rating || 4.4,
        reviews: raw.reviews || raw.review_count || 50,
        description: raw.description || 'Partner hotel listing.',
        image: raw.image_url || raw.image || 'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?auto=format&fit=crop&w=800&q=80',
        roomType: raw.roomType || raw.room_type || raw.default_room || 'Standard',
        hotelRating: raw.star_rating || raw.hotel_rating || 4,
        amenities: raw.amenities || []
    };
}

function mapRestaurant(raw, idx) {
    const normalizeImage = (url) => {
        if (!url) return RESTAURANT_PLACEHOLDER;
        if (url.startsWith('//')) return 'https:' + url;
        if (url.startsWith('http://')) return url.replace('http://', 'https://');
        if (url.startsWith('https://')) return url;
        // Relative path: assume same origin
        return `${window.location.origin}/${url.replace(/^\/+/, '')}`;
    };

    const imageUrl = normalizeImage(raw.image || raw.image_url);

    return {
        id: raw.id || idx || Date.now(),
        name: raw.name || 'Restaurant',
        location: raw.location || 'Unknown',
        cuisine: raw.cuisine || 'International',
        priceRange: raw.priceRange || raw.price_range || '$$',
        rating: raw.rating || 4.5,
        reviews: raw.reviews || 40,
        description: raw.description || 'Great food from our partner restaurant.',
        image: imageUrl,
        features: raw.features || ['Family friendly']
    };
}

function renderPlaces(data) {
    const container = document.getElementById('places-list');
    const pagination = document.getElementById('places-pagination');
    const list = Array.isArray(data) ? data : [];
    const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
    placesPage = Math.min(Math.max(placesPage, 1), totalPages);
    const start = (placesPage - 1) * ITEMS_PER_PAGE;
    const pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    container.innerHTML = pageItems.length
        ? pageItems.map(createPlaceCard).join('')
        : '<div class="no-results"><i class="fas fa-map-marked-alt"></i><h3>No places found</h3><p>Try adjusting your search.</p></div>';

    if (pagination) {
        if (list.length <= ITEMS_PER_PAGE) {
            pagination.innerHTML = '';
        } else {
            const total = totalPages;
            pagination.innerHTML = `
                <button ${placesPage === 1 ? 'disabled' : ''} onclick="changePlacesPage(${placesPage - 1})">Prev</button>
                <span class="page-info">Page ${placesPage} / ${total}</span>
                <button ${placesPage === total ? 'disabled' : ''} onclick="changePlacesPage(${placesPage + 1})">Next</button>
            `;
        }
    }
}

function renderTours(data) {
    const container = document.getElementById('tours-list');
    const pagination = document.getElementById('tours-pagination');
    const list = Array.isArray(data) ? data : [];
    const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
    toursPage = Math.min(Math.max(toursPage, 1), totalPages);
    const start = (toursPage - 1) * ITEMS_PER_PAGE;
    const pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    container.innerHTML = pageItems.length
        ? pageItems.map(createTourCard).join('')
        : '<div class="no-results"><i class="fas fa-ticket-alt"></i><h3>No tours found</h3><p>Try adjusting your filters.</p></div>';

    if (pagination) {
        if (list.length <= ITEMS_PER_PAGE) {
            pagination.innerHTML = '';
        } else {
            const total = totalPages;
            pagination.innerHTML = `
                <button ${toursPage === 1 ? 'disabled' : ''} onclick="changeToursPage(${toursPage - 1})">Prev</button>
                <span class="page-info">Page ${toursPage} / ${total}</span>
                <button ${toursPage === total ? 'disabled' : ''} onclick="changeToursPage(${toursPage + 1})">Next</button>
            `;
        }
    }
}

function renderHotels(data) {
    const container = document.getElementById('hotels-list');
    const pagination = document.getElementById('hotels-pagination');
    const list = Array.isArray(data) ? data : [];
    const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
    hotelsPage = Math.min(Math.max(hotelsPage, 1), totalPages);
    const start = (hotelsPage - 1) * ITEMS_PER_PAGE;
    const pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    container.innerHTML = pageItems.length
        ? pageItems.map(createHotelCard).join('')
        : buildEmptyState('Hotels', hotelsStatus);

    if (pagination) {
        if (list.length <= ITEMS_PER_PAGE) {
            pagination.innerHTML = '';
        } else {
            const disablePrev = hotelsPage === 1 ? 'disabled' : '';
            const disableNext = hotelsPage === totalPages ? 'disabled' : '';
            pagination.innerHTML = `
                <button ${disablePrev} onclick="changeHotelsPage(${hotelsPage - 1})">Prev</button>
                <span class="page-info">Page ${hotelsPage} / ${totalPages}</span>
                <button ${disableNext} onclick="changeHotelsPage(${hotelsPage + 1})">Next</button>
            `;
        }
    }
}

function renderRestaurants(data) {
    const container = document.getElementById('restaurants-list');
    const pagination = document.getElementById('restaurants-pagination');
    const list = Array.isArray(data) ? data : [];
    const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
    restaurantsPage = Math.min(Math.max(restaurantsPage, 1), totalPages);
    const start = (restaurantsPage - 1) * ITEMS_PER_PAGE;
    const pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    container.innerHTML = pageItems.length
        ? pageItems.map(createRestaurantCard).join('')
        : buildEmptyState('Restaurants', restaurantsStatus);

    if (pagination) {
        if (list.length <= ITEMS_PER_PAGE) {
            pagination.innerHTML = '';
        } else {
            const total = totalPages;
            pagination.innerHTML = `
                <button ${restaurantsPage === 1 ? 'disabled' : ''} onclick="changeRestaurantsPage(${restaurantsPage - 1})">Prev</button>
                <span class="page-info">Page ${restaurantsPage} / ${total}</span>
                <button ${restaurantsPage === total ? 'disabled' : ''} onclick="changeRestaurantsPage(${restaurantsPage + 1})">Next</button>
            `;
        }
    }
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
                        <button onclick="startTourBooking(${tour.id})" class="btn btn-primary">
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
                        <button onclick="bookPartnerHotel(${hotel.id})" class="btn btn-primary">
                            <i class="fas fa-bed"></i> Check Availability
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
                        <button onclick="startRestaurantBooking(${restaurant.id})" class="btn btn-primary">
                            <i class="fas fa-utensils"></i> Reserve Table
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function searchPlaces() {
    placesPage = 1;
    renderPlaces(filterPlacesData());
}

function searchTours() {
    toursPage = 1;
    renderTours(filterToursData());
}

function searchHotels() {
    hotelsPage = 1;
    const value = document.getElementById('hotels-search').value || '';
    loadHotels(value);
}

function searchRestaurants() {
    restaurantsPage = 1;
    const value = document.getElementById('restaurants-search').value || '';
    loadRestaurants(value);
}

function filterPlaces() {
    placesPage = 1;
    renderPlaces(filterPlacesData());
}

function filterTours() {
    toursPage = 1;
    renderTours(filterToursData());
}

function filterHotels() {
    hotelsPage = 1;
    renderHotels(filterHotelsData());
}

function filterRestaurants() {
    restaurantsPage = 1;
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

function buildEmptyState(label, status, isTaxi = false) {
    const icon = label === 'Hotels' ? 'fa-bed' : label === 'Restaurants' ? 'fa-utensils' : 'fa-taxi';
    const error = status?.error;
    const emptyApi = status?.empty;
    const hint = error
        ? 'The service did not respond. Please retry or check your connection.'
        : emptyApi
            ? 'The API returned no results. Try another city or time.'
            : 'Try clearing your filters or searching a different city.';

    return `
        <div class="no-results${error ? ' error' : ''}${isTaxi ? ' loading-taxis' : ''}">
            <i class="fas ${icon}"></i>
            <h3>${error ? `${label} unavailable` : `No ${label.toLowerCase()} found`}</h3>
            <p>${hint}</p>
        </div>
    `;
}

function viewPlaceDetails(placeId) {
    const place = places.find(p => p.id === placeId);
    if (!place) return;
    alert(`Place Details:\n\n${place.name}\nType: ${place.type}\nRegion: ${place.continent}\nClimate: ${place.climate}\nRating: ${place.rating}★\n\n${place.description}`);
}

function viewTourDetails(tourId) {
    const tour = tours.find(t => t.id === tourId);
    if (!tour) return;
    const msg = `Tour Details:\n\n${tour.title}\nLocation: ${tour.location}\nDuration: ${tour.duration}\nPrice: $${tour.price}\nRating: ${tour.rating}★\n\n${tour.description}`;
    if (typeof showMessageBox === 'function') {
        showMessageBox(msg, { title: 'Tour Details' });
    } else {
        alert(msg);
    }
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

function startRestaurantBooking(restaurantId) {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) {
        showMessageBox?.('Restaurant not found.', { title: 'Restaurant', type: 'error' });
        return;
    }

    try {
        sessionStorage.setItem('selectedRestaurant', JSON.stringify({
            id: restaurant.id,
            name: restaurant.name,
            cuisine: restaurant.cuisine,
            location: restaurant.location,
            priceRange: restaurant.priceRange,
            rating: restaurant.rating,
            image: restaurant.image,
            features: restaurant.features,
            description: restaurant.description
        }));
    } catch (err) {
        console.warn('Unable to persist restaurant selection', err);
    }

    window.location.href = 'restaurant_booking.html';
}

async function bookTour(tourId) {
    const user = requireAuth('Please login to book tours.');
    if (!user) return;

    const tour = tours.find(t => t.id === tourId);
    if (!tour) {
        showMessageBox?.('Tour not found.', { title: 'Tours', type: 'error' });
        return;
    }

    try {
        const response = await fetch('/api/bookings/create.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tour_id: tour.id, user_id: user.id })
        });

        if (response.ok) {
            showMessageBox?.(`Booking confirmed for ${tour.title}`, { title: 'Tour Booking', type: 'success' });
        } else {
            showMessageBox?.('Booking failed.', { title: 'Tour Booking', type: 'error' });
        }
    } catch (err) {
        console.error('Booking error', err);
        showMessageBox?.('Unable to book tour right now.', { title: 'Tour Booking', type: 'error' });
    }
}

function startTourBooking(tourId) {
    // Require login
    const user = requireAuth('Please login to book tours.');
    if (!user) return;

    const tour = tours.find(t => t.id === tourId);
    if (!tour) {
        showMessageBox?.('Tour not found.', { title: 'Tours', type: 'error' });
        return;
    }

    try {
        sessionStorage.setItem('selectedTour', JSON.stringify({
            id: tour.id,
            title: tour.title,
            location: tour.location,
            price: tour.price,
            schedule_date: tour.schedule_date,
            duration: tour.duration,
            image: tour.image
        }));
    } catch (err) {
        console.warn('Unable to persist tour selection', err);
    }

    window.location.href = 'tour_booking.html';
}

async function bookPartnerHotel(hotelId) {
    const hotel = hotels.find(h => h.id === hotelId);
    if (!hotel) return alert('Hotel not found.');

    const checkIn = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const checkOut = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const qs = new URLSearchParams({
        hotel_id: hotel.id,
        check_in: checkIn.toISOString().split('T')[0],
        check_out: checkOut.toISOString().split('T')[0]
    });

    try {
        const response = await fetch(`/api/integrations/rooms.php?${qs.toString()}`);
        const payload = await response.json().catch(() => ({}));
        if (response.ok && payload?.data?.data?.rooms) {
            const rooms = payload.data.data.rooms;
            const count = rooms.length;
            const types = rooms.slice(0, 3).map(r => r.room_type?.name || r.room_type?.description || 'Room');
            alert(`Availability check for ${hotel.name}:\nRooms available: ${count}\nSample types: ${types.join(', ')}`);
        } else {
            const msg = payload?.error || payload?.message || 'No rooms available or partner API error.';
            alert(msg);
        }
    } catch (err) {
        console.error('Partner availability error', err);
        alert('Unable to check availability right now.');
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

    const pickupField = document.getElementById('taxi-pickup') || document.getElementById('pickup-location');
    const destinationField = document.getElementById('taxi-destination') || document.getElementById('destination');
    const timeField = document.getElementById('taxi-time') || document.getElementById('scheduled-time');
    const vehicleTypeField = document.getElementById('vehicle-type');

    const pickup = (pickupField?.value || '').trim();
    const destination = (destinationField?.value || '').trim();
    const customTime = (timeField?.value || '').trim();
    const vehicleType = vehicleTypeField?.value || 'standard';
    const schedule = customTime ? 'scheduled' : 'now';
    const serviceIdValue = (document.getElementById('service-id')?.value || '').trim();
    const serviceId = serviceIdValue !== '' ? Number(serviceIdValue) : null;

    if (!pickup || !destination) {
        alert('Please enter both pickup and destination (you can type a place name or coordinates).');
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
                service_id: serviceId
            })
        });

        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
            const ride = payload.data || {};
            const pick = ride.pickup || ride.pickup_location || 'N/A';
            const drop = ride.destination || ride.dropoff_location || 'N/A';
            const vehicle = ride.vehicleType || ride.vehicle_type || ride.vehicle || 'N/A';
            const fare = ride.fare ?? ride.price ?? 'N/A';
            const eta = ride.eta_minutes ?? ride.eta ?? 'N/A';
            const conf = ride.confirmation || ride.ride_id || 'pending';
            alert(`Taxi booked!\n\nPickup: ${pick}\nDestination: ${drop}\nVehicle: ${vehicle}\nFare: $${fare}\nETA: ${eta} minutes\nConfirmation: ${conf}`);
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
        taxisStatus = { error: '', empty: false };
        const response = await fetch('/api/v1/taxis.php', {
            headers: { 'X-API-KEY': PUBLIC_API_KEY }
        }); // GET request
        if (!response.ok) throw new Error(`Taxis API responded ${response.status}`);
        const payload = await response.json();
        taxis = payload.data || [];
        if (!taxis.length) {
            taxisStatus.empty = true;
            showMessageBox?.('No taxis returned by the API.', { title: 'Taxis', type: 'error' });
        }
        renderTaxis(filterTaxisData());

        // Wire search input debounce once
        const taxiSearch = document.getElementById('taxis-search');
        if (taxiSearch && !taxiSearch.dataset.wired) {
            taxiSearch.dataset.wired = 'true';
            taxiSearch.addEventListener('input', debounce(() => renderTaxis(filterTaxisData()), 300));
        }
    } catch (err) {
        console.error('Failed to load taxis', err);
        taxis = [];
        taxisStatus = { error: err?.message || 'Unable to load taxis.', empty: false };
        renderTaxis([]); // Empty if failed
        showMessageBox?.('Unable to load taxis. Please try again later.', { title: 'Taxis', type: 'error' });
    }
}

function renderTaxis(taxis) {
    const container = document.getElementById('taxis-list');
    const countEl = document.getElementById('taxis-count');
    if (!container) return;

    const list = Array.isArray(taxis)
        ? taxis.filter(t => !t.status || String(t.status).toLowerCase() === 'available')
        : [];
    if (countEl) countEl.textContent = `${list.length} available`;

    const pagination = document.getElementById('taxis-pagination');
    const totalPages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
    taxisPage = Math.min(Math.max(taxisPage, 1), totalPages);
    const start = (taxisPage - 1) * ITEMS_PER_PAGE;
    const pageItems = list.slice(start, start + ITEMS_PER_PAGE);

    if (!pageItems.length) {
        container.innerHTML = buildEmptyState('Taxis', taxisStatus, true);
    } else {
        container.innerHTML = pageItems.map(t => {
        const img = t.image || 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=800&q=60';
        const vehicle = t.vehicle_type || 'Standard';
        const price = t.price_per_km || 0;
        const eta = t.eta_minutes || 'N/A';
        const cap = t.capacity || 4;
        const id = t.id ?? '—';
        return `
        <div class="service-card taxi-card">
            <div class="service-image" style="background-image: url('${img}');">
                <span class="service-badge">ETA ${eta} min</span>
            </div>
            <div class="service-content">
                <h3 class="service-title">
                    ${t.name || 'Taxi'}
                    <span class="service-rating"><i class="fas fa-taxi"></i> ${vehicle}</span>
                </h3>
                <div class="service-location">
                    <i class="fas fa-hashtag"></i> Service ID: ${id}
                </div>
                <div class="taxi-details">
                    <span class="taxi-chip"><i class="fas fa-users"></i> ${cap} seats</span>
                    <span class="taxi-chip"><i class="fas fa-dollar-sign"></i> $${price}/km</span>
                    <span class="taxi-chip"><i class="fas fa-stopwatch"></i> ETA ${eta}</span>
                </div>
                <div class="taxi-price">
                    <span>Status</span>
                    <span class="taxi-status available">Available</span>
                </div>
                <button class="btn btn-primary btn-small" onclick='selectTaxiService(${JSON.stringify(t)}); redirectToTaxiBooking();'>
                    <i class="fas fa-ticket-alt"></i> Book this taxi
                </button>
            </div>
        </div>`;
        }).join('');
    }

    if (pagination) {
        if (list.length <= ITEMS_PER_PAGE) {
            pagination.innerHTML = '';
        } else {
            const total = totalPages;
            pagination.innerHTML = `
                <button ${taxisPage === 1 ? 'disabled' : ''} onclick="changeTaxisPage(${taxisPage - 1})">Prev</button>
                <span class="page-info">Page ${taxisPage} / ${total}</span>
                <button ${taxisPage === total ? 'disabled' : ''} onclick="changeTaxisPage(${taxisPage + 1})">Next</button>
            `;
        }
    }
}

function searchTaxis() {
    taxisPage = 1;
    renderTaxis(filterTaxisData());
}

function filterTaxis() {
    taxisPage = 1;
    renderTaxis(filterTaxisData());
}

function filterTaxisData() {
    const query = (document.getElementById('taxis-search')?.value || '').toLowerCase();
    const vehicleFilter = (document.getElementById('taxi-vehicle-filter')?.value || '').toLowerCase();
    const priceFilter = document.getElementById('taxi-price-filter')?.value || '';

    return (Array.isArray(taxis) ? taxis : []).filter(t => {
        const name = (t.name || '').toLowerCase();
        const vehicle = (t.vehicle_type || '').toLowerCase();
        const price = parseFloat(t.price_per_km || t.price || 0);
        const matchesQuery = !query || name.includes(query) || vehicle.includes(query);
        const matchesVehicle = !vehicleFilter || vehicle === vehicleFilter;
        const matchesPrice = !priceFilter || (
            (priceFilter === '0-2' && price < 2) ||
            (priceFilter === '2-3' && price >= 2 && price <= 3) ||
            (priceFilter === '3-4' && price >= 3 && price <= 4) ||
            (priceFilter === '4+' && price >= 4)
        );
        return matchesQuery && matchesVehicle && matchesPrice;
    });
}

function selectTaxiService(taxiOrId, name, vehicleType) {
    const t = (typeof taxiOrId === 'object' && taxiOrId !== null)
        ? taxiOrId
        : { id: taxiOrId, name, vehicle_type: vehicleType };

    const id = t.id ?? t.service_id ?? t.serviceId ?? '';
    const resolvedName = t.name || 'Taxi';
    const resolvedVehicle = t.vehicle_type || t.vehicleType || 'standard';

    const input = document.getElementById('service-id');
    const display = document.getElementById('selected-service-display');
    if (input) input.value = (id ?? '').toString();
    if (display) display.textContent = id ? `${resolvedName} (ID: ${id})` : 'None selected';
    // Auto-set vehicle type to match selected service when possible
    const vt = document.getElementById('vehicle-type');
    if (vt) {
        const normalized = (resolvedVehicle || '').toLowerCase();
        vt.value = ['standard','premium','van','luxury'].includes(normalized) ? normalized : vt.value;
        calculateFare();
    }
    // Focus the booking form's submit button for quick action
    document.getElementById('taxi-booking-form')?.querySelector('button[type="submit"]')?.focus({ preventScroll: true });

    // Store selection for dedicated booking page with relevant payload from car
    try {
        sessionStorage.setItem('selectedTaxi', JSON.stringify({
            id,
            name: resolvedName,
            vehicleType: resolvedVehicle,
            pricePerKm: t.price_per_km ?? t.pricePerKm ?? null,
            etaMinutes: t.eta_minutes ?? t.etaMinutes ?? null,
            capacity: t.capacity ?? null,
            image: t.image || null
        }));
    } catch (err) {
        console.warn('Unable to persist taxi selection', err);
    }
}

function scrollToBookingForm() {
    const form = document.getElementById('taxi-booking-card');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        form.querySelector('input,textarea,select')?.focus({ preventScroll: true });
    }
}

// Persist selection and go to dedicated booking page
function redirectToTaxiBooking() {
    window.location.href = 'taxi_booking.html';
}

function changeHotelsPage(page) {
    const filtered = filterHotelsData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    hotelsPage = Math.min(Math.max(page, 1), totalPages);
    renderHotels(filtered);
    document.getElementById('hotels-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changePlacesPage(page) {
    const filtered = filterPlacesData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    placesPage = Math.min(Math.max(page, 1), totalPages);
    renderPlaces(filtered);
    document.getElementById('places-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeToursPage(page) {
    const filtered = filterToursData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    toursPage = Math.min(Math.max(page, 1), totalPages);
    renderTours(filtered);
    document.getElementById('tours-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeRestaurantsPage(page) {
    const filtered = filterRestaurantsData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    restaurantsPage = Math.min(Math.max(page, 1), totalPages);
    renderRestaurants(filtered);
    document.getElementById('restaurants-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function changeTaxisPage(page) {
    const filtered = filterTaxisData();
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    taxisPage = Math.min(Math.max(page, 1), totalPages);
    renderTaxis(filtered);
    document.getElementById('taxis-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
