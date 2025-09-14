// GitHub API Integration for LAMS Data Synchronization
class GitHubSync {
    constructor() {
        this.baseUrl = 'https://api.github.com';
        this.owner = CONFIG.GITHUB.OWNER;
        this.repo = CONFIG.GITHUB.REPO;
        this.branch = CONFIG.GITHUB.BRANCH;
        this.dataFilePath = CONFIG.GITHUB.DATA_FILE_PATH;
        this.lastSyncSha = null;
        
        console.log('🐙 GitHub Sync initialized for:', `${this.owner}/${this.repo}`);
    }

    // Get GitHub token from user (will need to be provided by admin)
    getGitHubToken() {
        // For security, GitHub Personal Access Token should be entered by admin
        const token = localStorage.getItem('github_token');
        if (!token) {
            console.warn('⚠️ GitHub token not found. Admin needs to configure GitHub integration.');
            return null;
        }
        return token;
    }

    // Set GitHub token (admin only)
    setGitHubToken(token) {
        if (window.authManager && window.authManager.currentUser && window.authManager.currentUser.isAdmin) {
            localStorage.setItem('github_token', token);
            console.log('✅ GitHub token configured successfully');
            showMessage('GitHub integration configured successfully!', 'success');
            return true;
        } else {
            console.error('❌ Only admin can configure GitHub token');
            showMessage('Only admin can configure GitHub integration', 'error');
            return false;
        }
    }

    // Get file SHA from GitHub (needed for updates)
    async getFileSha() {
        const token = this.getGitHubToken();
        if (!token) return null;

        try {
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${this.dataFilePath}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.lastSyncSha = data.sha;
                return data.sha;
            } else if (response.status === 404) {
                console.log('📄 Data file does not exist in GitHub yet');
                return null;
            } else {
                throw new Error(`GitHub API error: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Failed to get file SHA from GitHub:', error);
            return null;
        }
    }

    // Sync data to GitHub repository
    async syncToGitHub(data) {
        const token = this.getGitHubToken();
        if (!token) {
            showMessage('GitHub token not configured. Please configure in admin settings.', 'warning');
            return false;
        }

        try {
            console.log('🔄 Syncing data to GitHub repository...');
            
            // Prepare data with metadata
            const syncData = {
                ...data,
                lastGitHubSync: {
                    timestamp: new Date().toISOString(),
                    user: window.authManager?.currentUser?.email || 'Unknown',
                    version: (data.version || 0) + 1
                }
            };

            const content = JSON.stringify(syncData, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(content)));
            
            // Get current file SHA
            const currentSha = await this.getFileSha();
            
            const commitData = {
                message: `${CONFIG.GITHUB.COMMIT_MESSAGE_PREFIX} ${new Date().toISOString()}`,
                content: encodedContent,
                branch: this.branch
            };

            // Include SHA if file exists (for update)
            if (currentSha) {
                commitData.sha = currentSha;
            }

            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${this.dataFilePath}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(commitData)
            });

            if (response.ok) {
                const result = await response.json();
                this.lastSyncSha = result.content.sha;
                console.log('✅ Successfully synced data to GitHub!');
                showMessage('🐙 Data synced to GitHub repository!', 'success');
                
                // Update sync status
                this.updateGitHubSyncStatus('Synced to GitHub');
                
                return true;
            } else {
                const error = await response.json();
                throw new Error(`GitHub API error: ${error.message || response.statusText}`);
            }

        } catch (error) {
            console.error('❌ GitHub sync failed:', error);
            showMessage(`GitHub sync failed: ${error.message}`, 'error');
            this.updateGitHubSyncStatus('GitHub sync failed');
            return false;
        }
    }

    // Load data from GitHub repository
    async loadFromGitHub() {
        const token = this.getGitHubToken();
        if (!token) {
            console.log('⚠️ GitHub token not available for loading');
            return null;
        }

        try {
            console.log('📥 Loading data from GitHub repository...');
            
            const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${this.dataFilePath}?ref=${this.branch}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                const fileData = await response.json();
                const content = atob(fileData.content);
                const data = JSON.parse(content);
                
                this.lastSyncSha = fileData.sha;
                console.log('✅ Successfully loaded data from GitHub!');
                showMessage('📥 Data loaded from GitHub repository!', 'success');
                
                return data;
            } else if (response.status === 404) {
                console.log('📄 No data file found in GitHub repository');
                return null;
            } else {
                throw new Error(`GitHub API error: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Failed to load from GitHub:', error);
            showMessage(`Failed to load from GitHub: ${error.message}`, 'error');
            return null;
        }
    }

    // Update GitHub sync status in UI
    updateGitHubSyncStatus(status) {
        const statusElement = document.getElementById('github-sync-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = status.includes('failed') ? 'sync-status error' : 'sync-status success';
        }
    }

    // Check if GitHub integration is configured
    isConfigured() {
        return !!this.getGitHubToken();
    }

    // Get repository URL for user reference
    getRepositoryUrl() {
        return `https://github.com/${this.owner}/${this.repo}`;
    }

    // Get data file URL for direct access
    getDataFileUrl() {
        return `https://github.com/${this.owner}/${this.repo}/blob/${this.branch}/${this.dataFilePath}`;
    }
}

// Initialize GitHub sync
let githubSync = null;
if (CONFIG.FEATURES?.GITHUB_SYNC) {
    githubSync = new GitHubSync();
    window.githubSync = githubSync;
}
