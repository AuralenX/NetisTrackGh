import { showAlert, validateEmail, validatePhone, setButtonLoading } from '../utils/helpers.js';

export class RequestAccount {
    constructor() {
        this.emailjsInitialized = false;
        this.isSubmitting = false; // Add this flag
        this.eventHandlers = new Map(); // Track event handlers
        this.init();
    }

    async init() {
        console.log('RequestAccount component initialized');
        await this.initializeEmailJS();
    }
    
    attachEvents() {
        console.log('Attaching request account events');
        
        const requestForm = document.getElementById('requestAccountForm');
        const requestButton = document.getElementById('requestButton');
        const backToLoginLink = document.getElementById('backToLoginLink');

        if (!requestForm) {
            console.error('❌ Request form not found');
            return;
        }

        // CLEAR EXISTING EVENT LISTENERS
        this.detachEvents();

        // Create bound handlers
        const handleSubmit = async (e) => {
            e.preventDefault();
            await this.handleAccountRequest();
        };

        const handleBackToLogin = (e) => {
            e.preventDefault();
            this.navigateToLogin();
        };

        // Store handlers
        this.eventHandlers.set('formSubmit', handleSubmit);
        this.eventHandlers.set('backToLogin', handleBackToLogin);

        // Form submission - add debouncing
        requestForm.addEventListener('submit', handleSubmit);

        // Navigation link
        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', handleBackToLogin);
        }

        // Add real-time validation
        this.attachRealTimeValidation();
    }

    detachEvents() {
        const requestForm = document.getElementById('requestAccountForm');
        const backToLoginLink = document.getElementById('backToLoginLink');

        if (requestForm && this.eventHandlers.size > 0) {
            this.eventHandlers.forEach((handler, key) => {
                if (key === 'formSubmit') requestForm.removeEventListener('submit', handler);
                if (key === 'backToLogin' && backToLoginLink) {
                    backToLoginLink.removeEventListener('click', handler);
                }
            });
            
            this.eventHandlers.clear();
            console.log('🧹 Previous event listeners removed');
        }
    }


    async initializeEmailJS() {
        if (this.emailjsInitialized) return true;

        return new Promise((resolve, reject) => {
            if (typeof emailjs === 'undefined') {
                showAlert('Email service not available. Please refresh the page.', 'error');
                reject(new Error('EmailJS not loaded'));
                return;
            }

            try {
                // Initialize EmailJS with your public key
                emailjs.init('4_lUB6bKxfFV5xsno');
                this.emailjsInitialized = true;
                console.log('EmailJS initialized successfully');
                resolve(true);
            } catch (error) {
                console.error('EmailJS initialization failed:', error);
                showAlert('Failed to initialize email service.', 'error');
                reject(error);
            }
        });
    }

    render() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="icons/logo.png" alt="NetisTrackGh" class="auth-logo" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJNMTYgN1Y0QTEgMSAwIDAgMCAxNSAzSDVBMSAxIDAgMCAwIDQgNFYyMEExIDEgMCAwIDAgNSAyMUgxNUExIDEgMCAwIDAgMTYgMjBWMTdNMTIgOUg4TTE2IDEzSDhNMTYgMTdIMDBNMTkgMTdIMjJNMTUgMTdIMTguNVYyMC41TTE1IDE3TDE4IDE0Ii8+Cjwvc3ZnPgo8L3N2Zz4='">
                        <h1 class="auth-title">Request Account</h1>
                        <p class="auth-subtitle">Fill in your details for admin approval</p>
                    </div>

                    <form id="requestAccountForm" class="auth-form" novalidate>
                        <div id="requestAccountAlertContainer"></div>
                        
                        <div class="form-group">
                            <label for="fullName" class="form-label">Full Name</label>
                            <input 
                                type="text" 
                                id="fullName" 
                                class="form-input" 
                                placeholder="Enter your full name"
                                required
                                autocomplete="name"
                            >
                            <div class="error-message" id="nameError" style="display: none; color: #e53e3e; font-size: 12px; margin-top: 4px;"></div>
                        </div>

                        <div class="form-group">
                            <label for="requestEmail" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="requestEmail" 
                                class="form-input" 
                                placeholder="Enter your email address"
                                required
                                autocomplete="email"
                            >
                            <div class="error-message" id="emailError" style="display: none; color: #e53e3e; font-size: 12px; margin-top: 4px;"></div>
                        </div>

                        <div class="form-group">
                            <label for="phoneNumber" class="form-label">Phone Number</label>
                            <input 
                                type="tel" 
                                id="phoneNumber" 
                                class="form-input" 
                                placeholder="+233 XX XXX XXXX or 023 XXX XXXX"
                                required
                                autocomplete="tel"
                            >
                            <div class="error-message" id="phoneError" style="display: none; color: #e53e3e; font-size: 12px; margin-top: 4px;"></div>
                        </div>

                        <div class="form-group">
                            <label for="company" class="form-label">Company/Organization</label>
                            <input 
                                type="text" 
                                id="company" 
                                class="form-input" 
                                placeholder="Enter your company or organization name"
                                autocomplete="organization"
                            >
                            <div class="error-message" id="companyError" style="display: none; color: #e53e3e; font-size: 12px; margin-top: 4px;"></div>
                        </div>

                        <div class="form-group">
                            <label for="role" class="form-label">Requested Role</label>
                            <select id="role" class="form-select" required>
                                <option value="">Select a role</option>
                                <option value="technician">Technician</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="admin">Administrator</option>
                            </select>
                            <div class="error-message" id="roleError" style="display: none; color: #e53e3e; font-size: 12px; margin-top: 4px;"></div>
                        </div>

                        <div class="form-group">
                            <label for="justification" class="form-label">Justification / Proof of Need</label>
                            <textarea 
                                id="justification" 
                                class="form-textarea" 
                                placeholder="Explain why you need access to NetisTrackGh, your responsibilities, and any relevant experience..."
                                rows="4"
                                required
                            ></textarea>
                            <div class="error-message" id="justificationError" style="display: none; color: #e53e3e; font-size: 12px; margin-top: 4px;"></div>
                            <div style="font-size: 12px; color: #718096; margin-top: 4px;">
                                Please provide detailed information to help us process your request
                            </div>
                        </div>

                        <button type="submit" class="auth-button" id="requestButton">
                            Submit Request
                        </button>

                        <div class="auth-links">
                            <a href="#login" class="auth-link" id="backToLoginLink">← Back to Login</a>
                        </div>

                        <div style="text-align: center; margin-top: 20px; padding: 16px; background: #f7fafc; border-radius: 8px;">
                            <p style="font-size: 14px; color: #718096; margin: 0;">
                                <strong>Note:</strong> After submission, an admin will review your request and contact you via email with login credentials.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEvents() {
    console.log('Attaching request account events');
    
    const requestForm = document.getElementById('requestAccountForm');
    
    if (!requestForm) {
        console.error('❌ Request form not found');
        return;
    }

    // ⚠️ CRITICAL FIX: Replace form to clear all previous event listeners
    const newForm = requestForm.cloneNode(true);
    requestForm.parentNode.replaceChild(newForm, requestForm);
    
    // Now get the new form
    const form = document.getElementById('requestAccountForm');
    const requestButton = document.getElementById('requestButton');
    const backToLoginLink = document.getElementById('backToLoginLink');

    // SINGLE EVENT LISTENER PATTERN
    let isProcessing = false;
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        console.log('🖱️ Request form submit triggered at:', Date.now());
        
        if (isProcessing) {
            console.log('⏳ Already processing, skipping...');
            return;
        }
        
        isProcessing = true;
        
        try {
            await this.handleAccountRequest();
        } finally {
            // Reset after 3 seconds to prevent rapid submissions
            setTimeout(() => {
                isProcessing = false;
            }, 3000);
        }
    };
    
    form.addEventListener('submit', handleSubmit);

    if (backToLoginLink) {
        const newBackLink = backToLoginLink.cloneNode(true);
        backToLoginLink.parentNode.replaceChild(newBackLink, backToLoginLink);
        
        newBackLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToLogin();
        });
    }

    // Add real-time validation
    this.attachRealTimeValidation();
}

    attachRealTimeValidation() {
        const nameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('requestEmail');
        const phoneInput = document.getElementById('phoneNumber');
        const roleSelect = document.getElementById('role');
        const justificationInput = document.getElementById('justification');

        [nameInput, emailInput, phoneInput, roleSelect, justificationInput].forEach(input => {
            if (input) {
                input.addEventListener('blur', () => {
                    this.validateField(input.id);
                });
            }
        });

        // Phone number formatting
        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        }
    }

    validateField(fieldId) {
        switch (fieldId) {
            case 'fullName':
                return this.validateNameField();
            case 'requestEmail':
                return this.validateEmailField();
            case 'phoneNumber':
                return this.validatePhoneField();
            case 'role':
                return this.validateRoleField();
            case 'justification':
                return this.validateJustificationField();
            default:
                return true;
        }
    }

    validateNameField() {
        const nameInput = document.getElementById('fullName');
        const nameError = document.getElementById('nameError');
        
        if (!nameInput || !nameError) return true;

        const name = nameInput.value.trim();
        
        if (!name) {
            nameError.textContent = 'Full name is required';
            nameError.style.display = 'block';
            return false;
        }

        if (name.length < 2) {
            nameError.textContent = 'Name must be at least 2 characters';
            nameError.style.display = 'block';
            return false;
        }

        nameError.style.display = 'none';
        return true;
    }

    validateEmailField() {
        const emailInput = document.getElementById('requestEmail');
        const emailError = document.getElementById('emailError');
        
        if (!emailInput || !emailError) return true;

        const email = emailInput.value.trim();
        
        if (!email) {
            emailError.textContent = 'Email is required';
            emailError.style.display = 'block';
            return false;
        }

        if (!validateEmail(email)) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.style.display = 'block';
            return false;
        }

        emailError.style.display = 'none';
        return true;
    }

    validatePhoneField() {
        const phoneInput = document.getElementById('phoneNumber');
        const phoneError = document.getElementById('phoneError');
        
        if (!phoneInput || !phoneError) return true;

        const phone = phoneInput.value.trim();
        
        if (!phone) {
            phoneError.textContent = 'Phone number is required';
            phoneError.style.display = 'block';
            return false;
        }

        if (!validatePhone(phone)) {
            phoneError.textContent = 'Please enter a valid Ghanaian phone number';
            phoneError.style.display = 'block';
            return false;
        }

        phoneError.style.display = 'none';
        return true;
    }

    validateRoleField() {
        const roleSelect = document.getElementById('role');
        const roleError = document.getElementById('roleError');
        
        if (!roleSelect || !roleError) return true;

        const role = roleSelect.value;
        
        if (!role) {
            roleError.textContent = 'Please select a role';
            roleError.style.display = 'block';
            return false;
        }

        roleError.style.display = 'none';
        return true;
    }

    validateJustificationField() {
        const justificationInput = document.getElementById('justification');
        const justificationError = document.getElementById('justificationError');
        
        if (!justificationInput || !justificationError) return true;

        const justification = justificationInput.value.trim();
        
        if (!justification) {
            justificationError.textContent = 'Justification is required';
            justificationError.style.display = 'block';
            return false;
        }

        if (justification.length < 20) {
            justificationError.textContent = 'Please provide more detailed justification (at least 20 characters)';
            justificationError.style.display = 'block';
            return false;
        }

        justificationError.style.display = 'none';
        return true;
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.startsWith('0') && value.length <= 10) {
            // Format as 023 XXX XXXX
            if (value.length > 3) {
                value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
            } else if (value.length > 1) {
                value = value.replace(/(\d{3})(\d+)/, '$1 $2');
            }
        } else if (value.startsWith('233') && value.length <= 12) {
            // Format as +233 XX XXX XXXX
            value = '+233 ' + value.slice(3);
            if (value.length > 7) {
                value = value.replace(/(\+233 \d{2})(\d{3})(\d{4})/, '$1 $2 $3');
            }
        }
        
        input.value = value;
    }

    async handleAccountRequest() {
        console.log('Handling account request...', new Date().toISOString());
        
        // Prevent multiple submissions
        if (this.isSubmitting) {
            console.log('⏳ Request already being submitted, skipping...');
            return;
        }
        
        this.isSubmitting = true;

        if (!this.emailjsInitialized) {
            showAlert('Email service not ready. Please try again.', 'error');
            this.isSubmitting = false;
            return;
        }

        // Validate all fields
        const isNameValid = this.validateNameField();
        const isEmailValid = this.validateEmailField();
        const isPhoneValid = this.validatePhoneField();
        const isRoleValid = this.validateRoleField();
        const isJustificationValid = this.validateJustificationField();

        if (!isNameValid || !isEmailValid || !isPhoneValid || !isRoleValid || !isJustificationValid) {
            showAlert('Please fix all errors in the form', 'error');
            this.isSubmitting = false;
            return;
        }

        const formData = this.getFormData();
        const requestButton = document.getElementById('requestButton');

        try {
            setButtonLoading(requestButton, true, 'Submitting Request...');

            // Debug: Log submission attempt
            console.log('📧 Sending email via EmailJS...');

            // Send email via EmailJS
            const response = await this.sendAccountRequestEmail(formData);
            
            console.log('✅ Account request submitted successfully:', response);
            console.log('📧 EmailJS response:', response);
            
            showAlert('Account request submitted successfully! An admin will contact you soon.', 'success', 8000);
            
            // Clear form
            document.getElementById('requestAccountForm').reset();
            
            // Show confirmation message
            this.showConfirmationMessage(formData);

        } catch (error) {
            console.error('❌ Account request error:', error);
            this.handleAccountRequestError(error);
        } finally {
            setButtonLoading(requestButton, false);
            // Reset after delay to prevent rapid re-submissions
            setTimeout(() => {
                this.isSubmitting = false;
            }, 2000);
        }
    }

    async getFormData() {
        const phone = document.getElementById('phoneNumber').value.trim();
        
        return {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('requestEmail').value.trim(),
            phoneNumber: phone,
            formattedPhone: this.formatPhoneForDisplay(phone),
            company: document.getElementById('company')?.value.trim(),
            role: document.getElementById('role').value,
            roleDisplay: document.getElementById('role').options[document.getElementById('role').selectedIndex].text,
            justification: document.getElementById('justification').value.trim(),
            timestamp: new Date().toLocaleString('en-GH', {
                timeZone: 'Africa/Accra',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }),
            ipAddress: await this.getClientIP() || 'Not captured'
        };
    }

    formatPhoneForDisplay(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('233') && cleaned.length === 12) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
        } else if (cleaned.startsWith('0') && cleaned.length === 10) {
            return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        }
        
        return phone;
    }

    async sendAccountRequestEmail(formData) {
        const templateParams = {
            to_name: 'NetisTrackGh Admin',
            from_name: formData.fullName,
            from_email: formData.email,
            phone_number: formData.formattedPhone,
            requested_role: formData.roleDisplay,
            justification: formData.justification,
            timestamp: formData.timestamp,
            company_name: formData.company || 'Individual', // Add this field if available
            user_agent: navigator.userAgent.substring(0, 100), // Truncate for email
            app_name: 'NetisTrackGh Web Portal',
            ip_address: await this.getClientIP() || 'Not captured'
        };

        console.log('📤 Sending email with params:', templateParams);

        // Add timeout to prevent hanging requests
        const emailPromise = emailjs.send(
            'NetisTrackGh',
            'template_1o6p08r',
            templateParams
        );

        // Add timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Email sending timeout')), 10000);
        });

        return Promise.race([emailPromise, timeoutPromise]);
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'Not captured';
        }
    }

    showConfirmationMessage(formData) {
        const alertContainer = document.getElementById('requestAccountAlertContainer');
        if (!alertContainer) return;

        const infoAlert = document.createElement('div');
        infoAlert.className = 'alert alert-info';
        infoAlert.innerHTML = `
            <div style="font-size: 13px; line-height: 1.4;">
                <strong>Request Submitted Successfully!</strong><br>
                • We've sent your request to the admin team<br>
                • You'll receive an email at <strong>${formData.email}</strong><br>
                • Expected response time: 1-2 business days<br>
                • Check your spam folder if you don't see our email
            </div>
        `;

        // Remove any existing info alerts
        const existingInfoAlerts = alertContainer.querySelectorAll('.alert-info');
        existingInfoAlerts.forEach(alert => alert.remove());

        alertContainer.appendChild(infoAlert);
    }

    handleAccountRequestError(error) {
        console.error('EmailJS error details:', error);
        
        const errorMessages = {
            'INVALID_PUBLIC_KEY': 'Email service configuration error',
            'SERVICE_NOT_AVAILABLE': 'Email service temporarily unavailable',
            'TEMPLATE_NOT_FOUND': 'Email template not found',
            'NETWORK_ERROR': 'Network error. Please check your connection'
        };

        let message = 'Failed to submit request. Please try again.';
        
        if (error.text) {
            try {
                const errorObj = JSON.parse(error.text);
                message = errorMessages[errorObj.error] || message;
            } catch (e) {
                // If we can't parse the error, use generic message
            }
        }

        showAlert(message, 'error');
    }

    navigateToLogin() {
        console.log('Navigating to login');
        window.location.hash = 'login';
    }

    destroy() {
        console.log('RequestAccount component destroyed');
        this.detachEvents();
        this.isSubmitting = false;
    }
}