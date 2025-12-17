
// Initialize
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'customer') {
    window.location.href = 'login.html';
}

// Set user info
document.getElementById('user-name').textContent = user.name;
const greetingEl = document.getElementById('user-greeting');
if (greetingEl) greetingEl.textContent = user.name.split(' ')[0];

// Global state
let allTours = [];
let myBookings = [];

// Load all data
function loadDashboardData() {
    loadTours();
    loadBookings();
}

// Load tours
async function loadTours() {
    const container = document.getElementById('tours-list');
    if (!container) return; // Might not exist if on a different tab/view structure

    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 2rem;"><span class="loading"></span> Loading tours...</div>';

    try {
        const response = await fetch('/api/tours/read.php');
        allTours = await response.json();

        // Enhance with mock data for missing fields
        allTours = allTours.map(enhanceTourData);

        if (allTours.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-compass"></i>
                    <h3>No Tours Available</h3>
                    <p>Check back later for new tour offerings.</p>
                </div>
            `;
        } else {
            container.innerHTML = allTours.slice(0, 6).map(createTourCard).join(''); // Show top 6
            loadRecommendedTours();
        }
    } catch (error) {
        console.error('Error loading tours:', error);
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center;">Failed to load tours.</div>';
    }
}

function enhanceTourData(tour) {
    return {
        ...tour,
        image: tour.image || `https://source.unsplash.com/800x600/?travel,${tour.location.split(',')[0]}`,
        rating: (Math.random() * 1.5 + 3.5).toFixed(1),
        reviews: Math.floor(Math.random() * 200) + 10,
        duration: Math.floor(Math.random() * 6 + 2) + " hours",
        category: "General",
        guide: { name: tour.guide_name || "Professional Guide", rating: 4.8 }
    };
}

// Load recommended tours
function loadRecommendedTours() {
    const container = document.getElementById('recommended-tours');
    if (!container) return;
    const recommended = allTours.slice(0, 2);
    container.innerHTML = recommended.map(createTourCard).join('');
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
async function loadBookings() {
    const container = document.getElementById('bookings-list');

    try {
        const response = await fetch(`/api/bookings/read_user.php?user_id=${user.id}`);
        myBookings = await response.json();

        if (myBookings.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted);">
                    <i class="fas fa-calendar-plus" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No bookings yet</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Book your first tour to get started!</p>
                </div>
            `;
        } else {
            container.innerHTML = myBookings.map(createBookingCard).join('');
        }

        updateStats();

    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = '<div style="text-align:center; color:red">Failed to load bookings</div>';
    }
}

// Create booking card
function createBookingCard(booking) {
    const formattedDate = new Date(booking.schedule_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return `
        <div class="booking-item">
            <div class="booking-header">
                <div>
                    <div class="booking-title">${booking.tour_title}</div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">${formattedDate}</div>
                </div>
                <span class="booking-status status-${booking.status}">${booking.status}</span>
            </div>
            
            <div class="booking-details">
                <div class="booking-details-item">
                    <span>Location:</span>
                    <span style="font-weight: 600;">${booking.location}</span>
                </div>
                 <div class="booking-details-item">
                    <span>Booked On:</span>
                    <span>${new Date(booking.booking_date).toLocaleDateString()}</span>
                </div>
                <div class="booking-details-item">
                    <span>Total:</span>
                    <span style="font-weight: 600; color: var(--tourist-primary);">$${booking.price}</span>
                </div>
            </div>
            
            <div class="booking-actions">
                <button class="btn btn-danger btn-sm" disabled style="opacity: 0.5;">
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
    document.getElementById('total-bookings').textContent = myBookings.length;

    const upcoming = myBookings.filter(b => new Date(b.schedule_date) > new Date()).length;
    document.getElementById('upcoming-tours').textContent = upcoming;

    // Unique countries check (approximate via location string)
    // const locations = [...new Set(myBookings.map(b => b.location.split(',').pop().trim()))];
    // document.getElementById('countries-visited').textContent = locations.length;

    // Just count total spent for simplicity
    const totalSpent = myBookings.reduce((sum, b) => sum + parseFloat(b.price), 0);
    document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;

    // updateBookingCount(); // if element exists
    updateNextTrip();
}


function updateNextTrip() {
    const nextTrip = myBookings
        .filter(b => new Date(b.schedule_date) > new Date())
        .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date))[0];

    const container = document.getElementById('next-trip');
    if (nextTrip) {
        const formattedDate = new Date(nextTrip.schedule_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        container.innerHTML = `
            <div style="font-weight: 600; color: var(--dark); margin-bottom: 0.25rem;">${nextTrip.tour_title}</div>
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

    // Basic alert for now, similar to others
    alert(`Tour Details:\n\n${tour.title}\nLocation: ${tour.location}\nDate: ${new Date(tour.schedule_date).toLocaleDateString()}\nPrice: $${tour.price}\n\n${tour.description}`);
}

async function bookTour(tourId) {
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
                alert('Booking Confirmed!');
                loadBookings();
            } else {
                alert('Booking Failed.');
            }
        } catch (error) {
            console.error(error);
            alert('Error booking tour');
        }
    }
}

function viewBookingDetails(bookingId) {
    const booking = myBookings.find(b => b.id === bookingId);
    if (!booking) return;

    alert(`Booking Details:\n\nTour: ${booking.tour_title}\nDate: ${new Date(booking.schedule_date).toLocaleDateString()}\nStatus: ${booking.status}\nTotal: $${booking.price}\nBooked on: ${new Date(booking.booking_date).toLocaleString()}`);
}


// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/api/auth/logout.php', { method: 'POST' }).finally(() => {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    loadDashboardData();
});
