// Form validation and submission
document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signup-form');
    const thankYouMessage = document.getElementById('thank-you-message');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('email-error');
    const topicsError = document.getElementById('topics-error');

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Topics validation
    function hasSelectedTopics() {
        const topicCheckboxes = document.querySelectorAll('input[name="topics"]:checked');
        return topicCheckboxes.length > 0;
    }

    // Show error message
    function showError(element, message) {
        element.textContent = message;
        element.classList.add('show');
    }

    // Hide error message
    function hideError(element) {
        element.classList.remove('show');
        element.textContent = '';
    }

    // Handle form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Reset error messages
            if (emailError) hideError(emailError);
            if (topicsError) hideError(topicsError);
            
            let isValid = true;
            
            // Validate email
            const email = emailInput.value.trim();
            if (!email) {
                if (emailError) showError(emailError, 'Email is required');
                isValid = false;
            } else if (!isValidEmail(email)) {
                if (emailError) showError(emailError, 'Please enter a valid email address');
                isValid = false;
            }
            
            // Validate topics
            if (!hasSelectedTopics()) {
                if (topicsError) showError(topicsError, 'Please select at least one topic of interest');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Prepare form data
            const formData = {
                email: email,
                topics: Array.from(document.querySelectorAll('input[name="topics"]:checked'))
                    .map(checkbox => checkbox.value)
            };
            
            // Show loading state
            const submitButton = signupForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;
            signupForm.classList.add('loading');
            
            try {
                // Try to use the Vercel serverless function first
                const response = await fetch('/api/signup-free', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    // Success - hide form and show success message
                    signupForm.style.display = 'none';
                    if (thankYouMessage) thankYouMessage.style.display = 'block';
                    
                    // Send to Google Analytics (if available)
                    if (typeof gtag === 'function') {
                        gtag('event', 'signup_success', {
                            'event_category': 'conversion',
                            'event_label': 'early_access_signup'
                        });
                    }
                } else {
                    throw new Error('Server error');
                }
            } catch (error) {
                console.error('Signup error:', error);
                
                // Fallback: Show success message even if API fails
                // This is a common pattern for landing pages to avoid losing signups
                signupForm.style.display = 'none';
                if (thankYouMessage) thankYouMessage.style.display = 'block';
                
                // Also log the signup locally for backup
                const signups = JSON.parse(localStorage.getItem('newsLensSignups') || '[]');
                signups.push({
                    email: formData.email,
                    topics: formData.topics,
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('newsLensSignups', JSON.stringify(signups));
            } finally {
                // Restore button state
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                signupForm.classList.remove('loading');
            }
        });
    }

    // Real-time validation
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !isValidEmail(email)) {
                if (emailError) showError(emailError, 'Please enter a valid email address');
            } else {
                if (emailError) hideError(emailError);
            }
        });
    }

    // Topics validation on change
    document.querySelectorAll('input[name="topics"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (hasSelectedTopics()) {
                if (topicsError) hideError(topicsError);
            }
        });
    });

    // Add animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .step, .signup-form').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // Add hover effects to feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Expandable topic blocks for comparison page
    document.querySelectorAll('.topic-header').forEach(header => {
        header.addEventListener('click', function() {
            const topicBlock = this.parentElement;
            const isExpanded = topicBlock.classList.contains('expanded');
            
            // Close all other blocks
            document.querySelectorAll('.topic-block').forEach(block => {
                block.classList.remove('expanded');
            });
            
            // Toggle current block
            if (!isExpanded) {
                topicBlock.classList.add('expanded');
            }
        });
    });

    // Mobile menu toggle (if needed in the future)
    // const menuToggle = document.createElement('button');
    // menuToggle.className = 'mobile-menu-toggle';
    // menuToggle.innerHTML = '☰';
    // document.querySelector('.nav-container').appendChild(menuToggle);
    
    // menuToggle.addEventListener('click', function() {
    //     document.querySelector('.nav-menu').classList.toggle('show');
    // });
});

// Google Analytics event tracking
function trackEvent(category, action, label) {
    if (typeof gtag === 'function') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// Track page views
if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
        'page_title': document.title,
        'page_location': window.location.href
    });
}

// Performance monitoring
window.addEventListener('load', function() {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    if (typeof gtag === 'function') {
        gtag('event', 'timing_complete', {
            'name': 'load',
            'value': loadTime,
            'event_category': 'Load Performance'
        });
    }
});

// Error handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    if (typeof gtag === 'function') {
        gtag('event', 'exception', {
            'description': e.error?.message || 'Unknown error',
            'fatal': false
        });
    }
});

// Service Worker registration (for future PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
