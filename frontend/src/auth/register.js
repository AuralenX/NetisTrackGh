import { showAlert, validateEmail, validatePhone } from '../utils/helpers.js';

export class RequestAccount {
    constructor() {
        this.emailjsLoaded = false;
        this.init();
    }

    async init() {
        await this.loadEmailJS();
        this.render();
        this.attachEvents();
    }

    async loadEmailJS() {
        return new Promise((resolve, reject) => {
            if (typeof emailjs !== 'undefined') {
                this.emailjsLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
            script.onload = () => {
                // Initialize EmailJS with your public key
                emailjs.init('4_lUB6bKxfFV5xsno'); 
                this.emailjsLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    render() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="/icons/logo.png" alt="NetisTrackGh" class="auth-logo">
                        <h1 class="auth-title">Request Account</h1>
                        <p class="auth-subtitle">Fill in your details for admin approval</p>
                    </div>

                    <form id="requestAccountForm" class="auth-form">
                        <div id="alertContainer"></div>
                        
                        <div class="form-group">
                            <label for="fullName" class="form-label">Full Name *</label>
                            <input 
                                type="text" 
                                id="fullName" 
                                class="form-input" 
                                placeholder="Enter your full name"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="requestEmail" class="form-label">Email Address *</label>
                            <input 
                                type="email" 
                                id="requestEmail" 
                                class="form-input" 
                                placeholder="Enter your email"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="phoneNumber" class="form-label">Phone Number *</label>
                            <input 
                                type="tel" 
                                id="phoneNumber" 
                                class="form-input" 
                                placeholder="+233 XX XXX XXXX"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="role" class="form-label">Requested Role *</label>
                            <select id="role" class="form-select" required>
                                <option value="">Select a role</option>
                                <option value="technician">Technician</option>
                                <option value="supervisor">Supervisor</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="justification" class="form-label">Justification / Proof of Need *</label>
                            <textarea 
                                id="justification" 
                                class="form-input" 
                                placeholder="Explain why you need access and provide any relevant information..."
                                rows="4"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" class="auth-button" id="requestButton">
                            Submit Request
                        </button>

                        <div class="auth-links">
                            <a href="#login" class="auth-link">Back to Login</a>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const requestForm = document.getElementById('requestAccountForm');
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAccountRequest();
        });

        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#login') {
                this.navigateToLogin();
            }
        });
    }

    async handleAccountRequest() {
        if (!this.emailjsLoaded) {
            showAlert('Email service not loaded. Please refresh the page.', 'error');
            return;
        }

        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        try {
            const requestButton = document.getElementById('requestButton');
            requestButton.innerHTML = '<div class="loading"></div> Submitting...';
            requestButton.disabled = true;

            // Send email via EmailJS
            await this.sendAccountRequestEmail(formData);
            
            showAlert('Account request submitted successfully! Admin will contact you soon.', 'success');
            document.getElementById('requestAccountForm').reset();

        } catch (error) {
            console.error('Account request error:', error);
            showAlert('Failed to submit request. Please try again later.', 'error');
        } finally {
            const requestButton = document.getElementById('requestButton');
            requestButton.innerHTML = 'Submit Request';
            requestButton.disabled = false;
        }
    }

    getFormData() {
        return {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('requestEmail').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            role: document.getElementById('role').value,
            justification: document.getElementById('justification').value.trim(),
            timestamp: new Date().toLocaleString('en-GB', { 
                timeZone: 'Africa/Accra',
                dateStyle: 'full',
                timeStyle: 'medium'
            })
        };
    }

    validateForm(data) {
        if (!data.fullName || data.fullName.length < 2) {
            showAlert('Please enter your full name', 'error');
            return false;
        }

        if (!validateEmail(data.email)) {
            showAlert('Please enter a valid email address', 'error');
            return false;
        }

        if (!validatePhone(data.phoneNumber)) {
            showAlert('Please enter a valid Ghanaian phone number', 'error');
            return false;
        }

        if (!data.role) {
            showAlert('Please select a role', 'error');
            return false;
        }

        if (!data.justification || data.justification.length < 10) {
            showAlert('Please provide a detailed justification (at least 10 characters)', 'error');
            return false;
        }

        return true;
    }

    async sendAccountRequestEmail(formData) {
        const templateParams = {
            to_name: 'Admin',
            from_name: formData.fullName,
            from_email: formData.email,
            phone_number: formData.phoneNumber,
            requested_role: formData.role,
            justification: formData.justification,
            timestamp: formData.timestamp,
            subject: `New Account Request - ${formData.fullName}`
        };

        // Send email using EmailJS
        return await emailjs.send(
            'NetisTrackGh',    
            'template_1o6p08r',  
            templateParams
        );
    }

    navigateToLogin() {
        window.dispatchEvent(new CustomEvent('routeChange', {
            detail: { route: 'login' }
        }));
    }
}