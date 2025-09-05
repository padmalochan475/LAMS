// Real-time sync system using localStorage and BroadcastChannel
class RealtimeSync {
    constructor() {
        this.channel = new BroadcastChannel('lams-sync');
        this.syncKey = 'lams-realtime-data';
        this.lastSyncTime = 0;
        this.setupListeners();
    }

    setupListeners() {
        // Listen for changes from other tabs/windows
        this.channel.addEventListener('message', (event) => {
            if (event.data.type === 'data-update' && event.data.timestamp > this.lastSyncTime) {
                console.log('📡 Received real-time update from another tab');
                this.loadDataFromSync(event.data.data);
            }
        });

        // Listen for storage changes from other devices (same browser)
        window.addEventListener('storage', (event) => {
            if (event.key === this.syncKey && event.newValue) {
                console.log('📡 Received update from another device');
                const syncData = JSON.parse(event.newValue);
                if (syncData.timestamp > this.lastSyncTime) {
                    this.loadDataFromSync(syncData.data);
                }
            }
        });
    }

    // Save data and broadcast to all tabs/devices
    saveData(data, action = 'update', details = '') {
        const timestamp = Date.now();
        const user = window.authManager?.currentUser?.email || 'unknown';
        const userName = window.authManager?.currentUser?.name || user;
        
        const syncData = {
            data: data,
            timestamp: timestamp,
            user: user,
            userName: userName,
            action: action,
            details: details
        };

        // Save to localStorage for cross-device sync
        localStorage.setItem(this.syncKey, JSON.stringify(syncData));
        
        // Add to activity log
        this.addActivity(action, details, user, userName, timestamp);
        
        // Broadcast to other tabs immediately
        this.channel.postMessage({
            type: 'data-update',
            data: data,
            timestamp: timestamp,
            user: user,
            userName: userName,
            action: action,
            details: details
        });

        this.lastSyncTime = timestamp;
        console.log('✅ Data synced across all tabs and devices');
        
        // Show sync status
        this.updateSyncStatus('Synced');
    }

    // Add activity to log
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
        
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }
        
        localStorage.setItem('lams_activities', JSON.stringify(activities));
        
        // Update activity feed if visible
        this.updateActivityFeed();
    }

    // Update activity feed display
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
                'create': '➕',
                'delete': '🗑️',
                'edit': '✏️',
                'update': '🔄'
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

    // Load data from sync
    loadDataFromSync(data) {
        if (window.dataManager) {
            window.dataManager.data = { ...window.dataManager.data, ...data };
            localStorage.setItem('labManagementData', JSON.stringify(window.dataManager.data));
            window.dataManager.refreshAllComponents();
            console.log('✅ Data loaded from real-time sync');
        }
    }

    // Get latest data from sync
    getLatestData() {
        const syncData = localStorage.getItem(this.syncKey);
        if (syncData) {
            const parsed = JSON.parse(syncData);
            return parsed.data;
        }
        return null;
    }

    updateSyncStatus(status) {
        const syncStatusElement = document.getElementById('syncStatus');
        const syncStatusText = document.getElementById('syncStatusText');
        if (syncStatusElement && syncStatusText) {
            syncStatusElement.style.display = 'flex';
            syncStatusText.textContent = status;
            
            if (status === 'Synced') {
                setTimeout(() => {
                    syncStatusElement.style.display = 'none';
                }, 2000);
            }
        }
    }
}

// Initialize real-time sync
window.realtimeSync = new RealtimeSync();

// Activity feed functions
window.refreshActivityFeed = function() {
    window.realtimeSync?.updateActivityFeed();
    const activities = JSON.parse(localStorage.getItem('lams_activities') || '[]');
    const countElement = document.getElementById('activityCount');
    if (countElement) {
        countElement.textContent = `${activities.length} activities`;
    }
};

window.clearActivityFeed = function() {
    if (confirm('Are you sure you want to clear all activity history?')) {
        localStorage.removeItem('lams_activities');
        window.realtimeSync?.updateActivityFeed();
        showMessage('Activity feed cleared', 'success');
    }
};

// Export functions
window.exportDataToFile = function() {
    const data = window.dataManager?.data || {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lams-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Track activity
    window.realtimeSync?.saveData(data, 'export', 'exported data to file');
    showMessage('✅ Data exported successfully!', 'success');
};

window.importDataFromFile = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (window.dataManager) {
                        window.dataManager.data = { ...window.dataManager.data, ...data };
                        window.dataManager.save();
                        window.realtimeSync.saveData(window.dataManager.data);
                        showMessage('✅ Data imported and synced!', 'success');
                    }
                } catch (error) {
                    showMessage('❌ Invalid file format', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
};