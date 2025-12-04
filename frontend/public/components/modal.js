export class Modal {
    constructor(options = {}) {
        this.options = {
            id: `modal-${Date.now()}`,
            title: '',
            content: '',
            size: 'md', // sm, md, lg, xl
            showClose: true,
            backdrop: true,
            closeOnEscape: true,
            closeOnBackdrop: true,
            onClose: null,
            onConfirm: null,
            confirmText: 'Confirm',
            cancelText: 'Cancel',
            showConfirm: true,
            showCancel: true,
            confirmButtonClass: 'btn-primary',
            cancelButtonClass: 'btn-secondary',
            ...options
        };

        this.isOpen = false;
        this.element = null;
        this.eventHandlers = {};
    }

    render() {
        return `
            <div class="modal" id="${this.options.id}">
                ${this.options.backdrop ? '<div class="modal-backdrop"></div>' : ''}
                
                <div class="modal-dialog modal-${this.options.size}">
                    <div class="modal-content">
                        <!-- Modal Header -->
                        <div class="modal-header">
                            <h3 class="modal-title">${this.options.title}</h3>
                            ${this.options.showClose ? `
                            <button type="button" class="modal-close" aria-label="Close">
                                <i class="fas fa-times"></i>
                            </button>
                            ` : ''}
                        </div>

                        <!-- Modal Body -->
                        <div class="modal-body">
                            ${this.options.content}
                        </div>

                        <!-- Modal Footer -->
                        ${this.options.showConfirm || this.options.showCancel ? `
                        <div class="modal-footer">
                            ${this.options.showCancel ? `
                            <button type="button" class="btn ${this.options.cancelButtonClass} modal-cancel">
                                ${this.options.cancelText}
                            </button>
                            ` : ''}
                            
                            ${this.options.showConfirm ? `
                            <button type="button" class="btn ${this.options.confirmButtonClass} modal-confirm">
                                ${this.options.confirmText}
                            </button>
                            ` : ''}
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    open() {
        if (this.isOpen) return;

        // Create modal element
        this.element = document.createElement('div');
        this.element.innerHTML = this.render();
        document.body.appendChild(this.element);

        const modal = this.element.querySelector('.modal');
        
        // Add show class after a small delay for animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);

        this.attachEvents();
        this.isOpen = true;
        
        // Focus on first input if present
        setTimeout(() => {
            const firstInput = modal.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    close() {
        if (!this.isOpen || !this.element) return;

        const modal = this.element.querySelector('.modal');
        modal.classList.remove('show');

        // Wait for animation to complete
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            this.element = null;
            this.isOpen = false;
            
            if (typeof this.options.onClose === 'function') {
                this.options.onClose();
            }
        }, 300);

        this.removeEvents();
    }

    attachEvents() {
        if (!this.element) return;

        // Close button
        const closeBtn = this.element.querySelector('.modal-close');
        if (closeBtn) {
            this.eventHandlers.closeClick = () => this.close();
            closeBtn.addEventListener('click', this.eventHandlers.closeClick);
        }

        // Cancel button
        const cancelBtn = this.element.querySelector('.modal-cancel');
        if (cancelBtn) {
            this.eventHandlers.cancelClick = () => this.close();
            cancelBtn.addEventListener('click', this.eventHandlers.cancelClick);
        }

        // Confirm button
        const confirmBtn = this.element.querySelector('.modal-confirm');
        if (confirmBtn) {
            this.eventHandlers.confirmClick = () => {
                if (typeof this.options.onConfirm === 'function') {
                    this.options.onConfirm();
                }
                this.close();
            };
            confirmBtn.addEventListener('click', this.eventHandlers.confirmClick);
        }

        // Backdrop click
        if (this.options.closeOnBackdrop) {
            const backdrop = this.element.querySelector('.modal-backdrop');
            if (backdrop) {
                this.eventHandlers.backdropClick = () => this.close();
                backdrop.addEventListener('click', this.eventHandlers.backdropClick);
            }
        }

        // Escape key
        if (this.options.closeOnEscape) {
            this.eventHandlers.escapeKey = (e) => {
                if (e.key === 'Escape') this.close();
            };
            document.addEventListener('keydown', this.eventHandlers.escapeKey);
        }
    }

    removeEvents() {
        Object.values(this.eventHandlers).forEach((handler, index) => {
            if (index === 'escapeKey') {
                document.removeEventListener('keydown', handler);
            }
        });
        this.eventHandlers = {};
    }

    updateContent(newContent) {
        if (!this.element || !this.isOpen) return;
        
        const modalBody = this.element.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = newContent;
        }
    }

    setLoading(isLoading, text = 'Loading...') {
        if (!this.element || !this.isOpen) return;
        
        const confirmBtn = this.element.querySelector('.modal-confirm');
        if (confirmBtn) {
            if (isLoading) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i> ${text}
                `;
            } else {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = this.options.confirmText;
            }
        }
    }

    destroy() {
        if (this.isOpen) this.close();
        this.removeEvents();
    }
}

// CSS for modal
export const modalStyles = `
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1050;
    display: none;
    overflow-x: hidden;
    overflow-y: auto;
    outline: 0;
}

.modal.show {
    display: block;
}

.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
}

.modal-dialog {
    position: relative;
    width: auto;
    margin: 1.75rem auto;
    pointer-events: none;
    z-index: 1050;
}

.modal.show .modal-dialog {
    transform: none;
}

.modal-dialog.modal-sm {
    max-width: 400px;
}

.modal-dialog.modal-md {
    max-width: 600px;
}

.modal-dialog.modal-lg {
    max-width: 800px;
}

.modal-dialog.modal-xl {
    max-width: 1140px;
}

.modal-content {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    pointer-events: auto;
    background-color: white;
    background-clip: padding-box;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    outline: 0;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #e2e8f0;
}

.modal-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #2d3748;
}

.modal-close {
    padding: 0.5rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #718096;
    cursor: pointer;
    transition: color 0.3s ease;
}

.modal-close:hover {
    color: #e53e3e;
}

.modal-body {
    position: relative;
    flex: 1 1 auto;
    padding: 1.5rem;
    max-height: 60vh;
    overflow-y: auto;
}

.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    gap: 0.75rem;
}

.modal-footer .btn {
    padding: 0.625rem 1.25rem;
    font-weight: 500;
}

/* Form styles for modals */
.modal-form-group {
    margin-bottom: 1.25rem;
}

.modal-form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4a5568;
}

.modal-form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.modal-form-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-form-select {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    background-color: white;
}

.modal-form-textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    min-height: 120px;
    resize: vertical;
}

.modal-form-helper {
    font-size: 0.875rem;
    color: #718096;
    margin-top: 0.375rem;
}

.modal-form-error {
    color: #e53e3e;
    font-size: 0.875rem;
    margin-top: 0.375rem;
}

.modal-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
}

@media (max-width: 768px) {
    .modal-form-row {
        grid-template-columns: 1fr;
    }
    
    .modal-dialog {
        margin: 0.5rem;
    }
    
    .modal-content {
        border-radius: 8px;
    }
}
`;