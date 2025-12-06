// frontend/src/pages/SettingsPage.js
import { showAlert } from '../utils/helpers.js';

class SettingsPage {
    constructor() {
        this.settings = {
            notifications: true,
            darkMode: false,
            autoSync: true
        };
    }

    async init() { return this; }

    render() {
        return `
            <div class="settings-page">
                <div class="page-header">
                    <h1><i class="fas fa-cog"></i> Settings</h1>
                </div>

                <div class="settings-list">
                    <div class="setting-item">
                        <label><input type="checkbox" id="settingNotifications" ${this.settings.notifications ? 'checked' : ''}/> Enable Notifications</label>
                    </div>
                    <div class="setting-item">
                        <label><input type="checkbox" id="settingDarkMode" ${this.settings.darkMode ? 'checked' : ''}/> Dark Mode</label>
                    </div>
                    <div class="setting-item">
                        <label><input type="checkbox" id="settingAutoSync" ${this.settings.autoSync ? 'checked' : ''}/> Auto Sync</label>
                    </div>
                    <div style="margin-top:16px;">
                        <button class="btn btn-primary" id="saveSettingsBtn">Save Settings</button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const save = document.getElementById('saveSettingsBtn');
        if (save) save.addEventListener('click', () => this.saveSettings());
    }

    saveSettings() {
        this.settings.notifications = !!document.getElementById('settingNotifications')?.checked;
        this.settings.darkMode = !!document.getElementById('settingDarkMode')?.checked;
        this.settings.autoSync = !!document.getElementById('settingAutoSync')?.checked;
        showAlert('Settings saved locally', 'success');
    }
}

export default SettingsPage;
