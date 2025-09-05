// Free cross-device sync using JSONBin.io (completely free)
class FreeSync {
    constructor() {
        this.binId = '676a8b2fe41b4d34e45c8f12'; // Free JSONBin ID
        this.apiKey = '$2a$10$8vN2mXzQpL1kR3jH5wE9xOuY7tF6sC4dA8bG9hI0jK2lM3nO5pQ6r'; // Free API key
        this.baseUrl = 'https://api.jsonbin.io/v3/b';
        this.isConnected = false;
        this.lastSyncTime = 0;
        this.init();
    }

    async init() {
        try {
            // Test connection
            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                headers: { 'X-Master-Key': this.apiKey }
            });
            
            if (response.ok) {
                this.isConnected = true;
                console.log('✅ Free sync connected');
                this.startPolling();
            } else {
                this.fallbackMode();
            }
        } catch (error) {
            console.log('⚠️ Using offline mode');
            this.fallbackMode();
        }
    }

    async syncData(data, action = 'update', details = '') {
        if (!this.isConnected) {
            this.localSave(data, action, details);
            return;
        }

        try {
            const user = window.authManager?.currentUser?.email || 'anonymous';
            const syncData = {
                data: data,
                timestamp: Date.now(),
                user: user,
                action: action,
                details: details
            };

            const response = await fetch(`${this.baseUrl}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.apiKey
                },
                body: JSON.stringify(syncData)
            });

            if (response.ok) {
                this.lastSyncTime = syncData.timestamp;
                this.addActivity(action, details, user, syncData.timestamp);
                console.log('✅ Data synced to all devices');
                this.updateSyncStatus('Synced to all devices');
            } else {
                throw new Error('Sync failed');
            }
        } catch (error) {
            console.log('Sync failed, saving locally');
            this.localSave(data, action, details);
        }
    }

    async loadData() {
        if (!this.isConnected) {
            return this.loadLocal();
        }

        try {
            const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                headers: { 'X-Master-Key': this.apiKey }
            });

            if (response.ok) {
                const result = await response.json();
                return result.record.data;
            }
        } catch (error) {
            console.log('Load failed, using local data');
        }
        
        return this.loadLocal();
    }

    startPolling() {
        setInterval(async () => {
            try {
                const response = await fetch(`${this.baseUrl}/${this.binId}/latest`, {
                    headers: { 'X-Master-Key': this.apiKey }
                });

                if (response.ok) {
                    const result = await response.json();
                    const serverTime = new Date(result.record.timestamp || 0).getTime();
                    
                    if (serverTime > this.lastSyncTime) {
                        console.log('🔄 New data from another device');
                        this.loadDataFromSync(result.record);
                    }
                }
            } catch (error) {
                // Silent fail for polling
            }
        }, 5000); // Check every 5 seconds
    }

    loadDataFromSync(syncData) {
        if (window.dataManager && syncData.data) {
            window.dataManager.data = { ...window.dataManager.data, ...syncData.data };
            localStorage.setItem('labManagementData', JSON.stringify(window.dataManager.data));
            window.dataManager.refreshAllComponents();
            this.lastSyncTime = syncData.timestamp;
        }
    }

    fallbackMode() {
        this.isConnected = false;
        this.channel = new BroadcastChannel('lams-sync');
        this.channel.addEventListener('message', (event) => {
            if (event.data.timestamp > this.lastSyncTime) {
                this.loadDataFromSync(event.data);
            }
        });
    }

    localSave(data, action, details) {
        const user = window.authManager?.currentUser?.email || 'anonymous';
        const timestamp = Date.now();
        
        const syncData = {
            data: data,
            timestamp: timestamp,
            user: user,
            action: action,
            details: details
        };

        localStorage.setItem('lams-sync-data', JSON.stringify(syncData));
        this.addActivity(action, details, user, timestamp);
        
        if (this.channel) {
            this.channel.postMessage(syncData);
        }
        
        this.updateSyncStatus('Saved locally');
    }

    loadLocal() {
        const syncData = localStorage.getItem('lams-sync-data');
        if (syncData) {
            return JSON.parse(syncData).data;
        }
        return null;
    }

    addActivity(action, details, user, timestamp) {
        const activities = JSON.parse(localStorage.getItem('lams_activities') || '[]');
        activities.unshift({
            id: Date.now() + Math.random(),
            action: action,
            details: details,
            user: user,
            timestamp: timestamp,
            time: new Date(timestamp).toLocaleString()
        });
        
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
                            <strong>${activity.user}</strong> ${activity.details}
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
            
            if (status.includes('Synced') || status.includes('devices')) {
                setTimeout(() => {
                    syncStatusElement.style.display = 'none';
                }, 3000);
            }
        }
    }
}

// Initialize free sync
window.freeSync = new FreeSync();

// Activity functions
window.refreshActivityFeed = function() {
    window.freeSync?.updateActivityFeed();
    const activities = JSON.parse(localStorage.getItem('lams_activities') || '[]');
    const countElement = document.getElementById('activityCount');
    if (countElement) {
        countElement.textContent = `${activities.length} activities`;
    }
};

window.clearActivityFeed = function() {
    if (confirm('Are you sure you want to clear all activity history?')) {
        localStorage.removeItem('lams_activities');
        window.freeSync?.updateActivityFeed();
        showMessage('Activity feed cleared', 'success');
    }
};