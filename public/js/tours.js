
// Global state
let allTours = [];
const REVIEW_API_KEY = window.__REVIEW_API_KEY__ || 'demo-api-key';
const API_BASE_PATH = (window.__APP_BASE_PATH__ || '').replace(/\/$/, '');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initMessageBox();
    loadTours();
    setupEventListeners();
    setupReviewForm();
    loadMyReviews();
});

// Load user's reviews
async function loadMyReviews() {
    let user;
    try {
        user = JSON.parse(localStorage.getItem('user'));
    } catch { user = null; }
    if (!user || !user.id) return;
    const container = document.getElementById('my-reviews-list');
    if (!container) return;
    container.innerHTML = '<div>Loading your reviews...</div>';
    try {
        const res = await fetch(`/api/reviews/read.php?user_id=${user.id}`);
        const reviews = await res.json();
        if (!Array.isArray(reviews) || reviews.length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted);">No reviews yet.</div>';
            return;
        }
        container.innerHTML = reviews.map(createMyReviewCard).join('');
    } catch (err) {
        container.innerHTML = '<div style="color:red;">Failed to load reviews.</div>';
    }
}

function createMyReviewCard(review) {
    return `
        <div class="review-item" style="border-bottom:1px solid #eee; padding:1rem 0;">
            <div><b>Tour:</b> ${review.tour_title || review.tour_id}</div>
            <div><b>Rating:</b> ${review.rating} / 5</div>
            <div><b>Comment:</b> ${review.comment}</div>
            <div style="margin-top:0.5rem;">
                <button class="btn btn-outline btn-sm" onclick="editReview(${review.id}, this)">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteReview(${review.id}, this)">Delete</button>
            </div>
        </div>
    `;
}

// Edit review (simple prompt-based for now)
async function editReview(reviewId, btn) {
    const newComment = prompt('Update your review comment:');
    if (newComment === null) return;
    const newRating = prompt('Update your rating (1-5):');
    if (newRating === null) return;
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
        const res = await fetch('/api/reviews/update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: reviewId, comment: newComment, rating: newRating })
        });
        const result = await res.json();
        if (res.ok) {
            alert('Review updated.');
            loadMyReviews();
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        alert(err.message || 'Failed to update review.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Edit';
    }
}

// Delete review
async function deleteReview(reviewId, btn) {
    if (!confirm('Delete this review?')) return;
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    try {
        const res = await fetch('/api/reviews/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: reviewId })
        });
        const result = await res.json();
        if (res.ok) {
            alert('Review deleted.');
            loadMyReviews();
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        alert(err.message || 'Failed to delete review.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Delete';
    }
}

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

    window.showMessageBox = (message, { title = 'Message', type = 'info' } = {}) => {
        dialog.classList.remove('info', 'success', 'error');
        dialog.classList.add(type || 'info');
        titleEl.textContent = title;
        bodyEl.textContent = Array.isArray(message) ? message.join('\n') : message;
        modal.classList.add('show');
        okBtn?.focus({ preventScroll: true });
    };
}

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

        populateReviewTourSelect(allTours);

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
                        <button onclick="startTourBooking(${tour.id})" class="btn btn-primary">
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

// Review form setup
function setupReviewForm() {
    const form = document.getElementById('review-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tourId = document.getElementById('review-tour').value;
        const rating = parseFloat(document.getElementById('review-rating').value);
        const name = document.getElementById('review-name').value.trim();
        const email = document.getElementById('review-email').value.trim();
        const comment = document.getElementById('review-comment').value.trim();
        const status = document.getElementById('review-status');
        const submitBtn = document.getElementById('review-submit-btn');

        if (!tourId || Number.isNaN(rating)) {
            status.textContent = 'Please choose a tour and rating.';
            status.style.color = 'var(--danger)';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        status.textContent = 'Sending your review...';
        status.style.color = 'var(--text-muted)';

        try {
            const payload = {
                tour_id: Number.parseInt(tourId, 10),
                rating,
                comment
            };
            if (email) payload.email = email;
            if (name) payload.name = name;

            const res = await fetch(`${API_BASE_PATH}/api/v1/reviews.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': REVIEW_API_KEY
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to submit review');
            }

            status.textContent = 'Thanks! Your review was submitted.';
            status.style.color = 'var(--success, #16a34a)';
            form.reset();
            document.getElementById('review-tour').value = tourId; // keep tour selected
        } catch (err) {
            status.textContent = err.message || 'Could not submit review.';
            status.style.color = 'var(--danger)';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    });
}

function populateReviewTourSelect(tours) {
    const select = document.getElementById('review-tour');
    if (!select) return;
    const options = ['<option value="">Select a tour</option>'].concat(
        tours.map(t => `<option value="${t.id}">${t.title} — ${t.location}</option>`)
    );
    select.innerHTML = options.join('');
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

    const msg = `Tour Details:\n\n${tour.title}\nLocation: ${tour.location}\nDate: ${new Date(tour.schedule_date).toLocaleDateString()}\nDuration: ${tour.duration}\nPrice: $${tour.price}\n\n${tour.description}`;
    if (typeof showMessageBox === 'function') {
        showMessageBox(msg, { title: 'Tour Details' });
    } else {
        alert(msg);
    }
}

function startTourBooking(tourId) {
    const tour = allTours.find(t => t.id === tourId);
    if (!tour) {
        showMessageBox?.('Tour not found.', { title: 'Tours', type: 'error' });
        return;
    }

    // Require login before starting booking flow
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            showMessageBox?.('Please login to book tours.', { title: 'Login Required', type: 'info' });
            window.location.href = 'login.html';
            return;
        }
    } catch (_) {
        showMessageBox?.('Please login to book tours.', { title: 'Login Required', type: 'info' });
        window.location.href = 'login.html';
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
