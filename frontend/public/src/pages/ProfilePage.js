// frontend/src/pages/ProfilePage.js
import { showAlert, formatDate } from '../utils/helpers.js';
import { authService } from '../services/authService.js';

class ProfilePage {
    constructor() {
        this.profile = authService.getUserProfile();
    }

    async init() { return this; }

    render() {
        const p = this.profile || {};
        return `
            <div class="profile-page">
                <div class="page-header">
                    <h1><i class="fas fa-user"></i> Profile</h1>
                </div>

                <div class="profile-card">
                    <div><strong>Name:</strong> ${p.firstName || ''} ${p.lastName || ''}</div>
                    <div><strong>Email:</strong> ${p.email || 'N/A'}</div>
                    <div><strong>Role:</strong> ${p.role || 'User'}</div>
                    <div><strong>Member since:</strong> ${p.createdAt ? formatDate(p.createdAt) : 'N/A'}</div>
                    <div class="profile-actions">
                        <button class="btn btn-primary" id="editProfileBtn">Edit Profile</button>
                        <button class="btn btn-secondary" id="changePasswordBtn">Change Password</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const edit = document.getElementById('editProfileBtn');
        if (edit) edit.addEventListener('click', () => showAlert('Edit profile coming soon', 'info'));
        const pw = document.getElementById('changePasswordBtn');
        if (pw) pw.addEventListener('click', () => window.location.hash = 'password-reset');
    }
}

export default ProfilePage;
