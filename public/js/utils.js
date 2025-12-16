// app.js - Interactive features for TourismPro website

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle (if we add a hamburger menu in the future)
    const setupMobileMenu = () => {
        // This is a placeholder for future mobile menu functionality
        console.log('Mobile menu setup ready');
    };
    
    // Smooth scroll for anchor links
    const smoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
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
            form.addEventListener('submit', function(e) {
                // Basic validation logic can be added here
                console.log('Form submitted:', this.id || 'unknown form');
            });
        });
    };
    
    // Initialize all functions
    const init = () => {
        setupMobileMenu();
        smoothScroll();
        animateOnScroll();
        setActiveNavLink();
        setupFormValidation();
        
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