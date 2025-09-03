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

    async signIn(credential) {
        console.log('Processing sign-in credential...');
        try {
            const payload = JSON.parse(atob(credential.split('.')[1]));
            console.log('User payload:', { email: payload.email, name: payload.name });
            
            const user = {
                id: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                loginTime: new Date().toISOString()
            };
            
            console.log('Checking admin status for:', user.email);
            console.log('Admin email configured as:', CONFIG.ADMIN_EMAIL);
            
            // Check if admin
            if (user.email === CONFIG.ADMIN_EMAIL) {
                console.log('Admin login detected');
                this.currentUser = { ...user, isAdmin: true };
                this.isSignedIn = true;
                localStorage.setItem('userSession', JSON.stringify(this.currentUser));
                this.updateUI();
                console.log(`Welcome Admin ${user.name}!`);
                return;
            }
            
            // Check if user is approved
            const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
            const isApproved = approvedUsers.some(u => u.email === user.email);
            console.log('User approved status:', isApproved);
            
            if (isApproved) {
                console.log('Approved user login');
                this.currentUser = { ...user, isAdmin: false };
                this.isSignedIn = true;
                localStorage.setItem('userSession', JSON.stringify(this.currentUser));
                this.updateUI();
                console.log(`Welcome ${user.name}!`);
                return;
            }
            
            // Add to pending users for admin approval
            console.log('Adding user to pending list');
            this.addToPendingUsers(user);
            alert('Access request sent to admin. Please wait for approval.');
            
        } catch (error) {
            console.error('Sign in failed:', error);
            alert('Sign in failed. Please try again.');
        }
    }
    
    addToPendingUsers(user) {
        const pendingUsers = JSON.parse(localStorage.getItem(CONFIG.PENDING_USERS_KEY) || '[]');
        
        // Check if already pending
        if (pendingUsers.some(u => u.email === user.email)) {
            return;
        }
        
        // Sanitize user data
        const sanitizedUser = {
            id: securityManager.sanitizeInput(user.id),
            name: securityManager.sanitizeInput(user.name),
            email: securityManager.sanitizeInput(user.email),
            picture: user.picture,
            loginTime: user.loginTime
        };
        
        pendingUsers.push(sanitizedUser);
        const data = securityManager.obfuscate(pendingUsers);
        localStorage.setItem(CONFIG.PENDING_USERS_KEY, JSON.stringify(data));
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

        if (this.isSignedIn) {
            loginSection.style.display = 'none';
            userInfo.style.display = 'flex';
            mainNav.style.display = 'flex';
            
            const userName = document.getElementById('user-name');
            userName.textContent = this.currentUser.name;
            if (this.currentUser.isAdmin) {
                userName.textContent += ' (Admin)';
                userName.style.color = 'var(--color-primary)';
            }
            
            document.getElementById('user-avatar').src = this.currentUser.picture;
            
            // Show/hide admin features
            this.toggleAdminFeatures(this.currentUser.isAdmin);
            
            // Show dashboard by default
            showTab('dashboard');
        } else {
            loginSection.style.display = 'block';
            userInfo.style.display = 'none';
            mainNav.style.display = 'none';
            
            // Hide all tab contents
            tabContents.forEach(tab => tab.classList.remove('active'));
        }
        
        // Initialize Google Sign-In button
        this.initializeSignInButton();
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
        const pendingData = localStorage.getItem(CONFIG.PENDING_USERS_KEY);
        const pendingUsers = pendingData ? securityManager.deobfuscate(JSON.parse(pendingData)) : [];
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
        if (!this.isSignedIn) return false;

        try {
            const fileName = `lab-schedule-${new Date().toISOString().split('T')[0]}.json`;
            
            const response = await gapi.client.drive.files.create({
                resource: {
                    name: fileName,
                    parents: ['appDataFolder']
                },
                media: {
                    mimeType: 'application/json',
                    body: JSON.stringify(data, null, 2)
                }
            });

            if (response.status === 200) {
                showMessage('Data synced to Google Drive successfully!', 'success');
                return true;
            }
        } catch (error) {
            console.error('Drive save failed:', error);
            showMessage('Failed to sync with Google Drive', 'error');
        }
        return false;
    }

    async loadFromDrive() {
        if (!this.isSignedIn) return null;

        try {
            const response = await gapi.client.drive.files.list({
                q: "parents in 'appDataFolder' and name contains 'lab-schedule'",
                orderBy: 'modifiedTime desc',
                pageSize: 1
            });

            if (response.result.files && response.result.files.length > 0) {
                const fileId = response.result.files[0].id;
                const fileResponse = await gapi.client.drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                });

                const data = JSON.parse(fileResponse.body);
                if (dataManager) {
                    dataManager.data = { ...dataManager.data, ...data };
                    dataManager.save();
                    dataManager.refreshAllComponents();
                    showMessage('Data loaded from Google Drive', 'success');
                }
                return data;
            }
        } catch (error) {
            console.error('Drive load failed:', error);
        }
        return null;
    }

    checkExistingSession() {
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
            try {
                this.currentUser = JSON.parse(savedSession);
                
                // Check session timeout
                if (!securityManager.isSessionValid(this.currentUser.loginTime)) {
                    localStorage.removeItem('userSession');
                    alert('Session expired. Please sign in again.');
                    return;
                }
                
                // Admin always has access
                if (this.currentUser.email === CONFIG.ADMIN_EMAIL) {
                    this.currentUser.isAdmin = true;
                    this.isSignedIn = true;
                    this.updateUI();
                    return;
                }
                
                // Check if regular user is still approved
                const approvedData = localStorage.getItem(CONFIG.APPROVED_USERS_KEY);
                const approvedUsers = approvedData ? securityManager.deobfuscate(JSON.parse(approvedData)) : [];
                const isStillApproved = approvedUsers.some(u => u.email === this.currentUser.email);
                
                if (isStillApproved) {
                    this.currentUser.isAdmin = false;
                    this.isSignedIn = true;
                    this.updateUI();
                } else {
                    localStorage.removeItem('userSession');
                    alert('Access revoked by admin. Please contact administrator.');
                }
            } catch (error) {
                localStorage.removeItem('userSession');
            }
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

// Make signOut globally available
window.signOut = signOut;

// Sync with Google Drive
async function syncWithDrive() {
    if (authManager && dataManager) {
        await authManager.saveToGoogleDrive(dataManager.data);
    }
}

// User Management Functions
function approveUser(email) {
    const pendingData = localStorage.getItem(CONFIG.PENDING_USERS_KEY);
    const approvedData = localStorage.getItem(CONFIG.APPROVED_USERS_KEY);
    
    const pendingUsers = pendingData ? securityManager.deobfuscate(JSON.parse(pendingData)) : [];
    const approvedUsers = approvedData ? securityManager.deobfuscate(JSON.parse(approvedData)) : [];
    
    const userIndex = pendingUsers.findIndex(u => u.email === email);
    if (userIndex > -1) {
        const user = pendingUsers[userIndex];
        approvedUsers.push({ ...user, approvedAt: new Date().toISOString() });
        pendingUsers.splice(userIndex, 1);
        
        localStorage.setItem(CONFIG.PENDING_USERS_KEY, JSON.stringify(securityManager.obfuscate(pendingUsers)));
        localStorage.setItem(CONFIG.APPROVED_USERS_KEY, JSON.stringify(securityManager.obfuscate(approvedUsers)));
        
        authManager.updatePendingUsersCount();
        console.log(`Approved ${user.name}`);
    }
}

function rejectUser(email) {
    const pendingData = localStorage.getItem(CONFIG.PENDING_USERS_KEY);
    const pendingUsers = pendingData ? securityManager.deobfuscate(JSON.parse(pendingData)) : [];
    const userIndex = pendingUsers.findIndex(u => u.email === email);
    
    if (userIndex > -1) {
        const user = pendingUsers[userIndex];
        pendingUsers.splice(userIndex, 1);
        localStorage.setItem(CONFIG.PENDING_USERS_KEY, JSON.stringify(securityManager.obfuscate(pendingUsers)));
        
        authManager.updatePendingUsersCount();
        console.log(`Rejected ${user.name}`);
    }
}

function removeApprovedUser(email) {
    const approvedData = localStorage.getItem(CONFIG.APPROVED_USERS_KEY);
    const approvedUsers = approvedData ? securityManager.deobfuscate(JSON.parse(approvedData)) : [];
    const userIndex = approvedUsers.findIndex(u => u.email === email);
    
    if (userIndex > -1) {
        const user = approvedUsers[userIndex];
        approvedUsers.splice(userIndex, 1);
        localStorage.setItem(CONFIG.APPROVED_USERS_KEY, JSON.stringify(securityManager.obfuscate(approvedUsers)));
        console.log(`Removed ${user.name}`);
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG not loaded');
        return;
    }
    
    window.authManager = new AuthManager();
    authManager.checkExistingSession();
    
    // Wait for Google library
    const initGoogle = () => {
        if (window.google?.accounts) {
            authManager.initializeSignInButton();
        } else {
            setTimeout(initGoogle, 500);
        }
    };
    initGoogle();
});



// Export functions
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.removeApprovedUser = removeApprovedUser;