// app.js - Interactive features for TourismPro website

// Lightweight popup helper shared across pages
(function setupPopup() {
    if (window.Popup) return;

    const styleId = 'popup-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; z-index: 9999; }
            .popup-modal { background: #fff; border-radius: 12px; padding: 1.25rem; width: min(420px, 90vw); box-shadow: 0 20px 60px rgba(0,0,0,0.18); border: 1px solid #e5e7eb; }
            .popup-modal h3 { margin: 0 0 0.5rem; font-size: 1.1rem; }
            .popup-modal p { margin: 0 0 1rem; color: #4b5563; }
            .popup-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
            .popup-btn { padding: 0.55rem 0.9rem; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; font-weight: 600; }
            .popup-btn.primary { background: linear-gradient(135deg, var(--primary, #4f46e5) 0%, var(--primary-dark, #4338ca) 100%); color: #fff; border-color: transparent; }
            .popup-toast { position: fixed; bottom: 1.25rem; right: 1.25rem; background: #111827; color: #fff; padding: 0.85rem 1rem; border-radius: 10px; box-shadow: 0 10px 35px rgba(0,0,0,0.22); z-index: 9999; min-width: 220px; display: flex; align-items: center; gap: 0.6rem; }
            .popup-toast.success { background: #065f46; }
            .popup-toast.error { background: #991b1b; }
            .popup-toast.info { background: #1f2937; }
        `;
        document.head.appendChild(style);
    }

    const toast = ({ message, type = 'info', timeout = 2800 }) => {
        const el = document.createElement('div');
        el.className = `popup-toast ${type}`;
        el.innerHTML = `<span>${message}</span>`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), timeout);
    };

    const confirm = ({ title = 'Confirm', message = 'Proceed?', okText = 'Yes', cancelText = 'Cancel' }) => {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'popup-overlay';
            overlay.innerHTML = `
                <div class="popup-modal">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="popup-actions">
                        <button class="popup-btn" data-action="cancel">${cancelText}</button>
                        <button class="popup-btn primary" data-action="ok">${okText}</button>
                    </div>
                </div>
            `;
            overlay.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                if (action === 'ok') { resolve(true); overlay.remove(); }
                if (action === 'cancel' || e.target === overlay) { resolve(false); overlay.remove(); }
            });
            document.body.appendChild(overlay);
        });
    };

    window.Popup = { toast, confirm };
})();

document.addEventListener('DOMContentLoaded', function () {
    // Load shared header/footer into placeholders
    const loadLayout = async () => {
        const header = document.getElementById('header-placeholder');
        const footer = document.getElementById('footer-placeholder');

        try {
            if (header) {
                const headerResp = await fetch('components/header.html');
                header.innerHTML = await headerResp.text();
            }

            if (footer) {
                const footerResp = await fetch('components/footer.html');
                footer.innerHTML = await footerResp.text();
            }
        } catch (err) {
            console.error('Failed to load shared layout:', err);
        }
    };
    // Mobile menu toggle (if we add a hamburger menu in the future)
    const setupMobileMenu = () => {
        // This is a placeholder for future mobile menu functionality
        console.log('Mobile menu setup ready');
    };

    // Smooth scroll for anchor links
    const smoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();

                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
    };

    // Add animation to cards when they come into view
    const animateOnScroll = () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe all cards
        document.querySelectorAll('.feature-card, .destination-card, .testimonial-card').forEach(card => {
            observer.observe(card);
        });
    };

    // Add active state to navbar links based on scroll position
    const setActiveNavLink = () => {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

        window.addEventListener('scroll', () => {
            let current = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;

                if (scrollY >= (sectionTop - 150)) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    };

    // Form validation for login/register (placeholder for future implementation)
    const setupFormValidation = () => {
        const forms = document.querySelectorAll('form');

        forms.forEach(form => {
            form.addEventListener('submit', function (e) {
                // Basic validation logic can be added here
                console.log('Form submitted:', this.id || 'unknown form');
            });
        });
    };

    // Dynamic Navbar and Footer
    const updateNavbar = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        const authLinks = document.getElementById('auth-links');
        const userLinks = document.getElementById('user-links');
        const dashboardLink = document.getElementById('dashboard-link');

        // Select main navigation links (direct children of .nav-links)
        const navLinks = document.querySelectorAll('.nav-links > a');
        // Select footer links
        const footerLinks = document.querySelectorAll('footer a');

        // Page protection: only redirect dashboards/profile. Tours/Services stay readable.
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const protectedPages = ['customer_dashboard.html', 'manager_dashboard.html', 'admin_dashboard.html', 'profile.html'];

        if (!user && protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
            return;
        }

        const setDashboardHref = () => {
            if (!dashboardLink) return;
            const role = ((user && user.role) || '').toString().trim().toLowerCase();
            let target = 'customer_dashboard.html';
            if (role === 'manager' || role === 'guide') target = 'manager_dashboard.html';
            if (role === 'admin') target = 'admin_dashboard.html';
            if (!user) target = 'login.html';
            dashboardLink.href = target;
            dashboardLink.onclick = () => { window.location.href = target; };
        };

        if (authLinks && userLinks) {
            if (user) {
                authLinks.style.display = 'none';
                userLinks.style.display = 'inline-block';

                navLinks.forEach(link => {
                    link.style.display = 'inline-block';
                });

                footerLinks.forEach(link => {
                    link.style.display = 'inline-block';
                });
            } else {
                authLinks.style.display = 'inline-block';
                userLinks.style.display = 'none';

                navLinks.forEach(link => {
                    link.style.display = 'inline-block';
                });

                footerLinks.forEach(link => {
                    link.style.display = 'inline-block';
                });
            }
        }

        setDashboardHref();
    };

    // Gate interactions for read-only pages; allow viewing but redirect clicks to auth
    const gateContentAccess = (selectors) => {
        selectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (!el) return;
            el.addEventListener('click', (e) => {
                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (currentUser) return; // allow once logged in

                const anchor = e.target.closest('a');
                const href = anchor ? anchor.getAttribute('href') || '' : '';
                if (href.includes('login.html') || href.includes('register.html')) return;

                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'login.html';
            });
        });
    };

    // Initialize all functions
    const init = async () => {
        await loadLayout();
        setupMobileMenu();
        smoothScroll();
        animateOnScroll();
        setActiveNavLink();
        setupFormValidation();
        updateNavbar(); // Run navbar check after layout injection

        // Allow reading services/tours but redirect any interaction to login/register when logged out
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        if (currentPage === 'services.html') {
            gateContentAccess(['.services-hero', '.services-nav', '.container']);
        }
        if (currentPage === 'tours.html') {
            gateContentAccess(['.tours-hero', '.search-filters', '.tours-grid', '.featured-tours']);
        }

        // Add CSS for animations
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                animation: fadeInUp 0.6s ease forwards;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .nav-links a.active {
                color: var(--secondary) !important;
            }
            
            .nav-links a.active:after {
                width: 100% !important;
            }
        `;
        document.head.appendChild(style);
    };

    // Run initialization
    init();
});