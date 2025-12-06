// NetisTrackGh Utility Functions

/**
 * Display alert message to user
 * @param {string} message - The message to display
 * @param {string} type - Type of alert: 'success', 'error', 'info', 'warning'
 * @param {number} duration - How long to show the alert in milliseconds (default: 5000)
 * @param {string} position - Position of alert: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
 */
export function showAlert(message, type = 'info', duration = 5000, position = 'top-right') {
    console.log(`📢 Alert [${type}]: ${message}`);
    
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.global-alert');
    existingAlerts.forEach(alert => {
        if (alert.parentElement) {
            alert.parentElement.remove();
        }
    });

    // Create alert container if it doesn't exist
    let alertContainer = document.getElementById('globalAlertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'globalAlertContainer';
        alertContainer.style.position = 'fixed';
        alertContainer.style.zIndex = '9999';
        alertContainer.style.padding = '20px';
        alertContainer.style.maxWidth = '400px';
        
        // Position the container
        switch (position) {
            case 'top-left':
                alertContainer.style.top = '20px';
                alertContainer.style.left = '20px';
                break;
            case 'bottom-left':
                alertContainer.style.bottom = '20px';
                alertContainer.style.left = '20px';
                break;
            case 'bottom-right':
                alertContainer.style.bottom = '20px';
                alertContainer.style.right = '20px';
                break;
            case 'top-right':
            default:
                alertContainer.style.top = '20px';
                alertContainer.style.right = '20px';
                break;
        }
        
        document.body.appendChild(alertContainer);
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `global-alert alert alert-${type}`;
    alert.style.marginBottom = '10px';
    alert.style.cursor = 'pointer';
    alert.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="flex: 1;">
                <strong style="display: block; margin-bottom: 4px; font-size: 14px;">
                    ${getAlertTitle(type)}
                </strong>
                <span style="font-size: 13px; line-height: 1.4;">${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="
                        background: none; 
                        border: none; 
                        font-size: 18px; 
                        cursor: pointer; 
                        color: inherit; 
                        opacity: 0.7;
                        padding: 4px;
                        border-radius: 4px;
                    "
                    onmouseover="this.style.opacity='1'"
                    onmouseout="this.style.opacity='0.7'"
                    aria-label="Close alert">
                ×
            </button>
        </div>
    `;

    // Add click to dismiss
    alert.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            alert.remove();
        }
    });

    alertContainer.appendChild(alert);

    // Auto-remove after duration
    if (duration > 0) {
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, duration);
    }

    return alert;
}

/**
 * Get alert title based on type
 * @param {string} type - Alert type
 * @returns {string} - Alert title
 */
function getAlertTitle(type) {
    const titles = {
        'success': '✅ Success',
        'error': '❌ Error',
        'info': 'ℹ️ Info',
        'warning': '⚠️ Warning'
    };
    return titles[type] || '📢 Alert';
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email.trim());
    
    console.log(`📧 Email validation: "${email}" -> ${isValid}`);
    return isValid;
}

/**
 * Validate Ghanaian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if phone is valid
 */
export function validatePhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    
    // Accepts formats: +233XXXXXXXXX, 023XXXXXXXX, 023XXXXXXXX
    const cleaned = phone.replace(/\s/g, '');
    const phoneRegex = /^(\+233|0)?[235]\d{8}$/;
    const isValid = phoneRegex.test(cleaned);
    
    console.log(`📱 Phone validation: "${phone}" -> ${isValid}`);
    return isValid;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Strength object with level and message
 */
export function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return {
            strength: 'weak',
            message: 'Password is required',
            checks: {
                length: false,
                uppercase: false,
                lowercase: false,
                number: false,
                special: false
            }
        };
    }

    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.values(checks).length;

    let strength = 'weak';
    let message = 'Password is weak';

    if (passedChecks >= 4) {
        strength = 'strong';
        message = 'Strong password';
    } else if (passedChecks >= 3) {
        strength = 'fair';
        message = 'Fair password';
    }

    console.log(`🔐 Password strength: ${strength} (${passedChecks}/${totalChecks} checks passed)`);

    return {
        strength,
        message,
        checks
    };
}

/**
 * Format phone number to Ghanaian standard
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number
 */
export function formatPhone(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('233') && cleaned.length === 12) {
        return `+${cleaned}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
        return `+233${cleaned.slice(1)}`;
    } else if (cleaned.length === 9 && /^[235]/.test(cleaned)) {
        return `+233${cleaned}`;
    }
    
    return phone;
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} - Formatted phone number for display
 */
export function formatPhoneForDisplay(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('233') && cleaned.length === 12) {
        return `+233 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
        return `0${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    
    return phone;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
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
 * Set loading state for a button
 * @param {HTMLElement} button - Button element
 * @param {boolean} isLoading - Whether to show loading state
 * @param {string} loadingText - Text to show during loading
 */
export function setButtonLoading(button, isLoading, loadingText = 'Processing...') {
    if (!button || !(button instanceof HTMLElement)) {
        console.warn('❌ setButtonLoading: Invalid button element');
        return;
    }

    if (isLoading) {
        button.disabled = true;
        button.setAttribute('data-original-text', button.innerHTML);
        button.innerHTML = `
            <span class="button-loading">
                <span class="button-spinner"></span>
                ${loadingText}
            </span>
        `;
        button.style.opacity = '0.8';
    } else {
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text') || 'Submit';
        button.innerHTML = originalText;
        button.removeAttribute('data-original-text');
        button.style.opacity = '1';
    }
}

/**
 * Clear form fields
 * @param {string} formId - ID of the form to clear
 */
export function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        console.log(`🧹 Form "${formId}" cleared`);
        
        // Clear any custom error states
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(el => {
            el.style.display = 'none';
        });
        
        const inputErrors = form.querySelectorAll('.input-error');
        inputErrors.forEach(el => {
            el.classList.remove('input-error');
        });
    } else {
        console.warn(`❌ Form with ID "${formId}" not found`);
    }
}

/**
 * Check if user is online
 * @returns {boolean} - True if online
 */
export function isOnline() {
    const online = navigator.onLine;
    console.log(`🌐 Online status: ${online}`);
    return online;
}

/**
 * Get current timestamp in ISO format
 * @returns {string} - ISO timestamp
 */
export function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Format date for display in Ghana locale
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleDateString('en-GH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'Africa/Accra'
        });
    } catch (error) {
        console.error('❌ Date formatting error:', error);
        return 'Invalid Date';
    }
}

/**
 * Format datetime for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted datetime
 */
export function formatDateTime(dateString) {
    try {
        return new Date(dateString).toLocaleString('en-GH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Africa/Accra'
        });
    } catch (error) {
        console.error('❌ DateTime formatting error:', error);
        return 'Invalid Date';
    }
}

/**
 * Format number as currency for Ghana (GHS) by default
 * @param {number|string} amount - Numeric amount
 * @param {string} currency - Currency code (default: 'GHS')
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = 'GHS') {
    try {
        if (amount === null || amount === undefined || amount === '') return 'N/A';
        const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
        if (Number.isNaN(num)) return String(amount);
        return new Intl.NumberFormat('en-GH', { style: 'currency', currency }).format(num);
    } catch (error) {
        console.error('❌ Currency formatting error:', error);
        return String(amount);
    }
}

/**
 * Format time for display (HH:MM)
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted time (e.g., "14:35")
 */
export function formatTime(dateString) {
    try {
        const d = new Date(dateString);
        return d.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (error) {
        console.error('❌ Time formatting error:', error);
        return '';
    }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate a unique ID
 * @param {number} length - Length of the ID (default: 8)
 * @returns {string} - Unique ID
 */
export function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Validate required field
 * @param {string} value - Field value
 * @param {string} fieldName - Field name for error message
 * @returns {string} - Error message or empty string if valid
 */
export function validateRequired(value, fieldName) {
    if (!value || value.trim().length === 0) {
        return `${fieldName} is required`;
    }
    return '';
}

/**
 * Validate minimum length
 * @param {string} value - Field value
 * @param {number} minLength - Minimum length
 * @param {string} fieldName - Field name for error message
 * @returns {string} - Error message or empty string if valid
 */
export function validateMinLength(value, minLength, fieldName) {
    if (value && value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`;
    }
    return '';
}

/**
 * Show field error
 * @param {string} fieldId - Field ID
 * @param {string} message - Error message
 */
export function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    
    if (field && errorElement) {
        field.classList.add('input-error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * Clear field error
 * @param {string} fieldId - Field ID
 */
export function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(`${fieldId}Error`);
    
    if (field && errorElement) {
        field.classList.remove('input-error');
        errorElement.style.display = 'none';
    }
}

/**
 * Check if all fields in a form are valid
 * @param {string} formId - Form ID
 * @returns {boolean} - True if all fields are valid
 */
export function isFormValid(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const errorElements = form.querySelectorAll('.error-message[style*="display: block"]');
    return errorElements.length === 0;
}

// Make functions available globally for HTML onclick handlers
window.showAlert = showAlert;
window.setButtonLoading = setButtonLoading;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;