
// Initialize
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'manager') {
    window.location.href = 'login.html';
}

// Set user name
document.getElementById('user-name').textContent = user.name;

// Global state for tours
let allTours = [];
let managerBookings = [];

// Load all data
function loadDashboardData() {
    loadTours(); // This will also update stats when done
    loadActivity();
    loadRecentBookings();
    loadPlaces();
}

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
    } else if (tabName === 'revenue') {
        updateRevenueSnapshot();
    } else if (tabName === 'places') {
        loadPlaces();
    }
}

// Update statistics
function updateStats() {
    // Filter tours for this guide
    const myTours = allTours.filter(t => t.guide_id == user.id);

    const totalTours = myTours.length;
    const totalBookings = managerBookings.length;
    const totalRevenue = managerBookings.reduce((sum, b) => sum + parseFloat(b.price), 0);
    const avgRating = totalBookings > 0 ? 4.5 : 0;

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

function updateRevenueSnapshot() {
    const totalRevenue = managerBookings.reduce((sum, b) => sum + parseFloat(b.price), 0);
    const bookingsCount = managerBookings.length;
    const avg = bookingsCount > 0 ? totalRevenue / bookingsCount : 0;

    const totalEl = document.getElementById('rev-total');
    const countEl = document.getElementById('rev-bookings');
    const avgEl = document.getElementById('rev-avg');

    if (totalEl) totalEl.textContent = `$${totalRevenue.toFixed(2)}`;
    if (countEl) countEl.textContent = bookingsCount;
    if (avgEl) avgEl.textContent = `$${avg.toFixed(2)}`;
}

// Load activity timeline
function loadActivity() {
    const container = document.getElementById('activity-timeline');
    if (managerBookings.length === 0) {
        container.innerHTML = '<div class="activity-item">No recent activity yet.</div>';
        return;
    }

    container.innerHTML = managerBookings.slice(0, 5).map(activity => `
        <div class="activity-item">
            <div class="activity-icon booking">
                <i class="fas fa-calendar-check"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.customer_name} booked ${activity.tour_title}</div>
                <div class="activity-description">${new Date(activity.booking_date).toLocaleString()}</div>
                <div class="activity-time">${activity.status}</div>
            </div>
        </div>
    `).join('');
}

// Load recent bookings (Participants)
async function loadBookings() {
    const container = document.getElementById('recent-bookings');
    const fullTable = document.getElementById('bookings-table-body');
    container.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading participants...</td></tr>';
    if (fullTable) {
        fullTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';
    }

    try {
        const response = await fetch(`/api/bookings/read_manager.php?guide_id=${user.id}`);
        const bookings = await response.json();
        managerBookings = bookings;

        // Update global booking stats
        document.getElementById('total-bookings').textContent = bookings.length;
        document.getElementById('booking-count').textContent = bookings.length;

        // Calculate revenue
        const revenue = bookings.reduce((sum, b) => sum + parseFloat(b.price), 0);
        document.getElementById('total-revenue').textContent = `$${revenue.toFixed(2)}`;

        if (bookings.length === 0) {
            container.innerHTML = '<tr><td colspan="5" style="text-align:center;">No bookings found yet.</td></tr>';
            if (fullTable) {
                fullTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">No bookings yet.</td></tr>';
            }
        } else {
            const rows = bookings.map(booking => `
                <tr>
                    <td>
                        <strong>${booking.customer_name}</strong><br>
                        <small style="color:var(--text-muted)">${booking.customer_email}</small>
                    </td>
                    <td>${booking.tour_title}</td>
                    <td>${new Date(booking.schedule_date).toLocaleDateString()}</td>
                    <td><span class="booking-status status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
                    <td><strong>$${booking.price}</strong></td>
                </tr>
            `).join('');

            container.innerHTML = rows;
            if (fullTable) {
                fullTable.innerHTML = rows;
            }
        }

        updateStats();
        loadActivity();
        updateRevenueSnapshot();
    } catch (error) {
        console.error('Error loading bookings:', error);
        container.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load participants.</td></tr>';
        if (fullTable) {
            fullTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load participants.</td></tr>';
        }
    }
}

// Load recent bookings alias (for dashboard tab)
function loadRecentBookings() {
    loadBookings();
}

function filterBookings() {
    const term = (document.getElementById('booking-search')?.value || '').toLowerCase();
    const fullTable = document.getElementById('bookings-table-body');
    if (!fullTable || managerBookings.length === 0) return;

    const filtered = managerBookings.filter(b =>
        b.customer_name.toLowerCase().includes(term) ||
        b.customer_email.toLowerCase().includes(term) ||
        b.tour_title.toLowerCase().includes(term)
    );

    fullTable.innerHTML = filtered.map(booking => `
        <tr>
            <td>
                <strong>${booking.customer_name}</strong><br>
                <small style="color:var(--text-muted)">${booking.customer_email}</small>
            </td>
            <td>${booking.tour_title}</td>
            <td>${new Date(booking.schedule_date).toLocaleDateString()}</td>
            <td><span class="booking-status status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
            <td><strong>$${booking.price}</strong></td>
        </tr>
    `).join('');

    if (filtered.length === 0) {
        fullTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">No matching bookings.</td></tr>';
    }
}

function resetBookingFilters() {
    const input = document.getElementById('booking-search');
    if (input) input.value = '';
    const fullTable = document.getElementById('bookings-table-body');
    if (fullTable) {
        fullTable.innerHTML = managerBookings.map(booking => `
            <tr>
                <td>
                    <strong>${booking.customer_name}</strong><br>
                    <small style="color:var(--text-muted)">${booking.customer_email}</small>
                </td>
                <td>${booking.tour_title}</td>
                <td>${new Date(booking.schedule_date).toLocaleDateString()}</td>
                <td><span class="booking-status status-${booking.status}">${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span></td>
                <td><strong>$${booking.price}</strong></td>
            </tr>
        `).join('');
    }
}

// Load tours from API
async function loadTours() {
    const container = document.getElementById('tours-list');
    container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center;">Loading...</div>';

    try {
        const response = await fetch('/api/tours/read.php');
        const tours = await response.json();

        // Filter tours for current manager
        allTours = tours.filter(t => t.guide_id == user.id);

        updateStats();

        if (allTours.length === 0) {
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
            container.innerHTML = allTours.map(tour => createTourCard(tour)).join('');
        }
    } catch (error) {
        console.error('Error loading tours:', error);
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: red;">Failed to load tours.</div>';
    }
}

// Load places from API
async function loadPlaces() {
    const container = document.getElementById('places-list');
    const locationSelect = document.getElementById('tour-location');

    // Only show loading if empty
    if (container.innerHTML.trim() === '') {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center;">Loading...</div>';
    }

    try {
        const response = await fetch('/api/places/read.php');
        const places = await response.json();

        if (places.length === 0) {
            container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center;">No places found.</div>';
        } else {
            container.innerHTML = places.map(place => `
                <div class="tour-card">
                    <div class="tour-image" style="background-image: url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'); height: 160px;">
                        <span class="tour-badge" style="background: var(--secondary);">${place.category}</span>
                    </div>
                    <div class="tour-content">
                        <h3 class="tour-title">${place.name}</h3>
                        <div class="tour-meta">
                            <span class="tour-meta-item">
                                <i class="fas fa-map-marker-alt"></i>
                                ${place.city}, ${place.country}
                            </span>
                        </div>
                        <p class="tour-description" style="margin-top: 0.5rem; font-size: 0.9rem;">
                            Discover the beauty of ${place.name}. A perfect destination for your next tour group.
                        </p>
                        <div class="tour-footer">
                            <button onclick="createTourForPlace('${place.city}, ${place.country}')" class="btn btn-outline btn-sm" style="width: 100%;">
                                <i class="fas fa-plus"></i> Create Tour Here
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Populate dropdown
            // Keep the default "Select a Place..." option
            if (locationSelect) {
                locationSelect.innerHTML = '<option value="">Select a Place...</option>' +
                    places.map(place => `<option value="${place.city}, ${place.country}">${place.name} (${place.city}, ${place.country})</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error loading places:', error);
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: red;">Failed to load places.</div>';
    }
}

function createTourForPlace(location) {
    switchTab('tours');
    showCreateTourModal();
    // Pre-select location after a short delay to ensure modal is ready
    setTimeout(() => {
        const select = document.getElementById('tour-location');
        if (select) {
            select.value = location;
        }
    }, 100);
}

// Create tour card
function createTourCard(tour) {
    const formattedDate = new Date(tour.schedule_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Default image if not present (backend does not store image yet, so use placeholder)
    const image = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
    const status = 'active'; // Default status for now
    const rating = 0; // Default
    const bookings = 0; // Default

    return `
        <div class="tour-card">
            <div class="tour-image" style="background-image: url('${image}');">
                <span class="tour-badge">${status.toUpperCase()}</span>
            </div>
            <div class="tour-content">
                <h3 class="tour-title">${tour.title}</h3>
                <div class="tour-meta">
                    <span class="tour-meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        ${tour.location}
                    </span>
                </div>
                <p class="tour-description">${tour.description}</p>
                <div class="tour-footer">
                    <div class="tour-stats">
                        <div class="tour-price">$${tour.price}</div>
                        <div style="text-align: right;">
                             <small style="color: var(--text-muted);">${formattedDate}</small>
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
    // Hide other tabs if open, though modal usually overlays
    // document.getElementById('tours-tab').style.display = 'none'; 
}

function closeCreateTourModal() {
    document.getElementById('create-tour-modal').style.display = 'none';
    document.getElementById('create-tour-form').reset();
    delete document.getElementById('create-tour-form').dataset.editId; // Clear edit ID
}

// Create/Update tour form handler
document.getElementById('create-tour-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const title = document.getElementById('tour-title').value;
    const location = document.getElementById('tour-location').value;
    const price = parseFloat(document.getElementById('tour-price').value);
    const date = document.getElementById('tour-date').value;
    const desc = document.getElementById('tour-desc').value;
    // Image, maxParticipants, duration are not in backend yet, ignore for now

    const editId = this.dataset.editId;

    const payload = {
        guide_id: user.id,
        title: title,
        location: location,
        price: price,
        schedule_date: date,
        description: desc
    };

    let url = '/api/tours/create.php';
    let method = 'POST';

    if (editId) {
        url = '/api/tours/update.php';
        method = 'PUT';
        payload.id = editId;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert(editId ? 'Tour updated successfully!' : 'Tour created successfully!');
            closeCreateTourModal();
            loadTours();
        } else {
            const data = await response.json();
            alert('Error: ' + (data.message || 'Operation failed'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred. Please try again.');
    }
});

function editTour(id) {
    const tour = allTours.find(t => t.id == id);
    if (tour) {
        document.getElementById('tour-title').value = tour.title;
        document.getElementById('tour-location').value = tour.location;
        document.getElementById('tour-price').value = tour.price;
        document.getElementById('tour-date').value = tour.schedule_date;
        document.getElementById('tour-desc').value = tour.description;
        // document.getElementById('tour-image').value = tour.image;
        // document.getElementById('tour-max-participants').value = tour.maxParticipants;
        // document.getElementById('tour-duration').value = tour.duration;

        // Set edit mode
        document.getElementById('create-tour-form').dataset.editId = id;

        showCreateTourModal();
    }
}

function viewTourDetails(id) {
    const tour = allTours.find(t => t.id == id);
    if (tour) {
        alert(`Tour Details:\n\nTitle: ${tour.title}\nLocation: ${tour.location}\nPrice: $${tour.price}\nDate: ${new Date(tour.schedule_date).toLocaleDateString()}\nDescription: ${tour.description}`);
    }
}

async function deleteTour(id) {
    if (confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
        try {
            const response = await fetch('/api/tours/delete.php', {
                method: 'DELETE', // Method typically used, but PHP script reads body
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: id,
                    guide_id: user.id
                })
            });

            if (response.ok) {
                // Remove locally to update UI immediately or reload
                loadTours();
            } else {
                alert('Failed to delete tour');
            }
        } catch (error) {
            console.error('Error deleting tour:', error);
            alert('An error occurred while deleting.');
        }
    }
}

// Quick actions
function createNewTour() {
    switchTab('tours');
    showCreateTourModal();
}

function viewCalendar() {
    const modal = document.getElementById('calendar-modal');
    const content = document.getElementById('calendar-content');
    if (!modal || !content) return;

    // Group bookings by date
    const groups = managerBookings.reduce((acc, b) => {
        const key = new Date(b.schedule_date).toLocaleDateString();
        acc[key] = acc[key] || [];
        acc[key].push(b);
        return acc;
    }, {});

    const dates = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b));
    if (dates.length === 0) {
        content.innerHTML = '<div style="text-align:center; color:var(--text-muted);">No upcoming bookings.</div>';
    } else {
        content.innerHTML = dates.map(date => `
            <div style="margin-bottom:1rem;">
                <h4 style="margin:0 0 .5rem 0; color:var(--dark);"><i class="fas fa-calendar-alt"></i> ${date}</h4>
                <div style="overflow-x:auto;">
                    <table class="bookings-table">
                        <thead>
                            <tr><th>Customer</th><th>Tour</th><th>Status</th><th>Amount</th></tr>
                        </thead>
                        <tbody>
                            ${groups[date].map(b => `
                                <tr>
                                    <td><strong>${b.customer_name}</strong><br><small style="color:var(--text-muted)">${b.customer_email}</small></td>
                                    <td>${b.tour_title}</td>
                                    <td>${b.status}</td>
                                    <td>$${b.price}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    }

    modal.style.display = 'flex';
}

function exportReports() {
    if (!managerBookings || managerBookings.length === 0) {
        return alert('No bookings to export.');
    }
    const header = ['Customer','Email','Tour','Date','Status','Amount'];
    const rows = managerBookings.map(b => [
        b.customer_name,
        b.customer_email,
        b.tour_title,
        new Date(b.schedule_date).toISOString().split('T')[0],
        b.status,
        b.price
    ]);
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replaceAll('"','""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_report.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function sendNewsletter() {
    // Collect unique participant emails from bookings
    const set = new Set((managerBookings || []).map(b => b.customer_email).filter(Boolean));
    if (set.size === 0) return alert('No recipient emails found.');
    const subject = prompt('Newsletter subject:', 'Update from your guide');
    if (subject === null) return;
    const body = prompt('Message body:', 'Hello everyone, here are the latest updates...');
    if (body === null) return;
    const bcc = encodeURIComponent(Array.from(set).join(','));
    const mailto = `mailto:?bcc=${bcc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
}

function closeCalendarModal() {
    const modal = document.getElementById('calendar-modal');
    if (modal) modal.style.display = 'none';
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('/api/auth/logout.php', { method: 'POST' }).finally(() => {
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function () {
    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('tour-date');
    if (dateInput) {
        dateInput.value = tomorrow.toISOString().split('T')[0];
        dateInput.min = tomorrow.toISOString().split('T')[0];
    }

    // Initialize date picker if flatpickr exists
    if (typeof flatpickr !== 'undefined') {
        flatpickr("#tour-date", {
            minDate: "today",
            dateFormat: "Y-m-d",
        });
    }

    // Load initial data
    loadDashboardData();

    // Close modal event
    window.onclick = function (event) {
        const modal = document.getElementById('create-tour-modal');
        if (event.target == modal) {
            closeCreateTourModal();
        }
    }
});
