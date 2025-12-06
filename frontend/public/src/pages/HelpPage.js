// frontend/src/pages/HelpPage.js
import { showAlert } from '../utils/helpers.js';

class HelpPage {
    constructor() {}
    async init() { return this; }

    render() {
        return `
            <div class="help-page">
                <div class="page-header">
                    <h1><i class="fas fa-question-circle"></i> Help & Support</h1>
                </div>

                <section class="faq">
                    <h3>Frequently Asked Questions</h3>
                    <ul>
                        <li><strong>How do I add a site?</strong> — Go to Sites and click "Add New Site".</li>
                        <li><strong>How do I log fuel?</strong> — Open Fuel and click "Add Fuel Log".</li>
                        <li><strong>How do I report an issue?</strong> — Contact your supervisor or use the contact option on Sites.</li>
                    </ul>
                </section>

                <section class="support">
                    <h3>Contact Support</h3>
                    <p>If you need help, please email <a href="mailto:support@netistrackgh.local">support@netistrackgh.local</a> or contact your administrator.</p>
                    <button class="btn btn-primary" id="contactSupportBtn">Contact Support</button>
                </section>
            </div>
        `;
    }

    attachEvents() {
        const btn = document.getElementById('contactSupportBtn');
        if (btn) btn.addEventListener('click', () => showAlert('Opening support email...', 'info'));
    }
}

export default HelpPage;
