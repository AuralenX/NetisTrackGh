// frontend/src/pages/AboutPage.js
import { Layout } from '../components/Layout.js';

class AboutPage {
    constructor() {
        this.layout = new Layout({ currentPage: 'about' });
    }
    async init() { return this; }

    render() {
        const pageContent = `
            <div class="about-page">
                <div class="page-header">
                    <h1><i class="fas fa-info-circle"></i> About NetisTrackGh</h1>
                </div>

                <div class="about-content">
                    <p>NetisTrackGh is a lightweight operations tracking app for field technicians.
                    This demo includes fuel and maintenance logging, site management, and offline sync features.</p>

                    <h3>Version</h3>
                    <p>1.0.0</p>

                    <h3>Contributors</h3>
                    <p>AuralenX and contributors.</p>
                </div>
            </div>
        `;

        return this.layout.render(pageContent);
    }

    attachEvents() {
        this.layout.attachEvents();
    }
}

export default AboutPage;
