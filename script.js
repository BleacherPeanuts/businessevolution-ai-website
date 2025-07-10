/**
 * Business Evolution AI - Landing Page JavaScript
 * Handles form submission, animations, and user interactions
 */

// Configuration
const CONFIG = {
    // Google Apps Script Web App URL
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzq4FeZrDeKKA-CsFKuWLToyLH1lwbfrqNDP8n3mfvFsgIcGwi0Jp5UI8yah8PIeFP2jQ/exec',
    
    // Set to false for live Google Sheets integration
    TEST_MODE: false,
    
    // Animation timings
    LOADING_DURATION: 2000,
    FORM_SUBMIT_TIMEOUT: 10000,
    
    // Messages
    MESSAGES: {
        SUCCESS: "Welcome to the community! You will receive our next newsletter!",
        ERROR: "Please enter a valid email address.",
        NETWORK_ERROR: "Network error. Please try again later.",
        TIMEOUT: "Request timed out. Please try again.",
        TEST_SUCCESS: "✅ Test mode: Form validation successful! (Google Sheets not connected yet)"
    }
};

// DOM Elements
let elements = {};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeAnimations();
    initializeFormHandling();
    initializeScrollAnimations();
    hideLoadingScreen();
});

/**
 * Initialize DOM element references
 */
function initializeElements() {
    elements = {
        loadingScreen: document.getElementById('loading-screen'),
        emailForm: document.getElementById('emailForm'),
        firstNameInput: document.getElementById('firstName'),
        emailInput: document.getElementById('email'),
        submitBtn: document.querySelector('.submit-btn'),
        btnText: document.querySelector('.btn-text'),
        loadingSpinner: document.querySelector('.loading-spinner'),
        formMessage: document.getElementById('form-message'),
        benefitItems: document.querySelectorAll('.benefit-item')
    };
}

/**
 * Hide loading screen with animation
 */
function hideLoadingScreen() {
    setTimeout(() => {
        if (elements.loadingScreen) {
            elements.loadingScreen.classList.add('hidden');
            // Remove from DOM after animation
            setTimeout(() => {
                elements.loadingScreen.remove();
            }, 500);
        }
    }, CONFIG.LOADING_DURATION);
}

/**
 * Initialize animations
 */
function initializeAnimations() {
    // Add staggered animation to benefit items
    elements.benefitItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.2}s`;
    });
}

/**
 * Initialize scroll-triggered animations
 */
function initializeScrollAnimations() {
    // Intersection Observer for benefit items
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.benefitItems.forEach(item => {
        observer.observe(item);
    });
}

/**
 * Initialize form handling
 */
function initializeFormHandling() {
    if (!elements.emailForm) return;
    
    elements.emailForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    elements.firstNameInput.addEventListener('input', handleFirstNameInput);
    elements.emailInput.addEventListener('input', handleEmailInput);
    elements.emailInput.addEventListener('blur', validateEmail);
}

/**
 * Handle first name input changes
 */
function handleFirstNameInput() {
    // Clear previous messages
    hideFormMessage();
    
    // Remove error styling
    elements.firstNameInput.classList.remove('error');
}

/**
 * Handle email input changes
 */
function handleEmailInput() {
    // Clear previous messages
    hideFormMessage();
    
    // Remove error styling
    elements.emailInput.classList.remove('error');
}

/**
 * Handle form submission
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const firstName = elements.firstNameInput.value.trim();
    const email = elements.emailInput.value.trim();
    
    // Validate first name
    if (!firstName) {
        showFormMessage('Please enter your first name.', 'error');
        elements.firstNameInput.classList.add('error');
        return;
    }
    
    // Validate email
    if (!isValidEmail(email)) {
        showFormMessage(CONFIG.MESSAGES.ERROR, 'error');
        elements.emailInput.classList.add('error');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        if (CONFIG.TEST_MODE) {
            // Test mode - simulate successful submission
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
            showFormMessage(`✅ Test mode: Welcome ${firstName}! Form validation successful! (Google Sheets not connected yet)`, 'success');
        } else {
            // Submit to Google Sheets
            await submitToGoogleSheets(firstName, email);
            showFormMessage(`Welcome to the community! You will receive our next newsletter!`, 'success');
            
            // Track conversion (if Google Analytics is set up)
            trackConversion(email);
        }
        
        // Reset form
        elements.emailForm.reset();
        
    } catch (error) {
        console.error('Form submission error:', error);
        
        let errorMessage = CONFIG.MESSAGES.NETWORK_ERROR;
        if (error.message === 'timeout') {
            errorMessage = CONFIG.MESSAGES.TIMEOUT;
        }
        
        showFormMessage(errorMessage, 'error');
    } finally {
        setLoadingState(false);
    }
}

/**
 * Submit form data to Google Sheets
 */
async function submitToGoogleSheets(firstName, email) {
    return new Promise((resolve, reject) => {
        // Create timeout
        const timeoutId = setTimeout(() => {
            reject(new Error('timeout'));
        }, CONFIG.FORM_SUBMIT_TIMEOUT);
        
        // Prepare FormData (avoids CORS preflight issues)
        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('email', email);
        formData.append('timestamp', new Date().toISOString());
        formData.append('source', 'Business Evolution AI');
        formData.append('ipAddress', 'Unknown');
        
        // Submit to Google Apps Script
        fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response.json();
        })
        .then(data => {
            if (data.success) {
                resolve(data);
            } else {
                reject(new Error(data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            clearTimeout(timeoutId);
            reject(error);
        });
    });
}

/**
 * Set loading state for form
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.submitBtn.classList.add('loading');
        elements.submitBtn.disabled = true;
        elements.firstNameInput.disabled = true;
        elements.emailInput.disabled = true;
    } else {
        elements.submitBtn.classList.remove('loading');
        elements.submitBtn.disabled = false;
        elements.firstNameInput.disabled = false;
        elements.emailInput.disabled = false;
    }
}

/**
 * Show form message
 */
function showFormMessage(message, type) {
    elements.formMessage.textContent = message;
    elements.formMessage.className = `form-message ${type} show`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            hideFormMessage();
        }, 5000);
    }
}

/**
 * Hide form message
 */
function hideFormMessage() {
    elements.formMessage.classList.remove('show');
}

/**
 * Validate email address
 */
function validateEmail() {
    const email = elements.emailInput.value.trim();
    
    if (email && !isValidEmail(email)) {
        elements.emailInput.classList.add('error');
        showFormMessage(CONFIG.MESSAGES.ERROR, 'error');
        return false;
    } else {
        elements.emailInput.classList.remove('error');
        hideFormMessage();
        return true;
    }
}

/**
 * Check if email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Track conversion event (Google Analytics)
 */
function trackConversion(email) {
    // Check if Google Analytics is loaded
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL', // Replace with your conversion ID
            'value': 1.0,
            'currency': 'USD',
            'transaction_id': Date.now().toString()
        });
        
        // Track as custom event
        gtag('event', 'email_signup', {
            'event_category': 'engagement',
            'event_label': 'newsletter_signup',
            'value': 1
        });
    }
    
    // Alternative analytics tracking
    if (typeof analytics !== 'undefined') {
        analytics.track('Email Signup', {
            email: email,
            source: 'landing-page',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Smooth scroll to element
 */
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Debounce function for performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Handle window resize events
 */
window.addEventListener('resize', debounce(() => {
    // Reinitialize animations if needed
    initializeAnimations();
}, 250));

/**
 * Handle keyboard navigation
 */
document.addEventListener('keydown', (e) => {
    // Enter key on form inputs
    if (e.key === 'Enter' && (document.activeElement === elements.firstNameInput || document.activeElement === elements.emailInput)) {
        elements.submitBtn.click();
    }
    
    // Escape key to close messages
    if (e.key === 'Escape') {
        hideFormMessage();
    }
});

/**
 * Prevent form submission on Enter in email field (handled by event listener)
 */
if (elements.emailInput) {
    elements.emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.emailForm.dispatchEvent(new Event('submit'));
        }
    });
}

/**
 * Add visual feedback for form interactions
 */
function addFormFeedback() {
    // Add ripple effect to button
    elements.submitBtn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

// Initialize feedback effects
document.addEventListener('DOMContentLoaded', addFormFeedback);

/**
 * Error boundary for unhandled errors
 */
window.addEventListener('error', (e) => {
    console.error('Unhandled error:', e.error);
    
    // Show user-friendly error message if form is being submitted
    if (elements.submitBtn && elements.submitBtn.classList.contains('loading')) {
        setLoadingState(false);
        showFormMessage(CONFIG.MESSAGES.NETWORK_ERROR, 'error');
    }
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    
    // Show user-friendly error message if form is being submitted
    if (elements.submitBtn && elements.submitBtn.classList.contains('loading')) {
        setLoadingState(false);
        showFormMessage(CONFIG.MESSAGES.NETWORK_ERROR, 'error');
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isValidEmail,
        submitToGoogleSheets,
        showFormMessage,
        hideFormMessage
    };
} 