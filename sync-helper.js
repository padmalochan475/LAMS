// Manual token acquisition for immediate sync activation
async function requestSyncPermission() {
    if (!authManager || !authManager.isSignedIn) {
        showMessage('Please sign in first', 'warning');
        return;
    }

    showMessage('🔑 Requesting sync permissions... Please allow the popup.', 'info');
    
    try {
        const token = await authManager.getAccessToken(true);
        if (token) {
            showMessage('✅ Sync permissions granted! Real-time sync is now active.', 'success');
            
            // Hide activation button and enable toggle button
            const activateBtn = document.getElementById('activateSyncBtn');
            const toggleBtn = document.getElementById('realTimeSyncBtn');
            const syncNotice = document.getElementById('sync-notice');
            
            if (activateBtn) activateBtn.style.display = 'none';
            if (toggleBtn) {
                toggleBtn.disabled = false;
                toggleBtn.style.display = 'inline-block';
            }
            if (syncNotice) syncNotice.style.display = 'none';
            
            // Start real-time sync automatically
            if (dataManager && !dataManager.syncInterval) {
                dataManager.startRealTimeSync();
                dataManager.updateSyncUI(true);
            }
            
            // Trigger immediate sync
            if (dataManager) {
                setTimeout(() => dataManager.syncWithCloud(), 500);
            }
        } else {
            showMessage('⚠️ Could not obtain sync permissions. Please allow popups and try again.', 'warning');
        }
    } catch (error) {
        showMessage('❌ Failed to request sync permissions: ' + error.message, 'error');
    }
}

// Check if sync is already active on page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const activateBtn = document.getElementById('activateSyncBtn');
        const toggleBtn = document.getElementById('realTimeSyncBtn');
        
        // Show activation button by default
        if (activateBtn) {
            activateBtn.style.display = 'inline-block';
        }
        
        // Hide toggle button until activated
        if (toggleBtn) {
            toggleBtn.style.display = 'none';
        }
        
        // Only show toggle if we already have token
        if (authManager && authManager.accessToken) {
            if (activateBtn) activateBtn.style.display = 'none';
            if (toggleBtn) {
                toggleBtn.disabled = false;
                toggleBtn.style.display = 'inline-block';
            }
        }
    }, 2000);
});

// Make function globally available
window.requestSyncPermission = requestSyncPermission;
