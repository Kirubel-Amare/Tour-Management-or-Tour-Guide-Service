// app.js - Interactive features for TourismPro website

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