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

    async signIn(credential) {
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
                this.accessToken = null; // Reset token for fresh auth
                localStorage.setItem('userSession', JSON.stringify(this.currentUser));
                console.log('Admin signed in, session saved');
                this.updateUI();
                // Trigger cloud-first data loading and start real-time sync automatically
                if (window.dataManager) {
                    window.dataManager.loadFromCloud().then(() => {
                        // Start automatic sync immediately like Google Docs
                        setTimeout(() => {
                            window.dataManager.startRealTimeSync();
                            showMessage('🚀 Real-time sync active! Data syncs across all devices.', 'success');
                        }, 1000);
                    });
                }
                return;
            }
            
            // Check if user is approved (100% cloud-based)
            const isApproved = await this.checkUserApprovalFromCloud(user.email);
            console.log('🔍 Checking user approval status for:', user.email);
            console.log('✅ User approved status (from cloud):', isApproved);
            
            if (isApproved) {
                this.currentUser = { ...user, isAdmin: false };
                this.isSignedIn = true;
                this.accessToken = null; // Reset token for fresh auth
                localStorage.setItem('userSession', JSON.stringify(this.currentUser));
                console.log('Approved user signed in, session saved');
                this.updateUI();
                // Trigger cloud-first data loading and start real-time sync automatically
                if (window.dataManager) {
                    window.dataManager.loadFromCloud().then(() => {
                        // Start automatic sync immediately like Google Docs
                        setTimeout(() => {
                            window.dataManager.startRealTimeSync();
                            showMessage('🚀 Real-time sync active! Data syncs across all devices.', 'success');
                        }, 1000);
                    });
                }
                return;
            }
            
            console.log('❌ User not approved, adding to pending list');
            await this.addToPendingUsersCloud(user);
            showMessage('Access request sent to admin. You will be notified once approved.', 'info');
            console.log('Access request sent to admin.');
            
        } catch (error) {
            console.error('Sign in error:', error);
        }
    }

    // 100% Cloud-based user approval checking
    async checkUserApprovalFromCloud(email) {
        try {
            if (!window.dataManager) {
                console.warn('DataManager not available for cloud user check');
                return false;
            }
            
            // Get approved users from cloud data
            const approvedUsers = window.dataManager.approvedUsers || [];
            return approvedUsers.some(u => u.email === email);
        } catch (error) {
            console.error('Error checking user approval from cloud:', error);
            return false;
        }
    }

    // 100% Cloud-based pending user addition
    async addToPendingUsersCloud(user) {
        try {
            console.log('☁️ Adding user to pending list in cloud:', user.email);
            
            if (!window.dataManager) {
                throw new Error('DataManager not available');
            }
            
            const pendingUsers = window.dataManager.pendingUsers || [];
            
            if (pendingUsers.some(u => u.email === user.email)) {
                console.log('⚠️ User already in pending list:', user.email);
                return;
            }
            
            // Add to cloud data
            pendingUsers.push(user);
            window.dataManager.pendingUsers = pendingUsers;
            
            // Save to cloud immediately
            const success = await window.dataManager.save();
            if (success) {
                console.log('✅ User added to pending list and synced to cloud:', pendingUsers.length);
                this.updatePendingUsersCountFromCloud(pendingUsers.length);
            } else {
                throw new Error('Failed to sync pending user to cloud');
            }
        } catch (error) {
            console.error('❌ Failed to add user to cloud pending list:', error);
            showMessage('❌ Failed to process request. Please try again.', 'error');
        }
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

    getUserInfo() {
        if (this.isSignedIn && this.currentUser) {
            return {
                name: this.currentUser.name,
                email: this.currentUser.email,
                picture: this.currentUser.picture,
                isSignedIn: this.isSignedIn,
                role: this.currentUser.role || 'user'
            };
        }
        return null;
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

    // Cloud-based pending users count update
    updatePendingUsersCountFromCloud(count) {
        console.log('🔔 Updating pending users badge from cloud data:', count);
        
        const badge = document.querySelector('.pending-users-badge');
        console.log('🎯 Badge element found:', !!badge);
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'inline';
                console.log('✅ Badge updated with count:', count);
            } else {
                badge.style.display = 'none';
                console.log('🔄 Badge hidden (no pending users)');
            }
        } else {
            console.warn('⚠️ Pending users badge element not found in DOM');
        }
    }

    updatePendingUsersCount() {
        // Use cloud-based data instead of localStorage
        const pendingCount = window.dataManager?.pendingUsers?.length || 0;
        console.log('🔄 Updating pending users count from cloud data:', pendingCount);
        
        const countElement = document.getElementById('pendingUsersCount');
        if (countElement) {
            countElement.textContent = pendingCount;
            countElement.style.display = pendingCount > 0 ? 'inline' : 'none';
            console.log('📊 Updated UI badge with cloud count:', pendingCount);
        } else {
            console.warn('⚠️ Could not find pendingUsersCount element in DOM');
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

    async saveToGoogleDrive(data, allowPopup = true) {
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

            const accessToken = await this.getAccessToken(allowPopup);
            if (!accessToken) {
                console.log('❌ No access token available for sync');
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

    async getAccessToken(allowPopup = true) {
        try {
            // Return cached token if still valid
            if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry)) {
                console.log('🔑 Using cached access token');
                return this.accessToken;
            }

            if (!window.google?.accounts?.oauth2) {
                console.log('❌ Google Identity Services not available');
                return null;
            }

            // If user is signed in but we don't have a token, request one
            if (this.isSignedIn && this.currentUser) {
                console.log('🔄 Requesting access token for signed-in user...');
                
                return new Promise((resolve) => {
                    const tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: this.CLIENT_ID,
                        scope: 'https://www.googleapis.com/auth/drive.file',
                        callback: (response) => {
                            if (response.access_token) {
                                console.log('✅ Access token obtained successfully');
                                this.accessToken = response.access_token;
                                this.tokenExpiry = new Date(Date.now() + 3600000).toISOString();
                                resolve(response.access_token);
                            } else {
                                console.log('❌ No access token in response');
                                resolve(null);
                            }
                        },
                        error_callback: (error) => {
                            if (allowPopup) {
                                console.log('❌ Token request failed:', error);
                            } else {
                                console.log('⏳ Background sync - token request failed silently');
                            }
                            resolve(null);
                        }
                    });
                    
                    try {
                        // For signed-in users, try with minimal prompt first
                        tokenClient.requestAccessToken({ 
                            prompt: '',
                            hint: this.currentUser.email
                        });
                    } catch (popupError) {
                        if (allowPopup) {
                            console.log('⚠️ Popup blocked, trying consent flow...');
                            try {
                                tokenClient.requestAccessToken({ prompt: 'consent' });
                            } catch (consentError) {
                                console.log('❌ Both silent and consent flows failed');
                                resolve(null);
                            }
                        } else {
                            console.log('⏳ Background sync - no popup allowed, skipping token request');
                            resolve(null);
                        }
                    }
                });
            }

            // Don't attempt popup for background sync if user not signed in
            if (!allowPopup) {
                console.log('⏳ Background sync - no token available');
                return null;
            }

            // Standard token request for new users
            return new Promise((resolve) => {
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: this.CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    callback: (response) => {
                        if (response.access_token) {
                            console.log('✅ Access token obtained');
                            this.accessToken = response.access_token;
                            this.tokenExpiry = new Date(Date.now() + 3600000).toISOString();
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
                
                tokenClient.requestAccessToken({ prompt: 'consent' });
            });
        } catch (error) {
            console.log('❌ Token request error:', error);
            return null;
        }
    }

    // Initialize real-time sync after successful sign-in
    async initializeRealTimeSync() {
        try {
            console.log('🚀 Initializing real-time sync for signed-in user...');
            
            // Request access token with user consent (one-time popup)
            const token = await this.getAccessToken(true);
            if (token) {
                console.log('✅ Access token obtained - starting real-time sync');
                
                // Start real-time sync now that we have permission
                if (window.dataManager) {
                    window.dataManager.startRealTimeSync();
                    showMessage('🔄 Real-time sync activated! Changes sync every 3 seconds across all devices.', 'success');
                }
            } else {
                console.log('⚠️ No access token - real-time sync not available');
                showMessage('⚠️ Cloud sync not available. Use "Activate Real-Time Sync" to enable.', 'warning');
            }
        } catch (error) {
            console.log('❌ Failed to initialize real-time sync:', error);
            showMessage('⚠️ Could not activate real-time sync automatically. Use manual sync button.', 'warning');
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

    async loadFromDrive(allowPopup = true) {
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

            const accessToken = await this.getAccessToken(allowPopup);
            if (!accessToken) {
                console.log('❌ No access token, skipping load');
                // Show popup warning for manual attempts only
                if (allowPopup && typeof showMessage === 'function') {
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

    async checkExistingSession() {
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
                    
                    // Only try to start sync if we have a valid cached token (no API calls)
                    setTimeout(() => {
                        if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry)) {
                            console.log('🔄 Valid admin token found - resuming real-time sync');
                            if (window.dataManager) {
                                window.dataManager.startRealTimeSync();
                                showMessage('🔄 Admin real-time sync resumed', 'success');
                            }
                        } else {
                            console.log('💡 Admin logged in - automatic sync will start once Google permissions are available');
                            if (window.dataManager) {
                                window.dataManager.updateSyncStatus('Ready to sync');
                            }
                        }
                    }, 1000);
                    return;
                }
                
                // Check user approval from cloud data
                const isStillApproved = await this.checkUserApprovalFromCloud(this.currentUser.email);
                
                if (isStillApproved) {
                    this.currentUser.isAdmin = false;
                    this.isSignedIn = true;
                    console.log('User session restored from cloud');
                    this.updateUI();
                    
                    // Only try to start sync if we have a valid cached token (no API calls)
                    setTimeout(() => {
                        if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry)) {
                            console.log('🔄 Valid token found - resuming real-time sync');
                            if (window.dataManager) {
                                window.dataManager.startRealTimeSync();
                                showMessage('🔄 Real-time sync resumed', 'success');
                            }
                        } else {
                            console.log('💡 User logged in - automatic sync will start once Google permissions are available');
                            if (window.dataManager) {
                                window.dataManager.updateSyncStatus('Ready to sync');
                            }
                        }
                    }, 1000);
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

// 100% Cloud-based User Management Functions
async function approveUser(email) {
    try {
        console.log('☁️ Approving user in cloud:', email);
        
        if (!window.dataManager) {
            throw new Error('DataManager not available');
        }
        
        const pendingUsers = window.dataManager.pendingUsers || [];
        const approvedUsers = window.dataManager.approvedUsers || [];
        
        const userIndex = pendingUsers.findIndex(u => u.email === email);
        if (userIndex > -1) {
            const user = pendingUsers[userIndex];
            approvedUsers.push({ ...user, approvedAt: new Date().toISOString() });
            pendingUsers.splice(userIndex, 1);
            
            // Update cloud data
            window.dataManager.pendingUsers = pendingUsers;
            window.dataManager.approvedUsers = approvedUsers;
            
            // Save to cloud
            const success = await window.dataManager.save();
            if (success) {
                console.log('✅ User approval synced to cloud');
                if (window.authManager) {
                    window.authManager.updatePendingUsersCountFromCloud(pendingUsers.length);
                }
                showMessage(`✅ ${user.name} approved and synced to cloud`, 'success');
            } else {
                throw new Error('Failed to sync approval to cloud');
            }
        }
    } catch (error) {
        console.error('❌ Failed to approve user:', error);
        showMessage('❌ Failed to approve user. Please try again.', 'error');
    }
}

async function rejectUser(email) {
    try {
        console.log('☁️ Rejecting user in cloud:', email);
        
        if (!window.dataManager) {
            throw new Error('DataManager not available');
        }
        
        const pendingUsers = window.dataManager.pendingUsers || [];
        const userIndex = pendingUsers.findIndex(u => u.email === email);
        
        if (userIndex > -1) {
            const user = pendingUsers[userIndex];
            pendingUsers.splice(userIndex, 1);
            
            // Update cloud data
            window.dataManager.pendingUsers = pendingUsers;
            
            // Save to cloud
            const success = await window.dataManager.save();
            if (success) {
                console.log('✅ User rejection synced to cloud');
                if (window.authManager) {
                    window.authManager.updatePendingUsersCountFromCloud(pendingUsers.length);
                }
                showMessage(`❌ ${user.name} rejected and synced to cloud`, 'info');
            } else {
                throw new Error('Failed to sync rejection to cloud');
            }
        }
    } catch (error) {
        console.error('❌ Failed to reject user:', error);
        showMessage('❌ Failed to reject user. Please try again.', 'error');
    }
}

async function removeApprovedUser(email) {
    try {
        console.log('☁️ Removing approved user from cloud:', email);
        
        if (!window.dataManager) {
            throw new Error('DataManager not available');
        }
        
        const approvedUsers = window.dataManager.approvedUsers || [];
        const userIndex = approvedUsers.findIndex(u => u.email === email);
        
        if (userIndex > -1) {
            const user = approvedUsers[userIndex];
            approvedUsers.splice(userIndex, 1);
            
            // Update cloud data
            window.dataManager.approvedUsers = approvedUsers;
            
            // Save to cloud
            const success = await window.dataManager.save();
            if (success) {
                console.log('✅ User removal synced to cloud');
                showMessage(`🗑️ ${user.name} removed and synced to cloud`, 'info');
            } else {
                throw new Error('Failed to sync removal to cloud');
            }
        }
    } catch (error) {
        console.error('❌ Failed to remove user:', error);
        showMessage('❌ Failed to remove user. Please try again.', 'error');
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded');
        return;
    }
    
    window.authManager = new AuthManager();
    
    // Check existing session first (async)
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



// Export only essential functions
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.removeApprovedUser = removeApprovedUser;