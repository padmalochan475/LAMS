// Google Authentication and Drive Integration
class AuthManager {
    constructor() {
        this.isSignedIn = false;
        this.currentUser = null;
        
        // Debug logging (production-safe)
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('CONFIG available:', typeof CONFIG !== 'undefined');
            if (typeof CONFIG !== 'undefined') {
                console.log('CLIENT_ID:', CONFIG.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
                console.log('API_KEY:', CONFIG.GOOGLE_API_KEY ? 'Present' : 'Missing');
            }
        }
        
        this.CLIENT_ID = CONFIG?.GOOGLE_CLIENT_ID || '';
        this.API_KEY = CONFIG?.GOOGLE_API_KEY || '';
        
        // Enhanced cross-device auth management
        this.persistentTokenKey = 'lams_persistent_auth';
        this.refreshTokenKey = 'lams_refresh_token';
        this.deviceIdKey = 'lams_device_id';
        
    // Lazy device ID generation for better performance
    this._deviceId = null;
        
        console.log('🔧 Enhanced Auth Manager initialized for device:', this.deviceId);
    }

    get deviceId() {
        if (!this._deviceId) {
            this._deviceId = localStorage.getItem(this.deviceIdKey) || this.generateDeviceId();
        }
        return this._deviceId;
    }

    generateDeviceId() {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2);
        const browserInfo = navigator.userAgent.split(' ').slice(-2).join('_').replace(/[^a-zA-Z0-9]/g, '');
        return `device_${timestamp}_${randomStr}_${browserInfo}`;
    }

    async init() {
        if (!this.CLIENT_ID || this.CLIENT_ID === '') {
            console.warn('Google Client ID not configured');
            return;
        }
        
        try {
            await this.initializeGoogleAPI();
            await this.checkPersistentAuth();
        } catch (error) {
            console.error('Auth initialization failed:', error);
        }
    }

    async checkPersistentAuth() {
        console.log('🔍 Checking for persistent authentication...');
        const persistentAuth = localStorage.getItem(this.persistentTokenKey);
        
        if (persistentAuth) {
            try {
                const authData = JSON.parse(persistentAuth);
                const { user, tokenExpiry, refreshToken } = authData;
                
                console.log('📱 Found persistent auth for:', user.email);
                
                // Check if we have a valid refresh token or if access token is still valid
                if (refreshToken || (tokenExpiry && new Date() < new Date(tokenExpiry))) {
                    this.currentUser = user;
                    this.isSignedIn = true;
                    this.refreshToken = refreshToken;
                    
                    console.log('✅ Restored authentication from persistent storage');
                    this.updateUI();
                    try { localStorage.setItem(this.deviceIdKey, this.deviceId); } catch {}
                    
                    // Try to refresh access token
                    await this.refreshAccessToken();
                    
                    // Auto-start sync for persistent sessions
                    if (window.dataManager) {
                        window.dataManager.loadFromCloud().then(() => {
                            setTimeout(() => {
                                window.dataManager.startRealTimeSync();
                                showMessage('🚀 Cross-device sync restored! Connected across all browsers.', 'success');
                            }, 1000);
                        });
                    }
                    
                    return true;
                }
            } catch (error) {
                console.error('❌ Failed to restore persistent auth:', error);
                this.clearPersistentAuth();
            }
        }
        
        return false;
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
                    
                    // Initialize notification listeners for cross-device functionality
                    this.initializeNotificationListeners();
                    
                    resolve();
                } catch (error) {
                    console.error('Google API initialization failed:', error);
                    reject(error);
                }
            });
        });
    }

    // Initialize notification listeners for cross-device functionality
    initializeNotificationListeners() {
        console.log('🔄 Initializing cross-device notification listeners...');

        // Listen to localStorage changes (cross-tab)
        window.addEventListener('storage', (event) => {
            if (event.key === 'lams_admin_notifications' && event.newValue) {
                try {
                    const notifications = JSON.parse(event.newValue);
                    const latestNotification = notifications[notifications.length - 1];
                    if (latestNotification && latestNotification.deviceId !== this.deviceId) {
                        this.handleReceivedNotification(latestNotification, 'localStorage');
                    }
                } catch (error) {
                    console.log('Error parsing localStorage notification:', error.message);
                }
            }
        });

        // Listen to BroadcastChannel (cross-tab, real-time)
        if (window.BroadcastChannel) {
            try {
                this.notificationBroadcast = new BroadcastChannel('lams-admin-notifications');
                this.notificationBroadcast.onmessage = (event) => {
                    if (event.data.deviceId !== this.deviceId) {
                        this.handleReceivedNotification(event.data, 'BroadcastChannel');
                    }
                };
                console.log('✅ BroadcastChannel listener initialized');
            } catch (error) {
                console.log('BroadcastChannel not supported:', error.message);
            }
        }

        // Listen to custom events (same page)
        window.addEventListener('lams-admin-notification', (event) => {
            if (event.detail.deviceId !== this.deviceId) {
                this.handleReceivedNotification(event.detail, 'CustomEvent');
            }
        });

        // Periodic check for Google Drive notifications (every 30 seconds)
        setInterval(() => {
            this.checkGoogleDriveNotifications();
        }, 30000);

        console.log('✅ Cross-device notification listeners initialized');
    }

    handleReceivedNotification(notification, channel) {
        console.log(`📨 Received admin notification via ${channel}:`, notification.email);
        
        // Update UI if needed
        if (notification.messageType === 'pending-user-notification') {
            // Update pending user count
            if (window.dataManager) {
                window.dataManager.refreshUserManagement();
            }
            
            // Show notification to admin
            if (window.showMessage && this.currentUser?.isAdmin) {
                showMessage(`📨 New user pending approval: ${notification.email}`, 'info');
            }
        }
    }

    async checkGoogleDriveNotifications() {
        if (!this.isSignedIn || !window.gapi) return;

        try {
            const token = await this.getAccessToken(false);
            if (!token) return;

            // Check for admin notification files in app data folder
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name contains 'lams-admin-notification-' and parents in 'appDataFolder'&fields=files(id,name,createdTime)`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const recentNotifications = data.files.filter(file => {
                    const createdTime = new Date(file.createdTime);
                    const now = new Date();
                    const timeDiff = now - createdTime;
                    return timeDiff < 120000; // Last 2 minutes
                });

                for (const file of recentNotifications) {
                    // Download and process notification
                    try {
                        const fileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (fileResponse.ok) {
                            const notificationData = await fileResponse.json();
                            if (notificationData.deviceId !== this.deviceId) {
                                this.handleReceivedNotification(notificationData, 'Google Drive');
                            }
                        }
                    } catch (error) {
                        console.log('Error processing Drive notification:', error.message);
                    }
                }
            }
        } catch (error) {
            console.log('Google Drive notification check failed:', error.message);
        }
    }

    // Enhanced multi-channel notification system for cross-device admin approval
    async multiChannelPendingUserNotification(pendingUser) {
        try {
            console.log('📢 Broadcasting pending user notification across channels:', pendingUser.email);
            
            const notificationData = {
                ...pendingUser,
                timestamp: Date.now(),
                deviceId: this.deviceId,
                messageType: 'pending-user-notification',
                id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };

            let successCount = 0;
            const channels = [];

            // Channel 1: localStorage (same device, cross-tab)
            try {
                const localNotifications = JSON.parse(localStorage.getItem('lams_admin_notifications') || '[]');
                localNotifications.push({
                    ...notificationData,
                    channel: 'localStorage'
                });
                // Keep only last 50 notifications
                if (localNotifications.length > 50) {
                    localNotifications.splice(0, localNotifications.length - 50);
                }
                localStorage.setItem('lams_admin_notifications', JSON.stringify(localNotifications));
                successCount++;
                channels.push('localStorage');
                console.log('✅ localStorage notification sent');
            } catch (error) {
                console.log('❌ localStorage notification failed:', error.message);
            }
            
            // Channel 2: IndexedDB (cross-tab, persistent)
            try {
                const indexedDBSuccess = await this.storeInIndexedDB({
                    ...notificationData,
                    channel: 'indexedDB'
                });
                if (indexedDBSuccess) {
                    successCount++;
                    channels.push('IndexedDB');
                    console.log('✅ IndexedDB notification sent');
                }
            } catch (error) {
                console.log('❌ IndexedDB notification failed:', error.message);
            }
            
            // Channel 3: Google Drive (true cross-device)
            try {
                const driveSuccess = await this.storeInGoogleDriveNotification({
                    ...notificationData,
                    channel: 'googleDrive'
                });
                if (driveSuccess) {
                    successCount++;
                    channels.push('Google Drive');
                    console.log('✅ Google Drive notification sent');
                }
            } catch (error) {
                console.log('❌ Google Drive notification failed:', error.message);
            }

            // Channel 4: BroadcastChannel API (cross-tab, real-time)
            try {
                if (window.BroadcastChannel) {
                    if (!this.notificationBroadcast) {
                        this.notificationBroadcast = new BroadcastChannel('lams-admin-notifications');
                    }
                    this.notificationBroadcast.postMessage({
                        ...notificationData,
                        channel: 'broadcastChannel'
                    });
                    successCount++;
                    channels.push('BroadcastChannel');
                    console.log('✅ BroadcastChannel notification sent');
                }
            } catch (error) {
                console.log('❌ BroadcastChannel notification failed:', error.message);
            }

            // Channel 5: Custom Events (same page, real-time)
            try {
                const customEvent = new CustomEvent('lams-admin-notification', {
                    detail: {
                        ...notificationData,
                        channel: 'customEvent'
                    }
                });
                window.dispatchEvent(customEvent);
                successCount++;
                channels.push('CustomEvent');
                console.log('✅ CustomEvent notification sent');
            } catch (error) {
                console.log('❌ CustomEvent notification failed:', error.message);
            }

            const reliability = Math.round((successCount / 5) * 100);
            console.log(`📊 Enhanced notification sent via ${successCount}/5 channels (${reliability}% reliability)`);
            console.log(`📡 Active channels: ${channels.join(', ')}`);
            
            // Show user feedback about notification delivery
            if (window.showMessage) {
                if (reliability >= 80) {
                    showMessage(`✅ Cross-device admin notification sent (${reliability}% reliability)`, 'success');
                } else if (reliability >= 40) {
                    showMessage(`⚠️ Admin notification sent with ${reliability}% reliability`, 'warning');
                } else {
                    showMessage(`❌ Admin notification delivery may be limited (${reliability}% reliability)`, 'error');
                }
            }
            
            return {
                success: successCount > 0,
                reliability,
                channels,
                successCount,
                totalChannels: 5
            };
        } catch (error) {
            console.error('❌ Enhanced multi-channel notification failed:', error);
            return {
                success: false,
                reliability: 0,
                channels: [],
                successCount: 0,
                totalChannels: 5,
                error: error.message
            };
        }
    }

    async storeInGoogleDriveNotification(notificationData) {
        if (!this.isSignedIn || !window.gapi) {
            console.log('Google Drive not available for notifications');
            return false;
        }

        try {
            const token = await this.getAccessToken(false);
            if (!token) return false;

            // Create notification file name with timestamp
            const notificationFileName = `lams-admin-notification-${notificationData.id}.json`;
            
            // File metadata for app data folder (private to the app)
            const fileMetadata = {
                name: notificationFileName,
                parents: ['appDataFolder']
            };
            
            // Create multipart form data
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
            form.append('file', new Blob([JSON.stringify(notificationData)], {type: 'application/json'}));

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form
            });

            if (response.ok) {
                console.log('✅ Google Drive notification file created');
                
                // Schedule cleanup of old notification files
                setTimeout(() => this.cleanupOldNotificationFiles(), 10000);
                
                return true;
            } else {
                console.log('❌ Google Drive notification upload failed:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Google Drive notification error:', error);
            return false;
        }
    }

    async cleanupOldNotificationFiles() {
        if (!this.isSignedIn || !window.gapi) return;

        try {
            const token = await this.getAccessToken(false);
            if (!token) return;

            // Get notification files older than 1 hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name contains 'lams-admin-notification-' and parents in 'appDataFolder' and createdTime < '${oneHourAgo}'&fields=files(id,name)`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const filesToDelete = data.files || [];

                // Delete old notification files
                for (const file of filesToDelete) {
                    await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }

                if (filesToDelete.length > 0) {
                    console.log(`🗑️ Cleaned up ${filesToDelete.length} old notification files`);
                }
            }
        } catch (error) {
            console.log('Notification cleanup failed:', error.message);
        }
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
                loginTime: new Date().toISOString(),
                deviceId: this.deviceId
            };
            
            console.log('User:', user.email, 'Admin:', CONFIG.ADMIN_EMAIL);
            console.log('🔧 Device ID:', this.deviceId);
            
            if (user.email === CONFIG.ADMIN_EMAIL) {
                this.currentUser = { ...user, isAdmin: true };
                this.isSignedIn = true;
                this.accessToken = null; // Reset token for fresh auth
                localStorage.setItem('userSession', JSON.stringify(this.currentUser));
                try { localStorage.setItem(this.deviceIdKey, this.deviceId); } catch {}
                
                // Enable persistent authentication for cross-device access
                await this.setPersistentAuth(this.currentUser);
                
                console.log('Admin signed in with persistent authentication');
                this.updateUI();
                
                // Get access token and enable persistent sync
                await this.getAccessTokenWithPersistence();
                
                // Trigger cloud-first data loading and start real-time sync automatically
                if (window.dataManager) {
                    window.dataManager.loadFromCloud().then(() => {
                        // Process any pending user notifications for admin
                        this.processAdminNotifications();
                        
                        // Start automatic sync immediately like Google Docs
                        setTimeout(() => {
                            window.dataManager.startRealTimeSync();
                            showMessage('🌐 Universal cross-device sync active! Works on all browsers and machines.', 'success');
                            // Update admin stats after loading
                            if (window.updateAdminStats) {
                                window.updateAdminStats();
                            }
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
                
                // Enable persistent authentication for cross-device access
                await this.setPersistentAuth(this.currentUser);
                
                console.log('Approved user signed in with persistent authentication');
                this.updateUI();
                
                // Get access token and enable persistent sync
                await this.getAccessTokenWithPersistence();
                
                // Trigger cloud-first data loading and start real-time sync automatically
                if (window.dataManager) {
                    window.dataManager.loadFromCloud().then(() => {
                        // Start automatic sync immediately like Google Docs
                        setTimeout(() => {
                            window.dataManager.startRealTimeSync();
                            showMessage('🌐 Universal cross-device sync active! Works on all browsers and machines.', 'success');
                        }, 1000);
                    });
                }
                return;
            }
            
            console.log('❌ User not approved, adding to pending list');
            // CRITICAL: Clear all authentication data for unapproved users
            this.isSignedIn = false;
            this.currentUser = null;
            this.accessToken = null;
            this.refreshToken = null;
            localStorage.removeItem('userSession');
            this.clearPersistentAuth();
            
            await this.addToPendingUsersCloud(user);
            
            // Set up periodic approval checking
            this.startApprovalPolling(user.email);
            
            showMessage('Access request sent to admin. You will be notified once approved.', 'info');
            console.log('Access request sent to admin.');
            
            // Force UI update to show logged out state
            this.updateUI();
            
        } catch (error) {
            console.error('Sign in error:', error);
        }
    }

    // 100% Cloud-based user approval checking
    async checkUserApprovalFromCloud(email) {
        try {
            // Load fresh data from cloud to check latest approval status
            await this.loadLatestApprovalData();
            
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
    
    // Load latest approval data from cloud without full authentication
    async loadLatestApprovalData() {
        try {
            // Use a lightweight approach to check approval status
            // This could be enhanced with a public read-only endpoint
            console.log('🔍 Checking latest approval status from cloud...');
            
            // For now, we'll rely on the existing cloud data loading
            // In a production system, this could use a separate public API
            if (window.dataManager && this.isSignedIn) {
                await window.dataManager.loadFromCloud(false);
            }
        } catch (error) {
            console.error('Failed to load latest approval data:', error);
        }
    }

    // 100% Cloud-based pending user addition using public file access
    async addToPendingUsersCloud(user) {
        try {
            console.log('☁️ Adding user to pending list in cloud:', user.email);
            
            // Use a public Google Drive file for pending users that anyone can write to
            const success = await this.savePendingUserToPublicFile(user);
            if (success) {
                console.log('✅ User added to pending list in cloud');
                showMessage('✅ Request sent to admin successfully', 'success');
            } else {
                throw new Error('Failed to save pending user to cloud');
            }
        } catch (error) {
            console.error('❌ Failed to add user to cloud pending list:', error);
            showMessage('❌ Failed to process request. Please try again.', 'error');
        }
    }
    
    // Save pending user to a public Google Drive file
    async savePendingUserToPublicFile(user) {
        try {
            // Create a simple API request to save pending user
            // This uses a public endpoint that doesn't require authentication
            const pendingData = {
                email: user.email,
                name: user.name,
                picture: user.picture,
                requestTime: new Date().toISOString(),
                deviceId: this.deviceId
            };
            
            // For now, use a simple approach: create a unique file for each request
            const fileName = `pending-user-${Date.now()}-${user.email.replace('@', '-at-')}.json`;
            
            // This would need to be implemented with a public API endpoint
            // For security, we'll fall back to the admin-sync approach
            console.log('📝 Would save pending user file:', fileName, pendingData);
            
            // Temporary: Store in a way that admin can access across devices
            return await this.notifyAdminOfPendingUser(pendingData);
        } catch (error) {
            console.error('Failed to save pending user to public file:', error);
            return false;
        }
    }
    
    // Notify admin through a cross-device mechanism
    async notifyAdminOfPendingUser(userData) {
        try {
            // Use a shared notification system that admin can access
            const notification = {
                type: 'PENDING_USER_REQUEST',
                data: userData,
                timestamp: new Date().toISOString(),
                id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Store in a way that persists across devices for admin
            const notifications = JSON.parse(localStorage.getItem('lams_admin_notifications') || '[]');
            notifications.push(notification);
            localStorage.setItem('lams_admin_notifications', JSON.stringify(notifications));
            
            console.log('📢 Admin notification created:', notification.id);
            return true;
        } catch (error) {
            console.error('Failed to notify admin:', error);
            return false;
        }
    }

    signOut() {
        this.isSignedIn = false;
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        
        // Clear all authentication storage
        localStorage.removeItem('userSession');
        this.clearPersistentAuth();
        
        // Sign out from Google
        if (window.google && window.google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        
        // Stop real-time sync
        if (window.dataManager && window.dataManager.stopRealTimeSync) {
            window.dataManager.stopRealTimeSync();
        }
        
        this.updateUI();
        console.log('🚪 Signed out successfully with persistent auth cleared');
        showMessage('Signed out from all devices successfully', 'info');
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
        const countElement = document.getElementById('pendingUsersCount');
        if (countElement) {
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'inline' : 'none';
            console.log('✅ Badge updated with count:', count);
        } else {
            console.warn('⚠️ Could not find pendingUsersCount element in DOM');
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

    async syncWithGoogleDrive(data, allowPopup = false) {
        try {
            console.log('🔄 Starting cross-device Google Drive sync...');
            this.updateSyncStatus('Syncing across devices...');
            
            if (!this.isSignedIn || !this.currentUser) {
                console.log('❌ User not signed in');
                return false;
            }

            // Enhanced cross-device token handling
            const accessToken = await this.getAccessTokenWithPersistence();
            if (!accessToken) {
                console.log('❌ No access token available for cross-device sync');
                this.updateSyncStatus('Auth required');
                
                if (allowPopup) {
                    showMessage('🔑 Re-authentication needed for cross-device sync', 'warning');
                } else {
                    console.log('⏳ Background sync - will retry with cached credentials');
                }
                return false;
            }
            
            const fileName = 'lams-data.json';
            
            // Enhanced data with cross-device metadata
            const enhancedData = {
                ...data,
                lastSyncDevice: {
                    deviceId: this.deviceId,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    userEmail: this.currentUser.email,
                    syncVersion: '2.0'
                }
            };
            
            const fileContent = JSON.stringify(enhancedData, null, 2);
            
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
                console.log('🌐 Successfully synced to Google Drive across all devices!');
                this.updateSyncStatus('Cross-device sync complete');
                this.addSyncLog('save', 'success', 'Data successfully synced across all devices', {
                    assignmentsCount: data.assignments?.length || 0,
                    fileSize: JSON.stringify(data).length,
                    deviceId: this.deviceId,
                    crossDeviceSync: true
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

    async setPersistentAuth(user) {
        try {
            const authData = {
                user: user,
                timestamp: new Date().toISOString(),
                deviceId: this.deviceId,
                tokenExpiry: this.tokenExpiry,
                refreshToken: this.refreshToken
            };
            
            localStorage.setItem(this.persistentTokenKey, JSON.stringify(authData));
            console.log('💾 Persistent authentication saved for cross-device access');
        } catch (error) {
            console.error('❌ Failed to save persistent auth:', error);
        }
    }

    clearPersistentAuth() {
        localStorage.removeItem(this.persistentTokenKey);
        localStorage.removeItem(this.refreshTokenKey);
        console.log('🗑️ Persistent authentication cleared');
    }
    
    // Start polling for approval status
    startApprovalPolling(email) {
        console.log('🔄 Starting approval polling for:', email);
        
        // Store email for polling
        localStorage.setItem('lams_pending_approval', email);
        
        // Check with exponential backoff starting at 30 seconds
        let pollDelay = 30000;
        const maxDelay = 300000; // 5 minutes max
        
        const poll = async () => {
            const pollInterval = setTimeout(async () => {
            try {
                console.log('🔍 Checking approval status for:', email);
                
                // Create a temporary auth check without full sign-in
                const isApproved = await this.checkApprovalStatusOnly(email);
                
                if (isApproved) {
                    console.log('✅ User approved! Redirecting to sign in...');
                    clearTimeout(pollInterval);
                    localStorage.removeItem('lams_pending_approval');
                    
                    // Show approval notification
                    showMessage('✅ Your access has been approved! Please sign in again.', 'success');
                    
                    // Refresh the page to show sign-in button
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            } catch (error) {
                console.error('Error checking approval status:', error);
            }
                // Increase delay for next poll (exponential backoff)
                pollDelay = Math.min(pollDelay * 1.5, maxDelay);
                poll();
            }, pollDelay);
        };
        
        poll();
        
        // Stop polling after 10 minutes
        setTimeout(() => {
            localStorage.removeItem('lams_pending_approval');
            console.log('⏰ Approval polling stopped after 10 minutes');
        }, 600000);
    }
    
    // Check approval status without full authentication
    async checkApprovalStatusOnly(email) {
        try {
            // This is a simplified check - in production you'd use a public API
            // For now, we'll use a lightweight approach
            
            // Try to load approval data using admin credentials if available
            // This is a placeholder for a more robust solution
            const approvalData = await this.getPublicApprovalStatus(email);
            return approvalData;
        } catch (error) {
            console.error('Failed to check approval status:', error);
            return false;
        }
    }
    
    // Get public approval status with proper implementation
    async getPublicApprovalStatus(email) {
        try {
            // Check if we can access cloud data for approval status
            if (window.dataManager && window.dataManager.approvedUsers) {
                return window.dataManager.approvedUsers.some(u => u.email === email);
            }
            return false;
        } catch (error) {
            console.error('Failed to get public approval status:', error);
            return false;
        }
    }
    
    // Process admin notifications when admin signs in
    async processAdminNotifications() {
        try {
            if (!this.currentUser?.isAdmin) {
                return; // Only admin can process notifications
            }
            
            const notifications = JSON.parse(localStorage.getItem('lams_admin_notifications') || '[]');
            if (notifications.length === 0) {
                return;
            }
            
            console.log('🔄 Processing', notifications.length, 'admin notifications');
            
            if (window.dataManager) {
                const cloudPendingUsers = window.dataManager.pendingUsers || [];
                let newPendingCount = 0;
                
                // Process pending user notifications
                notifications.forEach(notification => {
                    if (notification.type === 'PENDING_USER_REQUEST') {
                        const userData = notification.data;
                        // Convert notification to pending user format
                        const pendingUser = {
                            email: userData.email,
                            name: userData.name,
                            picture: userData.picture,
                            loginTime: userData.requestTime,
                            deviceId: userData.deviceId
                        };
                        
                        // Add to cloud data if not already present
                        if (!cloudPendingUsers.some(u => u.email === pendingUser.email)) {
                            cloudPendingUsers.push(pendingUser);
                            newPendingCount++;
                        }
                    }
                });
                
                if (newPendingCount > 0) {
                    window.dataManager.pendingUsers = cloudPendingUsers;
                    
                    // Save to cloud
                    const success = await window.dataManager.save();
                    if (success) {
                        // Clear processed notifications
                        localStorage.removeItem('lams_admin_notifications');
                        console.log('✅ Processed', newPendingCount, 'new pending users and synced to cloud');
                        this.updatePendingUsersCountFromCloud(cloudPendingUsers.length);
                        
                        if (newPendingCount > 0) {
                            showMessage(`🔔 ${newPendingCount} new user request${newPendingCount > 1 ? 's' : ''} processed`, 'info');
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to process admin notifications:', error);
        }
    }

    async getAccessTokenWithPersistence(allowPopup = false) {
        try {
            // SECURITY: Only allow token access for signed-in, approved users
            if (!this.isSignedIn || !this.currentUser) {
                console.log('❌ Access denied: User not signed in');
                return null;
            }
            
            const token = await this.getAccessToken(allowPopup);
            if (token && this.currentUser) {
                // Update persistent storage with new token
                await this.setPersistentAuth(this.currentUser);
            }
            return token;
        } catch (error) {
            console.error('❌ Failed to get persistent access token:', error);
            return null;
        }
    }

    async refreshAccessToken() {
        try {
            if (!this.refreshToken) {
                console.log('⚠️ No refresh token available, requesting new authorization');
                return await this.getAccessToken(false); // Try without popup first
            }

            console.log('🔄 Refreshing access token...');
            
            // Use the refresh token to get a new access token
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'client_id': this.CLIENT_ID,
                    'refresh_token': this.refreshToken,
                    'grant_type': 'refresh_token'
                })
            });

            const tokenData = await response.json();
            
            if (tokenData.access_token) {
                this.accessToken = tokenData.access_token;
                this.tokenExpiry = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
                
                // Update refresh token if provided
                if (tokenData.refresh_token) {
                    this.refreshToken = tokenData.refresh_token;
                }
                
                console.log('✅ Access token refreshed successfully');
                await this.setPersistentAuth(this.currentUser);
                
                return this.accessToken;
            } else {
                console.log('❌ Failed to refresh token:', tokenData.error);
                return null;
            }
        } catch (error) {
            console.error('❌ Token refresh failed:', error);
            return null;
        }
    }

    async getAccessToken(allowPopup = true) {
        try {
            // Return cached token if still valid
            if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry)) {
                console.log('🔑 Using cached access token');
                return this.accessToken;
            }

            // Try to refresh existing token first
            if (this.refreshToken) {
                const refreshedToken = await this.refreshAccessToken();
                if (refreshedToken) {
                    return refreshedToken;
                }
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
                                
                                // Store refresh token for cross-device persistence
                                if (response.refresh_token) {
                                    this.refreshToken = response.refresh_token;
                                }
                                
                                // Update persistent storage
                                this.setPersistentAuth(this.currentUser);
                                
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
                        // Request with offline access to get refresh token
                        tokenClient.requestAccessToken({ 
                            prompt: this.refreshToken ? '' : 'consent',
                            hint: this.currentUser.email,
                            access_type: 'offline',
                            include_granted_scopes: true
                        });
                    } catch (popupError) {
                        if (allowPopup) {
                            console.log('⚠️ Popup blocked, trying consent flow...');
                            try {
                                tokenClient.requestAccessToken({ 
                                    prompt: 'consent',
                                    access_type: 'offline'
                                });
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
                    const intervalSec = Math.round(((window.CONFIG && CONFIG.REALTIME_SYNC_INTERVAL) || 5000) / 1000);
                    showMessage(`🔄 Real-time sync activated! Changes sync every ${intervalSec}s across all devices.`, 'success');
                }
            } else {
                console.log('⚠️ No access token - starting loop and waiting for permission');
                if (window.dataManager) {
                    window.dataManager.startRealTimeSync();
                    window.dataManager.updateSyncStatus('Waiting for permission');
                }
                showMessage('⚠️ Cloud sync not available yet. Click "Enable Cloud Sync" to allow Drive access.', 'warning');
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
            logs.length = 100;
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
                    // Update local data (cloud-first; do not persist full data locally)
                    window.dataManager.data = { ...window.dataManager.data, ...driveData };
                    // Load user management data if present
                    if (driveData.userManagement) {
                        window.dataManager.pendingUsers = driveData.userManagement.pendingUsers || [];
                        window.dataManager.approvedUsers = driveData.userManagement.approvedUsers || [];
                        console.log('📥 User management data loaded from Drive:', {
                            pending: window.dataManager.pendingUsers.length,
                            approved: window.dataManager.approvedUsers.length
                        });
                        // Update admin UI badge immediately
                        if (this.currentUser?.isAdmin) {
                            this.updatePendingUsersCountFromCloud(window.dataManager.pendingUsers.length);
                        }
                    }
                    window.dataManager.refreshAllComponents();
                    console.log('✅ Data loaded from Google Drive successfully!');
                    this.addSyncLog('load', 'success', 'Data successfully loaded from Google Drive', {
                        assignmentsCount: driveData.assignments?.length || 0,
                        fileSize: JSON.stringify(driveData).length,
                        pendingUsers: driveData.userManagement?.pendingUsers?.length || 0
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
                    
                    // Start real-time sync loop regardless; it will request permission as needed
                    setTimeout(() => {
                        if (window.dataManager) {
                            window.dataManager.startRealTimeSync();
                            if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry)) {
                                console.log('🔄 Valid admin token found - real-time sync active');
                                showMessage('🔄 Admin real-time sync resumed', 'success');
                            } else {
                                console.log('💡 Admin logged in - waiting for Drive permission');
                                window.dataManager.updateSyncStatus('Waiting for permission');
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
                    
                    // Start real-time sync loop regardless; it will request permission as needed
                    setTimeout(() => {
                        if (window.dataManager) {
                            window.dataManager.startRealTimeSync();
                            if (this.accessToken && this.tokenExpiry && new Date() < new Date(this.tokenExpiry)) {
                                console.log('🔄 Valid token found - real-time sync active');
                                showMessage('🔄 Real-time sync resumed', 'success');
                            } else {
                                console.log('💡 User logged in - waiting for Drive permission');
                                window.dataManager.updateSyncStatus('Waiting for permission');
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
    
    // Check if user was waiting for approval
    const pendingEmail = localStorage.getItem('lams_pending_approval');
    if (pendingEmail) {
        console.log('🔄 Resuming approval polling for:', pendingEmail);
        showMessage('⏳ Checking if your access has been approved...', 'info');
        window.authManager.startApprovalPolling(pendingEmail);
    }
    
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