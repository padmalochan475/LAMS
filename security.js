// Basic Security Utilities for Client-Side Application
class SecurityManager {
    constructor() {
        this.initSecurity();
    }

    initSecurity() {
        // Force HTTPS in production
        if (CONFIG.SECURITY?.HTTPS_ONLY && location.protocol !== 'https:' && location.hostname !== 'localhost') {
            location.replace(`https:${location.href.substring(location.protocol.length)}`);
        }

        // Disable right-click context menu (basic protection)
        if (!CONFIG.DEV_MODE) {
            document.addEventListener('contextmenu', e => e.preventDefault());
        }

        // Basic console warning
        this.showConsoleWarning();
    }

    showConsoleWarning() {
        console.log('%c⚠️ SECURITY WARNING', 'color: red; font-size: 20px; font-weight: bold;');
        console.log('%cThis is a client-side application. All code is visible.', 'color: orange; font-size: 14px;');
        console.log('%cDo not enter sensitive information.', 'color: orange; font-size: 14px;');
        console.log('%cFor production use, implement server-side authentication.', 'color: orange; font-size: 14px;');
    }

    // Basic data obfuscation (not real encryption)
    obfuscate(data) {
        if (!CONFIG.ENCRYPT_LOCAL_DATA) return data;
        return btoa(JSON.stringify(data));
    }

    deobfuscate(data) {
        if (!CONFIG.ENCRYPT_LOCAL_DATA) return data;
        try {
            return JSON.parse(atob(data));
        } catch {
            return data;
        }
    }

    // Validate session timeout
    isSessionValid(loginTime) {
        if (!loginTime) return false;
        const sessionAge = Date.now() - new Date(loginTime).getTime();
        return sessionAge < (CONFIG.SECURITY?.SESSION_TIMEOUT || 24 * 60 * 60 * 1000);
    }

    // Basic input sanitization
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '') // Remove basic HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .trim();
    }

    // Check if running on authorized domain
    isAuthorizedDomain() {
        const allowedDomains = [
            'localhost',
            '127.0.0.1',
            'github.io'
        ];
        
        return allowedDomains.some(domain => 
            location.hostname.includes(domain)
        );
    }
}

// Initialize security manager
const securityManager = new SecurityManager();

// Export for global use
window.securityManager = securityManager;