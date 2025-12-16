function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    field.type = field.type === 'password' ? 'text' : 'password';
}

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    const errorDiv = document.getElementById('error-alert');
    const successDiv = document.getElementById('success-alert');
    const submitBtn = e.target.querySelector('button[type="submit"]');

    // Reset messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Frontend validation
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.style.display = 'block';
        return;
    }

    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.style.display = 'block';
        return;
    }

    // Disable button and show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    try {
        const response = await fetch('/api/auth/register.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: fullname,
                email: email,
                password: password,
                role: role
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Success
            successDiv.textContent = result.message;
            successDiv.style.display = 'block';

            // Redirect after short delay
            setTimeout(() => {
                if (role === 'guide') {
                    window.location.href = 'guide_dashboard.html';
                } else {
                    window.location.href = 'tourist_dashboard.html';
                }
            }, 2000);
        } else {
            // API returned error (400, 409, 500)
            errorDiv.textContent = result.message || 'Registration failed. Try again.';
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.textContent = 'Cannot connect to server. Please try again later.';
        errorDiv.style.display = 'block';
    } finally {
        // Reset button
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});
