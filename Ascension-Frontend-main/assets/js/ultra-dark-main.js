// ================================
// ASCENSION SYSTEM - ULTRA-DARK LOOKSMAXXING MAIN PAGE
// Masculine interactions and animations
// ================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize ultra-dark interactions
    initUltraDarkInteractions();
    
    // Initialize typewriter effect
    initTypewriter();
    
    // Initialize scroll reveal
    initScrollReveal();
    
    // Initialize before/after slider
    initBeforeAfterSlider();
    
    // Initialize crimson glow effects
    initCrimsonGlow();
});

// Initialize ultra-dark interactions
function initUltraDarkInteractions() {
    // Add hover effects to all buttons
    const buttons = document.querySelectorAll('.nav-btn, .cta-join, .btn-auth');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            if (this.classList.contains('cta-join') || this.classList.contains('btn-auth')) {
                this.style.transform = 'translateY(-2px) scale(1.02)';
                this.style.boxShadow = 'inset 0 0 15px rgba(183, 28, 28, 0.3), 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(183, 28, 28, 0.2)';
            } else {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 0 20px rgba(183, 28, 28, 0.2)';
            }
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
        
        // Add aggressive click feedback
        button.addEventListener('click', function(e) {
            this.style.transform = 'scale(0.96)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
        });
    });
    
    // Add hover effects to cards
    const cards = document.querySelectorAll('.feature-card, .transformation-item, .faq-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 20px rgba(183, 28, 28, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });
}

// Initialize typewriter effect
function initTypewriter() {
    const words = ['Maximum', 'Excellence', 'Discipline', 'Mastery'];
    const typewriterElement = document.getElementById('typewriter-text');
    const cursor = document.querySelector('.cursor');
    
    if (!typewriterElement || !cursor) return;
    
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentWord = words[wordIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentWord.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500;
        }
        
        setTimeout(type, typeSpeed);
    }
    
    type();
}

// Initialize scroll reveal
function initScrollReveal() {
    const reveals = document.querySelectorAll('.scroll-reveal');
    
    function checkReveal() {
        reveals.forEach(element => {
            const windowHeight = window.innerHeight;
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('revealed');
            }
        });
    }
    
    window.addEventListener('scroll', checkReveal);
    checkReveal();
}

// Initialize before/after slider
function initBeforeAfterSlider() {
    const beforeAfterContainers = document.querySelectorAll('.before-after');
    
    beforeAfterContainers.forEach(container => {
        const beforeImg = container.querySelector('.ba-before');
        const afterImg = container.querySelector('.ba-after');
        const overlay = container.querySelector('.ba-overlay');
        
        if (!beforeImg || !afterImg || !overlay) return;
        
        let isHovering = false;
        
        container.addEventListener('mouseenter', function() {
            isHovering = true;
            beforeImg.style.opacity = '0';
            overlay.style.background = 'linear-gradient(90deg, transparent 0%, rgba(183, 28, 28, 0.3) 100%)';
        });
        
        container.addEventListener('mouseleave', function() {
            isHovering = false;
            beforeImg.style.opacity = '1';
            overlay.style.background = 'linear-gradient(90deg, rgba(183, 28, 28, 0.3) 0%, transparent 50%, transparent 100%)';
        });
        
        // Add touch support for mobile
        container.addEventListener('touchstart', function() {
            beforeImg.style.opacity = '0';
            overlay.style.background = 'linear-gradient(90deg, transparent 0%, rgba(183, 28, 28, 0.3) 100%)';
        });
        
        container.addEventListener('touchend', function() {
            beforeImg.style.opacity = '1';
            overlay.style.background = 'linear-gradient(90deg, rgba(183, 28, 28, 0.3) 0%, transparent 50%, transparent 100%)';
        });
    });
}

// Initialize crimson glow effects
function initCrimsonGlow() {
    // Add pulsing glow to CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-join');
    ctaButtons.forEach(button => {
        setInterval(() => {
            if (!button.matches(':hover')) {
                button.style.boxShadow = `inset 0 0 ${Math.random() * 5 + 10}px rgba(183, 28, 28, 0.2), 0 2px 12px rgba(0, 0, 0, 0.6)`;
            }
        }, 3000);
    });
    
    // Add glow to accent elements on scroll
    const accentElements = document.querySelectorAll('.feature-card h3, .transformation-info p, .faq-item h3');
    accentElements.forEach(element => {
        setInterval(() => {
            if (element.getBoundingClientRect().top < window.innerHeight && element.getBoundingClientRect().bottom > 0) {
                element.style.textShadow = `0 0 ${Math.random() * 10 + 5}px rgba(183, 28, 28, 0.3)`;
                setTimeout(() => {
                    element.style.textShadow = '';
                }, 1000);
            }
        }, 5000);
    });
}

// Enhanced navigation
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Update active nav button on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.getAttribute('data-target') === current) {
                button.classList.add('active');
            }
        });
    });
}

// Enhanced auth modal
function initAuthModal() {
    const authToggle = document.getElementById('auth-toggle');
    const authModal = document.getElementById('auth-modal');
    const authClose = document.querySelector('.auth-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    if (authToggle && authModal) {
        authToggle.addEventListener('click', function() {
            authModal.style.display = 'flex';
            setTimeout(() => {
                authModal.style.opacity = '1';
            }, 10);
        });
    }
    
    if (authClose && authModal) {
        authClose.addEventListener('click', function() {
            authModal.style.opacity = '0';
            setTimeout(() => {
                authModal.style.display = 'none';
            }, 300);
        });
    }
    
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                authModal.style.opacity = '0';
                setTimeout(() => {
                    authModal.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            this.classList.add('active');
            document.querySelector(`.auth-form[data-tab="${targetTab}"]`).classList.add('active');
        });
    });
}

// Add video stats animation
function animateVideoStats() {
    const stats = document.querySelectorAll('.video-stats strong');
    const targets = ['1400+', '+1.4', '90'];
    
    stats.forEach((stat, index) => {
        const target = targets[index];
        let current = 0;
        const increment = parseFloat(target.replace(/[^\d.]/g, '')) / 50;
        
        const animation = setInterval(() => {
            current += increment;
            
            if (current >= parseFloat(target.replace(/[^\d.]/g, ''))) {
                current = parseFloat(target.replace(/[^\d.]/g, ''));
                clearInterval(animation);
                stat.textContent = target;
                stat.style.color = '#D32F2F';
                setTimeout(() => {
                    stat.style.color = '';
                }, 500);
            } else {
                stat.textContent = Math.round(current) + (target.includes('+') ? '+' : '');
            }
        }, 30);
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initAuthModal();
    
    // Animate video stats when visible
    const videoStats = document.querySelector('.video-stats');
    if (videoStats) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateVideoStats();
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(videoStats);
    }
});

// Export functions for global access
window.AscensionMain = {
    initNavigation,
    initAuthModal,
    animateVideoStats,
    initTypewriter,
    initScrollReveal
};
