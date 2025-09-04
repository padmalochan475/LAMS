// Google Authentication and Drive Integration
class AuthManager {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null;
        
        // Debug logging
        console.log('CONFIG available:', typeof CONFIG !== 'undefined');
        if (typeof CONFIG !== 'undefined') {
            console.log('CLIENT_ID:', CONFIG.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
            console.log('API_KEY:', CONFIG.GOOGLE_API_KEY ? 'Present' : 'Missing');
        }
        
        this.CLIENT_ID = CONFIG?.GOOGLE_CLIENT_ID || '';
        this.API_KEY = CONFIG?.GOOGLE_API_KEY || '';
    }

    async init() {
        if (!this.CLIENT_ID || this.CLIENT_ID === '') {
            console.warn('Google Client ID not configured');
            return;
        }
        
        try {
            await this.initializeGoogleAPI();
        } catch (error) {
            console.error('Auth initialization failed:', error);
        }
    }

    async initializeGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (!window.gapi) {
                reject(new Error('Google API not loaded'));
                return;
            }
            
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: this.API_KEY,
                        clientId: this.CLIENT_ID,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                        scope: CONFIG.OAUTH_SCOPE
                    });
                    console.log('Google API initialized successfully');
                    resolve();
                } catch (error) {
                    console.error('Google API initialization failed:', error);
                    reject(error);
                }
            });
        });
    }

    signIn(credential) {
        console.log('Processing sign-in...');
        try {
            const payload = JSON.parse(atob(credential.split('.')[1]));
            const user = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                loginTime: new Date().toISOString()
            };
            
            console.log('User:', user.email, 'Admin:', CONFIG.ADMIN_EMAIL);
            
            if (user.email === CONFIG.ADMIN_EMAIL) {
                this.currentUser = { ...user, isAdmin: true };
                this.isSignedIn = true;
                localStorage.setItem('userSession', JSON.stringify(this.currentUser));
                console.log('Admin signed in, session saved');
                this.updateUI();
                // Auto-load with delay and error handling
                setTimeout(() => {
                    if (window.google?.accounts?.oauth2) {
                        this.loadFromDrive().catch(e => console.log('Auto-load skipped:', e.message));
                    }
                }, 5000);
                return;
            }
            
            const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
            const isApproved = approvedUsers.some(u => u.email === user.email);
            
            if (isApproved) {
                this.currentUser = { ...user, isAdmin: false };
                this.isSignedIn = true;
                localStorage.setItem('userSession', JSON.stringify(this.currentUser));
                console.log('Approved user signed in, session saved');
                this.updateUI();
                // Auto-load with delay and error handling
                setTimeout(() => {
                    if (window.google?.accounts?.oauth2) {
                        this.loadFromDrive().catch(e => console.log('Auto-load skipped:', e.message));
                    }
                }, 5000);
                return;
            }
            
            this.addToPendingUsers(user);
            showMessage('Access request sent to admin. You will be notified once approved.', 'info');
            console.log('Access request sent to admin.');
            
        } catch (error) {
            console.error('Sign in error:', error);
        }
    }
    
    addToPendingUsers(user) {
        const pendingUsers = JSON.parse(localStorage.getItem(CONFIG.PENDING_USERS_KEY) || '[]');
        if (pendingUsers.some(u => u.email === user.email)) return;
        
        pendingUsers.push(user);
        localStorage.setItem(CONFIG.PENDING_USERS_KEY, JSON.stringify(pendingUsers));
    }

    signOut() {
        this.isSignedIn = false;
        this.currentUser = null;
        localStorage.removeItem('userSession');
        
        // Sign out from Google
        if (window.google && window.google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        
        this.updateUI();
        console.log('Signed out successfully');
        location.reload();
    }

    updateUI() {
        const loginSection = document.getElementById('login-section');
        const userInfo = document.getElementById('user-info');
        const mainNav = document.getElementById('main-nav');
        const tabContents = document.querySelectorAll('.tab-content');
        
        console.log('Auth Status:', {
            isSignedIn: this.isSignedIn,
            currentUser: this.currentUser,
            hasGapi: !!window.gapi
        });

        if (this.isSignedIn && this.currentUser) {
            if (loginSection) loginSection.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (mainNav) mainNav.style.display = 'flex';
            
            const userName = document.getElementById('user-name');
            const userAvatar = document.getElementById('user-avatar');
            
            if (userName) {
                userName.textContent = this.currentUser.name;
                if (this.currentUser.isAdmin) {
                    userName.textContent += ' (Admin)';
                    userName.style.color = 'var(--color-primary)';
                }
            }
            
            if (userAvatar && this.currentUser.picture) {
                userAvatar.src = this.currentUser.picture;
            }
            
            // Show/hide admin features
            this.toggleAdminFeatures(this.currentUser.isAdmin);
            
            // Show dashboard by default if no tab is active
            const activeTab = document.querySelector('.tab-content.active');
            if (!activeTab && window.showTab) {
                window.showTab('dashboard');
            }
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (userInfo) userInfo.style.display = 'none';
            if (mainNav) mainNav.style.display = 'none';
            
            // Hide all tab contents
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Initialize Google Sign-In button only when logged out
            setTimeout(() => this.initializeSignInButton(), 100);
        }
    }
    
    toggleAdminFeatures(isAdmin) {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = isAdmin ? 'block' : 'none';
        });
        
        const adminButtons = document.querySelectorAll('.admin-btn');
        adminButtons.forEach(btn => {
            btn.style.display = isAdmin ? 'inline-flex' : 'none';
        });
        
        // Show pending users count for admin
        if (isAdmin) {
            this.updatePendingUsersCount();
        }
    }
    
    updatePendingUsersCount() {
        const pendingUsers = JSON.parse(localStorage.getItem(CONFIG.PENDING_USERS_KEY) || '[]');
        const countElement = document.getElementById('pendingUsersCount');
        if (countElement) {
            countElement.textContent = pendingUsers.length;
            countElement.style.display = pendingUsers.length > 0 ? 'inline' : 'none';
        }
    }

    initializeSignInButton() {
        if (!this.CLIENT_ID || this.CLIENT_ID === '') {
            console.error('Client ID not configured properly');
            return;
        }
        
        console.log('Initializing Google Sign-In with Client ID:', this.CLIENT_ID);
        
        // Render Google Sign-In button
        if (window.google && window.google.accounts) {
            try {
                google.accounts.id.initialize({
                    client_id: this.CLIENT_ID,
                    callback: (response) => {
                        console.log('Direct callback triggered:', response);
                        this.signIn(response.credential);
                    }
                });
                
                const buttonContainer = document.querySelector('.g_id_signin');
                if (buttonContainer) {
                    buttonContainer.innerHTML = '';
                    google.accounts.id.renderButton(buttonContainer, {
                        theme: 'outline',
                        size: 'large'
                    });
                    console.log('Google Sign-In button rendered');
                } else {
                    console.error('Button container not found');
                }
            } catch (error) {
                console.error('Google Sign-In error:', error);
            }
        } else {
            console.log('Google library not ready, retrying...');
            setTimeout(() => this.initializeSignInButton(), 500);
        }
    }

    async saveToGoogleDrive(data) {
        try {
            console.log('🔄 Starting Google Drive sync...');
            this.updateSyncStatus('Syncing...');
            
            if (!this.isSignedIn || !this.currentUser) {
                console.log('❌ User not signed in');
                return false;
            }

            // Skip sync if Google Identity Services not available
            if (!window.google?.accounts?.oauth2) {
                console.log('⏳ Google Identity Services not ready, skipping sync');
                return false;
            }

            const accessToken = await this.getAccessToken();
            if (!accessToken) {
                console.log('❌ No access token, skipping sync');
                return false;
            }
            
            const fileName = 'lams-data.json';
            const fileContent = JSON.stringify(data, null, 2);
            
            // Search for existing file using fetch API
            console.log('🔍 Searching for existing file...');
            const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}'`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const searchResult = await searchResponse.json();
            
            let response;
            if (searchResult.files && searchResult.files.length > 0) {
                // Update existing file
                console.log('📝 Updating existing file...');
                const fileId = searchResult.files[0].id;
                response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: fileContent
                });
            } else {
                // Create new file
                console.log('📄 Creating new file...');
                const metadata = { name: fileName };
                const form = new FormData();
                form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
                form.append('file', new Blob([fileContent], {type: 'application/json'}));
                
                response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    body: form
                });
            }
            
            if (response.ok) {
                console.log('✅ Successfully synced to Google Drive!');
                this.updateSyncStatus('Synced');
                this.addSyncLog('save', 'success', 'Data successfully synced to Google Drive', {
                    assignmentsCount: data.assignments?.length || 0,
                    fileSize: JSON.stringify(data).length
                });
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
        } catch (error) {
            console.error('❌ Google Drive sync failed:', error);
            this.updateSyncStatus('Sync failed');
            this.addSyncLog('save', 'error', 'Failed to sync to Google Drive', {
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    async getAccessToken() {
        try {
            if (!window.google?.accounts?.oauth2) {
                console.log('❌ Google Identity Services not available');
                return null;
            }

            return new Promise((resolve) => {
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    callback: (response) => {
                        if (response.access_token) {
                            console.log('✅ Access token obtained');
                            resolve(response.access_token);
                        } else {
                            console.log('❌ No access token in response');
                            resolve(null);
                        }
                    },
                    error_callback: (error) => {
                        console.log('❌ Token request failed:', error);
                        resolve(null);
                    }
                });
                
                // Try to request token with user interaction hint to help with popup blockers
                try {
                    tokenClient.requestAccessToken({ 
                        prompt: 'consent',
                        hint: this.currentUser?.email || ''
                    });
                } catch (popupError) {
                    console.log('⚠️ Popup blocked, falling back to consent flow');
                    tokenClient.requestAccessToken({ prompt: 'consent' });
                }
            });
        } catch (error) {
            console.log('❌ Token request error:', error);
            return null;
        }
    }

    addSyncLog(type, status, message, details = null) {
        const logs = JSON.parse(localStorage.getItem('lams_sync_logs') || '[]');
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type, // 'save', 'load', 'auto'
            status: status, // 'success', 'error', 'info'
            message: message,
            details: details,
            user: this.currentUser?.email || 'Unknown'
        };
        
        logs.unshift(logEntry); // Add to beginning
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(100);
        }
        
        localStorage.setItem('lams_sync_logs', JSON.stringify(logs));
        console.log(`📝 Sync Log: ${type} - ${status} - ${message}`);
    }

    async waitForGoogleAPI() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20; // Wait up to 10 seconds
            
            const checkAPI = () => {
                attempts++;
                if (window.gapi && gapi.load) {
                    console.log('✅ Google API is ready');
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    console.log('❌ Google API timeout');
                    resolve(false);
                } else {
                    setTimeout(checkAPI, 500);
                }
            };
            
            checkAPI();
        });
    }

    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('syncStatus');
        const syncStatusText = document.getElementById('syncStatusText');
        if (syncStatusElement && syncStatusText) {
            syncStatusElement.style.display = 'flex';
            syncStatusText.textContent = status;
            
            // Hide after 3 seconds if synced
            if (status === 'Synced') {
                setTimeout(() => {
                    syncStatusElement.style.display = 'none';
                }, 3000);
            }
        }
    }

    async loadFromDrive() {
        try {
            console.log('📥 Loading from Google Drive...');
            
            if (!this.isSignedIn || !this.currentUser) {
                console.log('❌ User not signed in');
                return null;
            }

            // Skip load if Google Identity Services not available
            if (!window.google?.accounts?.oauth2) {
                console.log('⏳ Google Identity Services not ready, skipping load');
                return null;
            }

            const accessToken = await this.getAccessToken();
            if (!accessToken) {
                console.log('❌ No access token, skipping load');
                // Only show popup warning for manual sync attempts
                const isManualAttempt = new Error().stack.includes('manualLoadFromDrive');
                if (isManualAttempt && typeof showMessage === 'function') {
                    showMessage('Please allow popups for Google Drive sync. Check browser popup settings.', 'warning');
                }
                return null;
            }
            
            const fileName = 'lams-data.json';
            
            // Search for file using fetch API
            console.log('🔍 Searching for data file...');
            const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&orderBy=modifiedTime desc&pageSize=1`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const searchResult = await searchResponse.json();
            
            if (searchResult.files && searchResult.files.length > 0) {
                const fileId = searchResult.files[0].id;
                console.log('📝 Found file, downloading...');
                
                // Get file content using fetch API
                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                const fileContent = await fileResponse.text();
                const driveData = JSON.parse(fileContent);
                
                if (window.dataManager) {
                    // Update local data
                    window.dataManager.data = { ...window.dataManager.data, ...driveData };
                    localStorage.setItem('labManagementData', JSON.stringify(window.dataManager.data));
                    window.dataManager.refreshAllComponents();
                    console.log('✅ Data loaded from Google Drive successfully!');
                    this.addSyncLog('load', 'success', 'Data successfully loaded from Google Drive', {
                        assignmentsCount: driveData.assignments?.length || 0,
                        fileSize: JSON.stringify(driveData).length
                    });
                }
                
                return driveData;
            } else {
                console.log('ℹ️ No data file found in Google Drive');
                this.addSyncLog('load', 'info', 'No data file found in Google Drive');
                return null;
            }
            
        } catch (error) {
            console.error('❌ Load from Google Drive failed:', error);
            this.addSyncLog('load', 'error', 'Failed to load from Google Drive', {
                error: error.message,
                stack: error.stack
            });
            return null;
        }
    }

    checkExistingSession() {
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
            try {
                this.currentUser = JSON.parse(savedSession);
                console.log('Found existing session for:', this.currentUser.email);
                
                if (this.currentUser.email === CONFIG.ADMIN_EMAIL) {
                    this.currentUser.isAdmin = true;
                    this.isSignedIn = true;
                    console.log('Admin session restored');
                    this.updateUI();
                    // Auto-load with delay and error handling
                    setTimeout(() => {
                        if (window.google?.accounts?.oauth2) {
                            this.loadFromDrive().catch(e => console.log('Auto-load skipped:', e.message));
                        }
                    }, 5000);
                    return;
                }
                
                const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
                const isStillApproved = approvedUsers.some(u => u.email === this.currentUser.email);
                
                if (isStillApproved) {
                    this.currentUser.isAdmin = false;
                    this.isSignedIn = true;
                    console.log('User session restored');
                    this.updateUI();
                    // Auto-load with delay and error handling
                    setTimeout(() => {
                        if (window.google?.accounts?.oauth2) {
                            this.loadFromDrive().catch(e => console.log('Auto-load skipped:', e.message));
                        }
                    }, 5000);
                } else {
                    console.log('User no longer approved, clearing session');
                    localStorage.removeItem('userSession');
                    this.updateUI();
                }
            } catch (error) {
                console.error('Session restore error:', error);
                localStorage.removeItem('userSession');
                this.updateUI();
            }
        } else {
            console.log('No existing session found');
            this.updateUI();
        }
    }
}

// Global auth manager
let authManager;

// Simplified global callback
function handleCredentialResponse(response) {
    console.log('Global callback:', response);
    if (window.authManager) {
        window.authManager.signIn(response.credential);
    }
}
window.handleCredentialResponse = handleCredentialResponse;

// Sign out function
function signOut() {
    console.log('Sign out clicked');
    if (window.authManager) {
        window.authManager.signOut();
    } else {
        console.error('AuthManager not available');
        location.reload();
    }
}

// Make functions globally available
window.signOut = signOut;

// Load from Google Drive (for initial load only)
async function loadFromDrive() {
    if (window.authManager) {
        await window.authManager.loadFromDrive();
    }
}

// User Management Functions
function approveUser(email) {
    const pendingUsers = JSON.parse(localStorage.getItem(CONFIG.PENDING_USERS_KEY) || '[]');
    const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
    
    const userIndex = pendingUsers.findIndex(u => u.email === email);
    if (userIndex > -1) {
        const user = pendingUsers[userIndex];
        approvedUsers.push({ ...user, approvedAt: new Date().toISOString() });
        pendingUsers.splice(userIndex, 1);
        
        localStorage.setItem(CONFIG.PENDING_USERS_KEY, JSON.stringify(pendingUsers));
        localStorage.setItem(CONFIG.APPROVED_USERS_KEY, JSON.stringify(approvedUsers));
        
        if (window.authManager) window.authManager.updatePendingUsersCount();
    }
}

function rejectUser(email) {
    const pendingUsers = JSON.parse(localStorage.getItem(CONFIG.PENDING_USERS_KEY) || '[]');
    const userIndex = pendingUsers.findIndex(u => u.email === email);
    
    if (userIndex > -1) {
        pendingUsers.splice(userIndex, 1);
        localStorage.setItem(CONFIG.PENDING_USERS_KEY, JSON.stringify(pendingUsers));
        if (window.authManager) window.authManager.updatePendingUsersCount();
    }
}

function removeApprovedUser(email) {
    const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
    const userIndex = approvedUsers.findIndex(u => u.email === email);
    
    if (userIndex > -1) {
        approvedUsers.splice(userIndex, 1);
        localStorage.setItem(CONFIG.APPROVED_USERS_KEY, JSON.stringify(approvedUsers));
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded');
        return;
    }
    
    window.authManager = new AuthManager();
    
    // Check existing session first
    window.authManager.checkExistingSession();
    
    // Wait for Google library
    const initGoogle = () => {
        if (window.google?.accounts) {
            window.authManager.initializeSignInButton();
        } else {
            setTimeout(initGoogle, 500);
        }
    };
    initGoogle();
});



// Manual sync functions
async function manualSyncToDrive() {
    console.log('🔄 Manual sync to Drive requested');
    
    if (!window.authManager || !window.dataManager) {
        showMessage('System not ready. Please refresh the page.', 'error');
        return;
    }
    
    showMessage('Syncing to Google Drive...', 'info');
    const success = await window.authManager.saveToGoogleDrive(window.dataManager.data);
    
    if (success) {
        showMessage('✅ Synced to Google Drive!', 'success');
    } else {
        showMessage('❌ Sync failed. Check console for details.', 'error');
    }
}

async function manualLoadFromDrive() {
    console.log('📥 Manual load from Drive requested');
    
    if (!window.authManager) {
        showMessage('System not ready. Please refresh the page.', 'error');
        return;
    }
    
    showMessage('Loading from Google Drive...', 'info');
    
    try {
        const data = await window.authManager.loadFromDrive();
        
        if (data && window.dataManager) {
            window.dataManager.data = { ...window.dataManager.data, ...data };
            window.dataManager.save();
            window.dataManager.refreshAllComponents();
            showMessage('✅ Loaded from Google Drive!', 'success');
        } else {
            // Check if it's a popup issue
            if (typeof google !== 'undefined' && google.accounts) {
                showMessage('ℹ️ No data found in Google Drive or sync cancelled.', 'info');
            } else {
                showMessage('⚠️ Google services not ready. Please allow popups and try again.', 'warning');
            }
        }
    } catch (error) {
        if (error.message && error.message.includes('popup')) {
            showMessage('⚠️ Popup blocked. Please allow popups for this site and try again.', 'warning');
        } else {
            showMessage('❌ Load failed. Check your internet connection.', 'error');
        }
        console.error('Manual load error:', error);
    }
}

// Export functions
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.removeApprovedUser = removeApprovedUser;
window.loadFromDrive = loadFromDrive;
window.manualSyncToDrive = manualSyncToDrive;
window.manualLoadFromDrive = manualLoadFromDrive;