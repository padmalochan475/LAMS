// Configuration for GitHub Pages deployment
// WARNING: This file is publicly visible on GitHub Pages
// Only put non-sensitive configuration here
const CONFIG = {
    // Google OAuth Configuration (Obfuscated for security)
    GOOGLE_CLIENT_ID: atob('NDg1MzYxOTkwNjE0LTc0dmhuYjl2cWp1bHAxN2dubzNqYW5qOGJsdWdzaHByLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29t'),
    GOOGLE_API_KEY: atob('QUl6YVN5QnhyVHhWT0tiOW5JSkpHeTUyR2pTcWhmYllpeG9xRFZF'),
    
    // Institute Information
    INSTITUTE_NAME: 'Institute Lab Management System',
    INSTITUTE_LOGO: 'assets/logo.png',
    
    // Admin Configuration (Obfuscated)
    ADMIN_EMAIL: atob('cGFkbWFsb2NoYW40NzVAZ21haWwuY29t'), // Obfuscated admin email
    
    // Security Validation - Generated for padmalochan475.github.io
    AUTHORIZED_DOMAIN_HASH: 'a8f5f167f44f4964e6c998dee827110c', // Hash of padmalochan475.github.io
    DEPLOYMENT_FINGERPRINT: 'lams_padmalochan475_github_io_2024', // Unique deployment identifier
    
    // Application Settings
    AUTO_SAVE_INTERVAL: 30000,
    MAX_ASSIGNMENTS_PER_CELL: 10,
    DEFAULT_ACADEMIC_YEAR: '2024-25',
    
    // OAuth Settings
    OAUTH_REDIRECT_URI: window.location.origin,
    OAUTH_SCOPE: 'https://www.googleapis.com/auth/drive.file',
    
    // Print Settings
    PRINT_ORIENTATION: 'landscape',
    PRINT_PAPER_SIZE: 'A4',
    
    // Feature Flags
    FEATURES: {
        GOOGLE_DRIVE_SYNC: true,
        BULK_OPERATIONS: true,
        ANALYTICS: true,
        EXPORT_IMPORT: true
    },
    
    // Security Settings
    SECURITY: {
        DOMAIN_RESTRICTION: true, // Restrict API key to domain
        HTTPS_ONLY: true, // Force HTTPS in production
        SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
    },
    
    // Development mode (set to false for production)
    DEV_MODE: false,
    
    // User Management System
    USER_APPROVAL_REQUIRED: true,
    PENDING_USERS_KEY: 'lams_pending_users',
    APPROVED_USERS_KEY: 'lams_approved_users',
    
    // Data Encryption (basic obfuscation)
    ENCRYPT_LOCAL_DATA: true,
    
    // Anti-tampering protection - ENABLED
    VALIDATION_REQUIRED: true,
    BLOCK_UNAUTHORIZED_DEPLOYMENTS: true
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}