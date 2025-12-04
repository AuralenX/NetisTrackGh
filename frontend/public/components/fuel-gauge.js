export class FuelGauge {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        this.options = {
            level: 50,
            size: 120,
            showLabel: true,
            showValue: true,
            animated: true,
            animationDuration: 1000,
            theme: 'default',
            ...options
        };

        this.level = this.options.level;
        this.currentLevel = 0;
        this.animationId = null;
        this.element = null;
        
        if (this.container) {
            this.init();
        }
    }

    init() {
        this.createGauge();
        this.render();
    }

    createGauge() {
        const gaugeId = `fuel-gauge-${Math.random().toString(36).substr(2, 9)}`;
        
        const gaugeHTML = `
            <div class="fuel-gauge-component" id="${gaugeId}">
                <div class="gauge-container">
                    <div class="gauge-background"></div>
                    <div class="gauge-fill" id="${gaugeId}-fill"></div>
                    <div class="gauge-center">
                        ${this.options.showValue ? `
                        <div class="gauge-value" id="${gaugeId}-value">${this.level}%</div>
                        ` : ''}
                        ${this.options.showLabel ? `
                        <div class="gauge-label" id="${gaugeId}-label">${this.getFuelStatus(this.level)}</div>
                        ` : ''}
                    </div>
                </div>
                ${this.options.showLabel ? `
                <div class="gauge-legend">
                    <div class="legend-item low">
                        <span class="legend-color"></span>
                        <span class="legend-text">Low</span>
                    </div>
                    <div class="legend-item medium">
                        <span class="legend-color"></span>
                        <span class="legend-text">Medium</span>
                    </div>
                    <div class="legend-item good">
                        <span class="legend-color"></span>
                        <span class="legend-text">Good</span>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        this.container.innerHTML = gaugeHTML;
        this.element = document.getElementById(gaugeId);
        this.fillElement = document.getElementById(`${gaugeId}-fill`);
        this.valueElement = document.getElementById(`${gaugeId}-value`);
        this.labelElement = document.getElementById(`${gaugeId}-label`);
    }

    getFuelColor(level) {
        if (level <= 10) return '#e53e3e';
        if (level <= 25) return '#ed8936';
        if (level <= 50) return '#ecc94b';
        return '#38a169';
    }

    getFuelStatus(level) {
        if (level <= 10) return 'Critical';
        if (level <= 25) return 'Low';
        if (level <= 50) return 'Medium';
        return 'Good';
    }

    animateToLevel(targetLevel) {
        if (!this.options.animated) {
            this.currentLevel = targetLevel;
            this.updateGauge();
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
            
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            this.currentLevel = startLevel + (targetLevel - startLevel) * easeOutCubic;
            
            this.updateGauge();
            
            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
            }
        };

        this.animationId = requestAnimationFrame(animate);
    }

    updateGauge() {
        if (!this.fillElement) return;

        const level = Math.max(0, Math.min(100, this.currentLevel));
        const rotation = (level / 100) * 180; // 0-180 degrees
        
        this.fillElement.style.transform = `rotate(${rotation}deg)`;
        this.fillElement.style.backgroundColor = this.getFuelColor(level);

        if (this.valueElement) {
            this.valueElement.textContent = `${Math.round(level)}%`;
        }

        if (this.labelElement) {
            this.labelElement.textContent = this.getFuelStatus(level);
            this.labelElement.style.color = this.getFuelColor(level);
        }
    }

    setLevel(level, animate = true) {
        const newLevel = Math.max(0, Math.min(100, level));
        this.level = newLevel;
        
        if (animate) {
            this.animateToLevel(newLevel);
        } else {
            this.currentLevel = newLevel;
            this.updateGauge();
        }
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
        }
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.element = null;
        this.fillElement = null;
        this.valueElement = null;
        this.labelElement = null;
    }
}

// CSS Styles for Fuel Gauge
export const fuelGaugeStyles = `
.fuel-gauge-component {
    display: inline-block;
    text-align: center;
    font-family: inherit;
}

.gauge-container {
    position: relative;
    width: var(--gauge-size, 120px);
    height: calc(var(--gauge-size, 120px) / 2);
    overflow: hidden;
    margin: 0 auto;
}

.gauge-background {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #e2e8f0;
    border-radius: calc(var(--gauge-size, 120px) / 2) calc(var(--gauge-size, 120px) / 2) 0 0;
    overflow: hidden;
}

.gauge-fill {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #38a169;
    border-radius: calc(var(--gauge-size, 120px) / 2) calc(var(--gauge-size, 120px) / 2) 0 0;
    transform-origin: center bottom;
    transform: rotate(0deg);
    transition: transform 0.5s ease, background-color 0.5s ease;
}

.gauge-center {
    position: absolute;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    z-index: 2;
}

.gauge-value {
    font-size: 24px;
    font-weight: 700;
    color: #2d3748;
    line-height: 1;
    margin-bottom: 4px;
}

.gauge-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #38a169;
}

.gauge-legend {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
    font-size: 11px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #718096;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    display: inline-block;
}

.legend-item.low .legend-color {
    background: #e53e3e;
}

.legend-item.medium .legend-color {
    background: #ecc94b;
}

.legend-item.good .legend-color {
    background: #38a169;
}

/* Mini version for cards */
.fuel-gauge-mini {
    width: 80px;
    height: 20px;
    background: #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.fuel-gauge-mini .fuel-fill {
    height: 100%;
    border-radius: 10px;
    transition: width 0.3s ease;
}

.fuel-gauge-mini .fuel-percentage {
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