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
        
        this.CLIENT_ID = CONFIG?.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
        this.API_KEY = CONFIG?.GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY';
    }

    async init() {
        if (this.CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
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
        return new Promise((resolve) => {
            gapi.load('client:auth2', async () => {
                await gapi.client.init({
                    apiKey: this.API_KEY,
                    clientId: this.CLIENT_ID,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                    scope: 'https://www.googleapis.com/auth/drive.file'
                });
                resolve();
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
                // Auto-load data from Google Drive
                setTimeout(() => this.loadFromDrive(), 1000);
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
                // Auto-load data from Google Drive
                setTimeout(() => this.loadFromDrive(), 1000);
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
        if (this.CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
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
        if (!this.isSignedIn) {
            return false;
        }

        try {
            this.updateSyncStatus('Syncing...');
            
            // Ensure Google APIs are ready
            if (!window.gapi || !gapi.auth2) {
                console.error('Google APIs not ready');
                return false;
            }

            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance || !authInstance.isSignedIn.get()) {
                console.error('User not authenticated');
                return false;
            }

            // Get access token
            const user = authInstance.currentUser.get();
            const authResponse = user.getAuthResponse(true);
            const accessToken = authResponse.access_token;

            if (!accessToken) {
                console.error('No access token available');
                return false;
            }

            const fileName = 'lams-institute-data.json';
            const fileContent = JSON.stringify({
                ...data,
                lastModified: new Date().toISOString(),
                version: '1.0'
            }, null, 2);
            
            // Search for existing file
            const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&spaces=drive`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!searchResponse.ok) {
                throw new Error(`Search failed: ${searchResponse.status}`);
            }
            
            const searchResult = await searchResponse.json();
            let response;

            if (searchResult.files && searchResult.files.length > 0) {
                // Update existing file
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
                // Create new file with metadata
                const boundary = '-------314159265358979323846';
                const delimiter = "\r\n--" + boundary + "\r\n";
                const close_delim = "\r\n--" + boundary + "--";
                
                const metadata = {
                    'name': fileName,
                    'parents': []
                };
                
                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    fileContent +
                    close_delim;
                
                response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': `multipart/related; boundary="${boundary}"`
                    },
                    body: multipartRequestBody
                });
            }

            if (response.ok) {
                this.updateSyncStatus('Synced');
                console.log('✅ Data synced to Google Drive');
                
                // Store sync timestamp for cross-device detection
                localStorage.setItem('lams_last_sync', Date.now().toString());
                
                return true;
            } else {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('❌ Drive save failed:', error);
            this.updateSyncStatus('Sync failed');
        }
        return false;
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
        if (!this.isSignedIn) {
            return null;
        }

        try {
            // Ensure Google APIs are ready
            if (!window.gapi || !gapi.auth2) {
                console.error('Google APIs not ready');
                return null;
            }

            const authInstance = gapi.auth2.getAuthInstance();
            if (!authInstance || !authInstance.isSignedIn.get()) {
                console.error('User not authenticated');
                return null;
            }

            // Get access token
            const user = authInstance.currentUser.get();
            const authResponse = user.getAuthResponse(true);
            const accessToken = authResponse.access_token;

            if (!accessToken) {
                console.error('No access token available');
                return null;
            }

            // Search for the file
            const fileName = 'lams-institute-data.json';
            const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&spaces=drive&orderBy=modifiedTime desc&pageSize=1`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!searchResponse.ok) {
                throw new Error(`Search failed: ${searchResponse.status}`);
            }
            
            const searchResult = await searchResponse.json();

            if (searchResult.files && searchResult.files.length > 0) {
                const fileId = searchResult.files[0].id;
                
                // Get file content
                const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!fileResponse.ok) {
                    throw new Error(`File download failed: ${fileResponse.status}`);
                }
                
                const fileContent = await fileResponse.text();
                const driveData = JSON.parse(fileContent);
                
                // Check if this is newer than local data
                const localTimestamp = localStorage.getItem('lams_last_sync');
                const driveTimestamp = new Date(driveData.lastModified || 0).getTime();
                const localTime = parseInt(localTimestamp || '0');
                
                if (driveTimestamp > localTime || !localTimestamp) {
                    // Update local data with drive data
                    if (window.dataManager && driveData) {
                        // Merge data carefully
                        const mergedData = {
                            ...window.dataManager.data,
                            ...driveData
                        };
                        
                        // Remove metadata fields
                        delete mergedData.lastModified;
                        delete mergedData.version;
                        
                        window.dataManager.data = mergedData;
                        localStorage.setItem('labManagementData', JSON.stringify(mergedData));
                        localStorage.setItem('lams_last_sync', driveTimestamp.toString());
                        
                        // Refresh UI without triggering another save
                        window.dataManager.refreshAllComponents();
                        console.log('✅ Data loaded from Google Drive');
                    }
                }
                
                return driveData;
            } else {
                console.log('ℹ️ No data found in Google Drive');
            }
        } catch (error) {
            console.error('❌ Drive load failed:', error);
        }
        return null;
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
                    // Auto-load data from Google Drive
                    setTimeout(() => this.loadFromDrive(), 1000);
                    return;
                }
                
                const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
                const isStillApproved = approvedUsers.some(u => u.email === this.currentUser.email);
                
                if (isStillApproved) {
                    this.currentUser.isAdmin = false;
                    this.isSignedIn = true;
                    console.log('User session restored');
                    this.updateUI();
                    // Auto-load data from Google Drive
                    setTimeout(() => this.loadFromDrive(), 1000);
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



// Manual sync functions for testing
async function manualSyncToDrive() {
    if (window.authManager && window.dataManager) {
        showMessage('Manually syncing to Google Drive...', 'info');
        const success = await window.authManager.saveToGoogleDrive(window.dataManager.data);
        if (success) {
            showMessage('Manual sync to Drive completed!', 'success');
        } else {
            showMessage('Manual sync to Drive failed!', 'error');
        }
    } else {
        showMessage('Please sign in first', 'error');
    }
}

async function manualLoadFromDrive() {
    if (window.authManager) {
        showMessage('Loading from Google Drive...', 'info');
        const data = await window.authManager.loadFromDrive();
        if (data) {
            showMessage('Data loaded from Drive successfully!', 'success');
        } else {
            showMessage('No data found in Drive or load failed', 'error');
        }
    } else {
        showMessage('Please sign in first', 'error');
    }
}

// Export functions
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.removeApprovedUser = removeApprovedUser;
window.loadFromDrive = loadFromDrive;
window.manualSyncToDrive = manualSyncToDrive;
window.manualLoadFromDrive = manualLoadFromDrive;