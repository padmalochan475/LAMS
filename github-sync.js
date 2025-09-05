// Free GitHub-based cross-device sync system
class GitHubSync {
    constructor() {
        this.owner = 'padmalochan475';
        this.repo = 'LAMS-data';
        this.branch = 'main';
        this.fileName = 'lams-data.json';
        this.isConnected = false;
        this.setupSync();
    }

    async setupSync() {
        try {
            // Test GitHub API access
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}`);
            if (response.ok) {
                this.isConnected = true;
                console.log('✅ GitHub sync connected');
                this.setupRealtimeListener();
            } else {
                this.fallbackToLocalSync();
            }
        } catch (error) {
            console.log('⚠️ GitHub API not available, using local sync');
            this.fallbackToLocalSync();
        }
    }

    setupRealtimeListener() {
        // Poll GitHub for changes every 10 seconds
        setInterval(async () => {
            try {
                const data = await this.loadFromGitHub();
                if (data && data.timestamp > (this.lastSyncTime || 0)) {
                    this.loadDataFromSync(data);
                }
            } catch (error) {
                console.log('Background sync check failed');
            }
        }, 10000);
    }

    async syncData(data, action = 'update', details = '') {
        if (this.isConnected) {
            await this.saveToGitHub(data, action, details);
        } else {
            this.fallbackSave(data, action, details);
        }
    }

    async saveToGitHub(data, action, details) {
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
                details: details
            };

            // Get current file SHA for updates
            let sha = null;
            try {
                const getResponse = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.fileName}`);
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                }
            } catch (e) {
                // File doesn't exist yet
            }

            // Create/update file
            const content = btoa(JSON.stringify(syncData, null, 2));
            const updateData = {
                message: `LAMS data update: ${action} by ${userName}`,
                content: content,
                branch: this.branch
            };
            
            if (sha) updateData.sha = sha;

            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.fileName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                this.lastSyncTime = timestamp;
                this.addActivity(action, details, user, userName, timestamp);
                console.log('✅ Data synced to GitHub');
                this.updateSyncStatus('Synced to GitHub');
            } else {
                throw new Error('GitHub API error');
            }
        } catch (error) {
            console.log('GitHub sync failed, using local backup');
            this.fallbackSave(data, action, details);
        }
    }

    async loadFromGitHub() {
        try {
            const response = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/contents/${this.fileName}`);
            if (response.ok) {
                const fileData = await response.json();
                const content = atob(fileData.content);
                return JSON.parse(content);
            }
        } catch (error) {
            console.log('Failed to load from GitHub');
        }
        return null;
    }

    async loadData() {
        if (this.isConnected) {
            return await this.loadFromGitHub();
        } else {
            return this.loadFromLocal();
        }
    }

    fallbackToLocalSync() {
        this.isConnected = false;
        this.channel = new BroadcastChannel('lams-sync');
        this.channel.addEventListener('message', (event) => {
            if (event.data.type === 'data-update' && event.data.timestamp > (this.lastSyncTime || 0)) {
                this.loadDataFromSync(event.data);
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

        localStorage.setItem('lams-github-backup', JSON.stringify(syncData));
        this.addActivity(action, details, user, userName, timestamp);
        
        if (this.channel) {
            this.channel.postMessage({
                type: 'data-update',
                ...syncData
            });
        }
        
        this.updateSyncStatus('Saved Locally');
    }

    loadFromLocal() {
        const syncData = localStorage.getItem('lams-github-backup');
        if (syncData) {
            return JSON.parse(syncData).data;
        }
        return null;
    }

    loadDataFromSync(syncData) {
        if (window.dataManager && syncData.data) {
            window.dataManager.data = { ...window.dataManager.data, ...syncData.data };
            localStorage.setItem('labManagementData', JSON.stringify(window.dataManager.data));
            window.dataManager.refreshAllComponents();
            this.lastSyncTime = syncData.timestamp;
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
            
            if (status.includes('Synced') || status.includes('GitHub')) {
                setTimeout(() => {
                    syncStatusElement.style.display = 'none';
                }, 3000);
            }
        }
    }
}

// Initialize GitHub sync
window.githubSync = new GitHubSync();

// Activity functions
window.refreshActivityFeed = function() {
    window.githubSync?.updateActivityFeed();
    const activities = JSON.parse(localStorage.getItem('lams_activities') || '[]');
    const countElement = document.getElementById('activityCount');
    if (countElement) {
        countElement.textContent = `${activities.length} activities`;
    }
};

window.clearActivityFeed = function() {
    if (confirm('Are you sure you want to clear all activity history?')) {
        localStorage.removeItem('lams_activities');
        window.githubSync?.updateActivityFeed();
        showMessage('Activity feed cleared', 'success');
    }
};