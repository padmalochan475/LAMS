// Configuration for GitHub Pages deployment
// WARNING: This file is publicly visible on GitHub Pages
// Only put non-sensitive configuration here
const CONFIG = {
    // Google OAuth Configuration (Client ID is meant to be public)
    GOOGLE_CLIENT_ID: '485361990614-74vhnb9vqjulp17gno3janj8blugshpr.apps.googleusercontent.com',
    GOOGLE_API_KEY: 'AIzaSyBxrTxVOKb9nIJJGy52GjSqhfbYixoqDVE',
    
    // Institute Information
    INSTITUTE_NAME: 'Trident Academy of Technology',
    INSTITUTE_LOGO: 'assets/logo.png',
    
    // Admin Configuration
    ADMIN_EMAIL: 'padmalochan.maharana@tat.ac.in',
    
    // Application Settings
    AUTO_SAVE_INTERVAL: 30000,
    REALTIME_SYNC_INTERVAL: 5000,
    MAX_ASSIGNMENTS_PER_CELL: 10,
    DEFAULT_ACADEMIC_YEAR: '2024-25',
    
    // OAuth Settings
    OAUTH_REDIRECT_URI: 'https://padmalochan475.github.io/LAMS/',
    OAUTH_SCOPE: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly',
    
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
    APPROVED_USERS_KEY: 'lams_approved_users'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}