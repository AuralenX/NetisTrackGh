export class FuelGauge {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        this.options = {
            level: 0,
            size: 200,
            showLabel: true,
            showPercentage: true,
            showWarning: true,
            warningThreshold: 25,
            criticalThreshold: 10,
            animated: true,
            animationDuration: 1000,
            ...options
        };

        this.level = this.options.level;
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.currentLevel = 0;
        this.init();
    }

    init() {
        if (!this.container) {
            console.error('❌ FuelGauge: Container not found');
            return;
        }

        this.createGauge();
        this.render();
    }

    createGauge() {
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.size;
        this.canvas.height = this.options.size;
        this.canvas.className = 'fuel-gauge-canvas';
        
        // Create label container
        const labelContainer = document.createElement('div');
        labelContainer.className = 'fuel-gauge-label';
        
        // Create percentage display
        const percentageDisplay = document.createElement('div');
        percentageDisplay.className = 'fuel-gauge-percentage';
        percentageDisplay.textContent = `${Math.round(this.level)}%`;
        
        // Create status text
        const statusDisplay = document.createElement('div');
        statusDisplay.className = 'fuel-gauge-status';
        statusDisplay.textContent = this.getStatusText(this.level);

        // Assemble the gauge
        labelContainer.appendChild(percentageDisplay);
        labelContainer.appendChild(statusDisplay);
        
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        this.container.appendChild(labelContainer);
        
        this.ctx = this.canvas.getContext('2d');
        this.percentageDisplay = percentageDisplay;
        this.statusDisplay = statusDisplay;
    }

    getStatusText(level) {
        if (level <= this.options.criticalThreshold) {
            return 'CRITICAL';
        } else if (level <= this.options.warningThreshold) {
            return 'LOW';
        } else if (level <= 50) {
            return 'MEDIUM';
        } else {
            return 'GOOD';
        }
    }

    getColor(level) {
        if (level <= this.options.criticalThreshold) {
            return '#e53e3e'; // Red
        } else if (level <= this.options.warningThreshold) {
            return '#ed8936'; // Orange
        } else if (level <= 50) {
            return '#ecc94b'; // Yellow
        } else {
            return '#38a169'; // Green
        }
    }

    drawGauge(level) {
        const ctx = this.ctx;
        const size = this.options.size;
        const center = size / 2;
        const radius = size * 0.4;
        const lineWidth = size * 0.1;
        
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Draw background circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f7fafc';
        ctx.fill();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
        
        // Draw gauge arc
        const startAngle = Math.PI * 1.25; // Start at 225 degrees
        const endAngle = startAngle + (Math.PI * 1.5 * (level / 100)); // 270 degrees total
        
        ctx.beginPath();
        ctx.arc(center, center, radius, startAngle, endAngle);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = this.getColor(level);
        ctx.stroke();
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(center, center, radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        // Draw inner border
        ctx.beginPath();
        ctx.arc(center, center, radius * 0.3, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();
        
        // Draw level indicator
        const indicatorRadius = radius * 0.15;
        const indicatorAngle = endAngle;
        const indicatorX = center + (radius * 0.7) * Math.cos(indicatorAngle);
        const indicatorY = center + (radius * 0.7) * Math.sin(indicatorAngle);
        
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.getColor(level);
        ctx.fill();
        
        // Draw indicator border
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
    }

    animateToLevel(targetLevel) {
        if (!this.options.animated) {
            this.currentLevel = targetLevel;
            this.drawGauge(targetLevel);
            this.updateLabels(targetLevel);
            return;
        }

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const startLevel = this.currentLevel;
        const startTime = performance.now();
        const duration = this.options.animationDuration;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            this.currentLevel = startLevel + (targetLevel - startLevel) * easeOutQuart;
            
            this.drawGauge(this.currentLevel);
            this.updateLabels(this.currentLevel);
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
            }
        };

        this.animationId = requestAnimationFrame(animate);
    }

    updateLabels(level) {
        if (this.percentageDisplay) {
            this.percentageDisplay.textContent = `${Math.round(level)}%`;
        }
        
        if (this.statusDisplay) {
            this.statusDisplay.textContent = this.getStatusText(level);
            this.statusDisplay.style.color = this.getColor(level);
        }
    }

    setLevel(level) {
        const newLevel = Math.max(0, Math.min(100, level));
        this.level = newLevel;
        this.animateToLevel(newLevel);
    }

    getLevel() {
        return this.level;
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.createGauge();
        this.render();
    }

    render() {
        this.animateToLevel(this.level);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// CSS Styles for Fuel Gauge
export const fuelGaugeStyles = `
.fuel-gauge-container {
    display: inline-block;
    position: relative;
    text-align: center;
}

.fuel-gauge-canvas {
    display: block;
    margin: 0 auto;
}

.fuel-gauge-label {
    margin-top: 10px;
}

.fuel-gauge-percentage {
    font-size: 24px;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 4px;
}

.fuel-gauge-status {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.fuel-gauge-mini {
    width: 60px;
    height: 20px;
    background: #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.fuel-gauge-mini .fuel-bar {
    height: 100%;
    background: #38a169;
    transition: width 0.3s ease;
    border-radius: 10px;
}

.fuel-gauge-mini .fuel-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
}
`;