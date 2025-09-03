// Enhanced Security Manager for LAMS
class EnhancedSecurityManager {
    constructor() {
        this.securityKey = this.generateSecurityKey();
        this.initSecurityChecks();
    }

    generateSecurityKey() {
        const factors = [
            window.location.hostname,
            navigator.userAgent.substring(0, 20),
            document.title,
            new Date().getFullYear().toString()
        ];
        return this.hash(factors.join('|'));
    }

    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    initSecurityChecks() {
        // Anti-debugging protection
        this.preventDebugging();
        
        // Console warning
        this.showConsoleWarning();
        
        // Right-click protection
        this.preventRightClick();
        
        // DevTools detection
        this.detectDevTools();
        
        // Source code protection
        this.obfuscateSource();
    }

    preventDebugging() {
        setInterval(() => {
            const start = performance.now();
            debugger;
            const end = performance.now();
            if (end - start > 100) {
                this.handleSecurityViolation('Debugging detected');
            }
        }, 1000);
    }

    showConsoleWarning() {
        console.clear();
        console.log('%c⚠️ SECURITY WARNING ⚠️', 'color: red; font-size: 20px; font-weight: bold;');
        console.log('%cThis is a secure application. Unauthorized access is prohibited.', 'color: red; font-size: 14px;');
        console.log('%cAny attempt to modify or extract code may be logged and reported.', 'color: red; font-size: 14px;');
        console.log('%c© Institute Lab Management System - All Rights Reserved', 'color: blue; font-size: 12px;');
    }

    preventRightClick() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showSecurityAlert('Right-click disabled for security');
            return false;
        });

        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        });

        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
    }

    detectDevTools() {
        let devtools = {
            open: false,
            orientation: null
        };

        const threshold = 160;

        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                if (!devtools.open) {
                    devtools.open = true;
                    this.handleSecurityViolation('Developer tools detected');
                }
            } else {
                devtools.open = false;
            }
        }, 500);
    }

    obfuscateSource() {
        // Hide source in view-source
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow, noarchive, nosnippet, noimageindex';
        document.head.appendChild(meta);

        // Disable F12, Ctrl+Shift+I, Ctrl+U
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C')) {
                e.preventDefault();
                this.showSecurityAlert('Keyboard shortcut disabled for security');
                return false;
            }
        });
    }

    handleSecurityViolation(reason) {
        console.clear();
        console.log('%c🚨 SECURITY VIOLATION DETECTED 🚨', 'color: red; font-size: 24px; font-weight: bold;');
        console.log(`%cReason: ${reason}`, 'color: red; font-size: 16px;');
        console.log('%cAccess may be terminated.', 'color: red; font-size: 14px;');
        
        // Log violation (in production, send to server)
        this.logSecurityEvent(reason);
    }

    showSecurityAlert(message) {
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px;
            border-radius: 5px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        alert.textContent = `🔒 ${message}`;
        document.body.appendChild(alert);
        
        setTimeout(() => alert.remove(), 3000);
    }

    logSecurityEvent(event) {
        const logData = {
            timestamp: new Date().toISOString(),
            event: event,
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            sessionId: this.securityKey
        };
        
        // Store locally (in production, send to server)
        const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        logs.push(logData);
        localStorage.setItem('security_logs', JSON.stringify(logs.slice(-50))); // Keep last 50 logs
    }

    // Encrypt sensitive data
    encryptData(data) {
        const key = this.securityKey;
        let encrypted = '';
        for (let i = 0; i < data.length; i++) {
            encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return btoa(encrypted);
    }

    // Decrypt sensitive data
    decryptData(encryptedData) {
        const key = this.securityKey;
        const data = atob(encryptedData);
        let decrypted = '';
        for (let i = 0; i < data.length; i++) {
            decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return decrypted;
    }

    // Validate session integrity
    validateSession() {
        const sessionData = localStorage.getItem('lams_session');
        if (sessionData) {
            try {
                const session = JSON.parse(this.decryptData(sessionData));
                const now = Date.now();
                if (now - session.created > CONFIG.SECURITY.SESSION_TIMEOUT) {
                    this.clearSession();
                    return false;
                }
                return true;
            } catch (e) {
                this.clearSession();
                return false;
            }
        }
        return false;
    }

    createSession(userData) {
        const sessionData = {
            user: userData,
            created: Date.now(),
            key: this.securityKey
        };
        const encrypted = this.encryptData(JSON.stringify(sessionData));
        localStorage.setItem('lams_session', encrypted);
    }

    clearSession() {
        localStorage.removeItem('lams_session');
        localStorage.removeItem('lams_user_data');
    }

    // Anti-tampering for critical functions
    protectFunction(fn, name) {
        const originalFn = fn.toString();
        return function(...args) {
            if (fn.toString() !== originalFn) {
                console.error(`🚨 Function ${name} has been tampered with!`);
                return null;
            }
            return fn.apply(this, args);
        };
    }

    // Watermark the application
    addWatermark() {
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            font-size: 10px;
            color: rgba(0,0,0,0.1);
            pointer-events: none;
            z-index: 1000;
            user-select: none;
        `;
        watermark.textContent = `LAMS-${this.securityKey.substring(0, 8)}`;
        document.body.appendChild(watermark);
    }
}

// Initialize enhanced security
const enhancedSecurity = new EnhancedSecurityManager();

// Export for global use
window.enhancedSecurity = enhancedSecurity;

// Protect critical functions
if (window.dataManager) {
    window.dataManager.save = enhancedSecurity.protectFunction(window.dataManager.save, 'dataManager.save');
}

// Add watermark
document.addEventListener('DOMContentLoaded', () => {
    enhancedSecurity.addWatermark();
});