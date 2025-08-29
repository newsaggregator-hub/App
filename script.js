// DOM Elements
const signupForm = document.getElementById('signupForm');
const emailInput = document.getElementById('email');
const submitBtn = document.getElementById('submitBtn');
const thankYouMessage = document.getElementById('thankYouMessage');
const emailError = document.getElementById('emailError');
const topicsError = document.getElementById('topicsError');

// Form validation state
let isEmailValid = false;
let areTopicsSelected = false;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Initialize form validation
function initializeValidation() {
    // Email input validation
    emailInput.addEventListener('input', validateEmail);
    emailInput.addEventListener('blur', validateEmail);
    
    // Topics validation
    const topicCheckboxes = document.querySelectorAll('input[name="topics"]');
    topicCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', validateTopics);
    });
    
    // Form submission
    signupForm.addEventListener('submit', handleFormSubmit);
    
    // Initial validation check
    validateForm();
}

// Validate email input
function validateEmail() {
    const email = emailInput.value.trim();
    
    if (!email) {
        showError(emailError, 'Email address is required');
        isEmailValid = false;
    } else if (!emailRegex.test(email)) {
        showError(emailError, 'Please enter a valid email address');
        isEmailValid = false;
    } else {
        hideError(emailError);
        isEmailValid = true;
    }
    
    validateForm();
}

// Validate topics selection
function validateTopics() {
    const selectedTopics = document.querySelectorAll('input[name="topics"]:checked');
    
    if (selectedTopics.length === 0) {
        showError(topicsError, 'Please select at least one topic of interest');
        areTopicsSelected = false;
    } else {
        hideError(topicsError);
        areTopicsSelected = true;
    }
    
    validateForm();
}

// Show error message
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

// Hide error message
function hideError(errorElement) {
    errorElement.textContent = '';
    errorElement.classList.remove('show');
}

// Validate entire form and update submit button state
function validateForm() {
    const isFormValid = isEmailValid && areTopicsSelected;
    submitBtn.disabled = !isFormValid;
    
    if (isFormValid) {
        submitBtn.classList.remove('disabled');
    } else {
        submitBtn.classList.add('disabled');
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Final validation
    validateEmail();
    validateTopics();
    
    if (!isEmailValid || !areTopicsSelected) {
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Collect form data
        const formData = collectFormData();
        
        // Submit to API
        const response = await submitSignup(formData);
        
        if (response.success) {
            // Show success message
            showSuccessMessage();
            
            // Track conversion (Google Analytics)
            trackSignupConversion(formData);
        } else {
            throw new Error(response.error || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError(emailError, 'Something went wrong. Please try again.');
    } finally {
        setLoadingState(false);
    }
}

// Collect form data
function collectFormData() {
    const email = emailInput.value.trim();
    const selectedTopics = Array.from(document.querySelectorAll('input[name="topics"]:checked'))
        .map(checkbox => checkbox.value);
    
    return {
        email,
        topics: selectedTopics
    };
}

// Submit signup data to API
async function submitSignup(data) {
    const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

// Set loading state
function setLoadingState(isLoading) {
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        submitBtn.disabled = true;
    } else {
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
        validateForm(); // Re-enable button if form is valid
    }
}

// Show success message
function showSuccessMessage() {
    signupForm.style.display = 'none';
    thankYouMessage.style.display = 'block';
    
    // Smooth scroll to success message
    thankYouMessage.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
    });
}

// Track signup conversion for analytics
function trackSignupConversion(data) {
    // Google Analytics event tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'signup', {
            event_category: 'engagement',
            event_label: 'early_access_signup',
            custom_parameters: {
                topics: data.topics.join(','),
                email_domain: data.email.split('@')[1]
            }
        });
    }
    
    // Console log for development
    console.log('Signup successful:', data);
}

// Smooth scrolling for navigation links
function initializeSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Initialize animations on scroll
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

// Handle header scroll effect
function initializeHeaderScroll() {
    const header = document.querySelector('.header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Initialize news card hover effects
function initializeNewsCardEffects() {
    const newsCards = document.querySelectorAll('.news-card.preview');
    
    newsCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateX(10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateX(0) scale(1)';
        });
    });
}

// Handle mobile menu (if needed in future)
function initializeMobileMenu() {
    // Placeholder for mobile menu functionality
    // Can be expanded when mobile menu is added
}

// Error handling for network issues
function handleNetworkError() {
    window.addEventListener('online', () => {
        console.log('Connection restored');
        // Could show a notification that connection is restored
    });
    
    window.addEventListener('offline', () => {
        console.log('Connection lost');
        // Could show a notification about offline status
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeValidation();
    initializeSmoothScrolling();
    initializeScrollAnimations();
    initializeHeaderScroll();
    initializeNewsCardEffects();
    initializeMobileMenu();
    handleNetworkError();
    
    console.log('NewsLens landing page initialized');
});

// Handle page visibility changes (for analytics)
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Track page return
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: 'NewsLens Landing Page',
                page_location: window.location.href
            });
        }
    }
});

// Keyboard accessibility
document.addEventListener('keydown', function(event) {
    // Handle Enter key on form elements
    if (event.key === 'Enter' && event.target.type === 'checkbox') {
        event.target.click();
    }
    
    // Handle Escape key to close any modals (future feature)
    if (event.key === 'Escape') {
        // Could close modals or reset form state
    }
});

// Performance monitoring
window.addEventListener('load', function() {
    // Log page load time for optimization
    const loadTime = performance.now();
    console.log(`Page loaded in ${Math.round(loadTime)}ms`);
    
    // Track page load performance
    if (typeof gtag !== 'undefined') {
        gtag('event', 'timing_complete', {
            name: 'page_load',
            value: Math.round(loadTime)
        });
    }
});
