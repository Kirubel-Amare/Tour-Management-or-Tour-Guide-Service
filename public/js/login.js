
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === 'password' ? 'text' : 'password';
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const errorDiv = document.getElementById('error-alert');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    function validateForm() {
        let isValid = true;
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';

        const email = emailInput.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('Please enter a valid email address');
            emailInput.focus();
            isValid = false;
        }

        const password = passwordInput.value.trim();
        if (!password || password.length < 6) {
            showError('Password must be at least 6 characters');
            if (isValid) passwordInput.focus();
            isValid = false;
        }

        return isValid;
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
    }

    function showSuccess(message) {
        const successDiv = document.querySelector('.success-message') || document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        errorDiv.before(successDiv);
        setTimeout(() => { successDiv.style.display = 'none'; }, 5000);
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...';

        const payload = {
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        };

        try {
            const response = await fetch('/api/auth/login.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Login failed. Check your credentials.');
            }

            // Save user session
            localStorage.setItem('user', JSON.stringify({
                id: result.id,
                name: result.name,
                email: payload.email,
                role: result.role,
                loggedInAt: new Date().toISOString()
            }));
            sessionStorage.setItem('isLoggedIn', 'true');

            showSuccess(`Welcome back, ${result.name}! Redirecting...`);

            // Redirect based on role
            setTimeout(() => {
                if (result.role === 'manager') {
                    window.location.href = 'manager_dashboard.html';
                } else if (result.role === 'admin') {
                    window.location.href = 'admin_dashboard.html';
                } else {
                    // Default to customer dashboard
                    window.location.href = 'customer_dashboard.html';
                }
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            showError(error.message);
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });
});
