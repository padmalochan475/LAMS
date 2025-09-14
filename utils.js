// Utility functions for LAMS
class CustomModal {
    static show(title, message, type = 'info', buttons = []) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'custom-modal-overlay';
            
            const typeIcons = {
                info: 'ℹ️',
                warning: '⚠️',
                error: '❌',
                success: '✅',
                confirm: '❓'
            };
            
            modal.innerHTML = `
                <div class="custom-modal">
                    <div class="custom-modal-header">
                        <span class="custom-modal-icon">${typeIcons[type] || 'ℹ️'}</span>
                        <h3>${this.escapeHtml(title)}</h3>
                    </div>
                    <div class="custom-modal-body">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    <div class="custom-modal-actions">
                        ${buttons.length === 0 ? 
                            '<button class="btn btn--primary" data-result="ok">OK</button>' :
                            buttons.map(btn => 
                                `<button class="btn ${btn.primary ? 'btn--primary' : 'btn--secondary'}" data-result="${btn.value}">${this.escapeHtml(btn.text)}</button>`
                            ).join('')
                        }
                    </div>
                </div>
            `;
            
            modal.addEventListener('click', (e) => {
                if (e.target.hasAttribute('data-result')) {
                    const result = e.target.getAttribute('data-result');
                    modal.remove();
                    resolve(result);
                } else if (e.target === modal) {
                    modal.remove();
                    resolve('cancel');
                }
            });
            
            document.body.appendChild(modal);
            setTimeout(() => modal.classList.add('show'), 10);
        });
    }
    
    static alert(message, title = 'Alert') {
        return this.show(title, message, 'info');
    }
    
    static confirm(message, title = 'Confirm') {
        return this.show(title, message, 'confirm', [
            { text: 'Cancel', value: 'cancel' },
            { text: 'OK', value: 'ok', primary: true }
        ]).then(result => result === 'ok');
    }
    
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// CSRF Token utility
class CSRFProtection {
    static token = null;
    
    static generateToken() {
        this.token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        return this.token;
    }
    
    static validateToken(token) {
        return token === this.token;
    }
    
    static addToRequest(requestData) {
        if (!this.token) this.generateToken();
        return {
            ...requestData,
            csrfToken: this.token
        };
    }
}

// Input sanitization
class InputSanitizer {
    static sanitizeHtml(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }
    
    static sanitizeForAttribute(input) {
        return input.replace(/['"<>&]/g, (match) => {
            const map = {
                '"': '&quot;',
                "'": '&#x27;',
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;'
            };
            return map[match];
        });
    }
    
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Performance utilities
class PerformanceUtils {
    static debounce(func, wait) {
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
    
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            updates.forEach(update => update());
        });
    }
}

// Export utilities
window.CustomModal = CustomModal;
window.CSRFProtection = CSRFProtection;
window.InputSanitizer = InputSanitizer;
window.PerformanceUtils = PerformanceUtils;