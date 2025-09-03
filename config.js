// Configuration for GitHub Pages deployment
// WARNING: This file is publicly visible on GitHub Pages
// Only put non-sensitive configuration here
const CONFIG = {
    // Google OAuth Configuration (Client ID is meant to be public)
    GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com',
    GOOGLE_API_KEY: 'YOUR_GOOGLE_API_KEY_HERE', // Restrict this key to your domain only
    
    // Institute Information
    INSTITUTE_NAME: 'Your Institute Name',
    INSTITUTE_LOGO: 'assets/logo.png',
    
    // Admin Configuration - This email will be visible to all users
    ADMIN_EMAIL: 'admin@yourinstitute.edu', // Use institutional email only
    
    // Security Validation - Generate these values for your deployment
    AUTHORIZED_DOMAIN_HASH: 'your-domain-hash-here', // Hash of your authorized domain
    DEPLOYMENT_FINGERPRINT: 'your-deployment-fingerprint-here', // Unique deployment identifier
    
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
    
    // Anti-tampering protection
    VALIDATION_REQUIRED: true,
    BLOCK_UNAUTHORIZED_DEPLOYMENTS: true
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}