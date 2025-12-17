
// Global state
let allTours = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTours();
    setupEventListeners();
});

// Load tours from API
async function loadTours() {
    const container = document.getElementById('tours-container');
    const featuredContainer = document.getElementById('featured-tours');

    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading amazing tours for you...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/tours/read.php');
        allTours = await response.json();
        allTours = allTours.map(tour => ({
            ...tour,
            image: tour.image || getLocationImage(tour.location),
            category: tour.category || 'Tour',
            rating: tour.rating || '4.5',
            reviews: tour.reviews || 0,
            duration: tour.duration || 'Flexible schedule',
            groupSize: tour.groupSize || 'Small group'
        }));

        displayFilteredTours(allTours);

        // Featured tours (random top 3 or recent)
        const featured = allTours.slice(0, 3);
        featuredContainer.innerHTML = featured.map(createTourCard).join('');

    } catch (error) {
        console.error('Error loading tours:', error);
        container.innerHTML = '<div class="no-results"><h3>Failed to load tours</h3><p>Please try again later.</p></div>';
    }
}
function getLocationImage(location) {
    const base = (location || 'travel').split(',')[0].trim() || 'travel';
    return `https://source.unsplash.com/800x600/?travel,${encodeURIComponent(base)}`;
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

    if (searchBtn) searchBtn.addEventListener('click', filterTours);

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filterTours();
            }
        });
    }

    if (clearBtn) clearBtn.addEventListener('click', clearFilters);

    // Filter on select change
    ['destination-filter', 'price-filter', 'date-filter', 'category-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', filterTours);
    });
}

// Filter tours
function filterTours() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const destination = document.getElementById('destination-filter').value;
    const priceRange = document.getElementById('price-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    const category = document.getElementById('category-filter').value;

    let filtered = allTours.filter(tour => {
        // Search query
        if (searchQuery && !(
            tour.title.toLowerCase().includes(searchQuery) ||
            tour.location.toLowerCase().includes(searchQuery) ||
            tour.description.toLowerCase().includes(searchQuery)
        )) return false;

        // Destination filter
        if (destination && !tour.location.includes(destination)) return false;

        // Price filter
        if (priceRange) {
            const price = parseFloat(tour.price);
            const [min, max] = priceRange === '500+' ? [500, Infinity] : priceRange.split('-').map(Number);
            if (price < min || price > max) return false;
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

    displayFilteredTours(allTours);
}

// Tour actions
function viewTourDetails(tourId) {
    const tour = allTours.find(t => t.id === tourId);
    if (!tour) return;

    alert(`Tour Details:\n\n${tour.title}\nLocation: ${tour.location}\nDate: ${new Date(tour.schedule_date).toLocaleDateString()}\nDuration: ${tour.duration}\nPrice: $${tour.price}\n\n${tour.description}`);
}

async function bookTour(tourId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        if (confirm('Please login to book tours. Go to login page?')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const tour = allTours.find(t => t.id === tourId);
    if (!tour) return;

    if (confirm(`Book "${tour.title}" for $${tour.price}?`)) {
        try {
            const response = await fetch('/api/bookings/create.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tour_id: tour.id,
                    user_id: user.id
                })
            });

            if (response.ok) {
                alert('Booking Confirmed! You can view your bookings in your Dashboard.');
            } else {
                const data = await response.json();
                alert('Booking Failed: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error booking tour:', error);
            alert('An error occurred. Please try again.');
        }
    }
}
