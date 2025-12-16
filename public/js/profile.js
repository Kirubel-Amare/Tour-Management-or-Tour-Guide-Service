document.addEventListener('DOMContentLoaded', async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Setup links
    const dashboardLink = document.getElementById('dashboard-link');
    const backLink = document.getElementById('back-link');
    const targetDashboard = user.role === 'manager' ? 'manager_dashboard.html' : 'customer_dashboard.html';

    dashboardLink.href = targetDashboard;
    backLink.href = targetDashboard;

    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });

    // Populate Initial Data
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const avatarDisplay = document.getElementById('profile-avatar');
    const nameDisplay = document.getElementById('profile-name-display');
    const roleDisplay = document.getElementById('profile-role-display');

    // Fetch latest data from API
    try {
        const response = await fetch(`/api/user/profile.php?id=${user.id}`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            const data = await response.json();

            nameInput.value = data.name;
            emailInput.value = data.email;

            nameDisplay.textContent = data.name;
            roleDisplay.textContent = data.role.charAt(0).toUpperCase() + data.role.slice(1);
            avatarDisplay.textContent = data.name.charAt(0).toUpperCase();

            // Update local storage if needed
            user.name = data.name;
            user.email = data.email;
            user.role = data.role;
            localStorage.setItem('user', JSON.stringify(user));
        }
    } catch (err) {
        console.error('Failed to fetch profile', err);
    }

    // Handle Form Submit
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = document.getElementById('password').value.trim();
        const btn = e.target.querySelector('button');
        const msgContainer = document.getElementById('message-container');

        btn.disabled = true;
        btn.textContent = 'Saving...';
        msgContainer.innerHTML = '';

        const payload = {
            id: user.id,
            name: name,
            email: email
        };
        if (password) {
            payload.password = password;
        }

        try {
            const res = await fetch('/api/user/profile.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (res.ok) {
                msgContainer.innerHTML = `<div style="color: green; margin-bottom: 1rem; padding: 0.5rem; background: #dcfce7; border-radius: 0.5rem;">${result.message}</div>`;

                // Update display
                nameDisplay.textContent = name;
                avatarDisplay.textContent = name.charAt(0).toUpperCase();

                // Update local storage
                user.name = name;
                user.email = email;
                localStorage.setItem('user', JSON.stringify(user));

            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            msgContainer.innerHTML = `<div style="color: red; margin-bottom: 1rem; padding: 0.5rem; background: #fee2e2; border-radius: 0.5rem;">${error.message || 'Update failed'}</div>`;
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Changes';
        }
    });
});
