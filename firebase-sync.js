// Firebase Real-time Cross-Device Sync System
class FirebaseSync {
    constructor() {
        this.db = null;
        this.dbRef = null;
        this.isConnected = false;
        this.lastSyncTime = 0;
        this.initFirebase();
    }

    async initFirebase() {
        try {
            // Import Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getDatabase, ref, set, get, onValue, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            // Firebase config for LAMS
            const firebaseConfig = {
                apiKey: "AIzaSyBxrTxVOKb9nIJJGy52GjSqhfbYixoqDVE",
                authDomain: "lams-sync-db.firebaseapp.com",
                databaseURL: "https://lams-sync-db-default-rtdb.firebaseio.com/",
                projectId: "lams-sync-db",
                storageBucket: "lams-sync-db.appspot.com",
                messagingSenderId: "485361990614",
                appId: "1:485361990614:web:74vhnb9vqjulp17gno3janj"
            };

            const app = initializeApp(firebaseConfig);
            this.db = getDatabase(app);
            this.dbRef = ref(this.db, 'lams-data');
            
            // Store Firebase functions
            this.set = set;
            this.get = get;
            this.onValue = onValue;
            this.serverTimestamp = serverTimestamp;
            this.ref = ref;
            
            this.setupRealtimeListener();
            this.isConnected = true;
            console.log('🔥 Firebase sync initialized successfully');
            this.updateSyncStatus('Connected to Firebase');
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            this.fallbackToLocalSync();
        }
    }

    setupRealtimeListener() {
        if (!this.dbRef || !this.onValue) return;
        
        this.onValue(this.dbRef, (snapshot) => {
            const data = snapshot.val();
            if (data && data.timestamp > this.lastSyncTime) {
                console.log('🔄 Received real-time update from Firebase');
                this.loadDataFromFirebase(data);
            }
        });
    }

    async saveToFirebase(data, action = 'update', details = '') {
        if (!this.isConnected || !this.set || !this.dbRef) {
            this.fallbackSave(data, action, details);
            return;
        }

        try {
            const user = window.authManager?.currentUser?.email || 'anonymous';
            const userName = window.authManager?.currentUser?.name || user;
            const timestamp = Date.now();
            
            const syncData = {
                data: data,
                timestamp: timestamp,
                user: user,
                userName: userName,
                action: action,
                details: details,
                serverTime: this.serverTimestamp()
            };

            await this.set(this.dbRef, syncData);
            this.lastSyncTime = timestamp;
            
            // Also save locally as backup
            localStorage.setItem('lams-firebase-backup', JSON.stringify(syncData));
            
            // Add to activity log
            this.addActivity(action, details, user, userName, timestamp);
            
            console.log('✅ Data synced to Firebase successfully');
            this.updateSyncStatus('Synced to Cloud');
            
        } catch (error) {
            console.error('❌ Firebase save failed:', error);
            this.fallbackSave(data, action, details);
        }
    }

    async loadFromFirebase() {
        if (!this.isConnected || !this.get || !this.dbRef) {
            return this.loadFromLocal();
        }

        try {
            const snapshot = await this.get(this.dbRef);
            if (snapshot.exists()) {
                const syncData = snapshot.val();
                this.loadDataFromFirebase(syncData);
                return syncData.data;
            }
        } catch (error) {
            console.error('❌ Firebase load failed:', error);
            return this.loadFromLocal();
        }
    }

    loadDataFromFirebase(syncData) {
        if (window.dataManager && syncData.data) {
            window.dataManager.data = { ...window.dataManager.data, ...syncData.data };
            localStorage.setItem('labManagementData', JSON.stringify(window.dataManager.data));
            window.dataManager.refreshAllComponents();
            this.lastSyncTime = syncData.timestamp;
        }
    }

    // Fallback methods for when Firebase is unavailable
    fallbackToLocalSync() {
        console.log('🔄 Falling back to localStorage sync');
        this.isConnected = false;
        this.updateSyncStatus('Offline Mode');
        
        // Use BroadcastChannel for tab sync
        this.channel = new BroadcastChannel('lams-sync');
        this.channel.addEventListener('message', (event) => {
            if (event.data.type === 'data-update' && event.data.timestamp > this.lastSyncTime) {
                this.loadDataFromLocal(event.data.data);
            }
        });
    }

    fallbackSave(data, action, details) {
        const user = window.authManager?.currentUser?.email || 'anonymous';
        const userName = window.authManager?.currentUser?.name || user;
        const timestamp = Date.now();
        
        const syncData = {
            data: data,
            timestamp: timestamp,
            user: user,
            userName: userName,
            action: action,
            details: details
        };

        localStorage.setItem('lams-local-sync', JSON.stringify(syncData));
        this.addActivity(action, details, user, userName, timestamp);
        
        // Broadcast to other tabs
        if (this.channel) {
            this.channel.postMessage({
                type: 'data-update',
                data: data,
                timestamp: timestamp
            });
        }
        
        console.log('✅ Data saved locally (offline mode)');
        this.updateSyncStatus('Saved Locally');
    }

    loadFromLocal() {
        const syncData = localStorage.getItem('lams-firebase-backup') || localStorage.getItem('lams-local-sync');
        if (syncData) {
            const parsed = JSON.parse(syncData);
            return parsed.data;
        }
        return null;
    }

    loadDataFromLocal(data) {
        if (window.dataManager) {
            window.dataManager.data = { ...window.dataManager.data, ...data };
            localStorage.setItem('labManagementData', JSON.stringify(window.dataManager.data));
            window.dataManager.refreshAllComponents();
        }
    }

    addActivity(action, details, user, userName, timestamp) {
        const activities = JSON.parse(localStorage.getItem('lams_activities') || '[]');
        const activity = {
            id: Date.now() + Math.random(),
            action: action,
            details: details,
            user: user,
            userName: userName,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleString()
        };
        
        activities.unshift(activity);
        if (activities.length > 100) activities.splice(100);
        
        localStorage.setItem('lams_activities', JSON.stringify(activities));
        this.updateActivityFeed();
    }

    updateActivityFeed() {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;
        
        const activities = JSON.parse(localStorage.getItem('lams_activities') || '[]');
        
        if (activities.length === 0) {
            activityFeed.innerHTML = '<p class="empty-state">No recent activities.</p>';
            return;
        }
        
        activityFeed.innerHTML = activities.slice(0, 20).map(activity => {
            const actionIcon = {
                'create': '➕', 'delete': '🗑️', 'edit': '✏️', 'update': '🔄'
            }[activity.action] || '📝';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${actionIcon}</div>
                    <div class="activity-content">
                        <div class="activity-text">
                            <strong>${activity.userName}</strong> ${activity.details}
                        </div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('syncStatus');
        const syncStatusText = document.getElementById('syncStatusText');
        if (syncStatusElement && syncStatusText) {
            syncStatusElement.style.display = 'flex';
            syncStatusText.textContent = status;
            
            if (status.includes('Synced') || status.includes('Connected')) {
                setTimeout(() => {
                    syncStatusElement.style.display = 'none';
                }, 3000);
            }
        }
    }

    // Public methods for DataManager integration
    async syncData(data, action = 'update', details = '') {
        if (this.isConnected) {
            await this.saveToFirebase(data, action, details);
        } else {
            this.fallbackSave(data, action, details);
        }
    }

    async loadData() {
        if (this.isConnected) {
            return await this.loadFromFirebase();
        } else {
            return this.loadFromLocal();
        }
    }
}

// Initialize Firebase sync
window.firebaseSync = new FirebaseSync();

// Enhanced activity functions
window.refreshActivityFeed = function() {
    window.firebaseSync?.updateActivityFeed();
    const activities = JSON.parse(localStorage.getItem('lams_activities') || '[]');
    const countElement = document.getElementById('activityCount');
    if (countElement) {
        countElement.textContent = `${activities.length} activities`;
    }
};

window.clearActivityFeed = function() {
    if (confirm('Are you sure you want to clear all activity history?')) {
        localStorage.removeItem('lams_activities');
        window.firebaseSync?.updateActivityFeed();
        showMessage('Activity feed cleared', 'success');
    }
};