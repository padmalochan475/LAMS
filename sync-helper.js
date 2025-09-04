// Sync permission helper - delegates to DataManager
async function requestSyncPermission() {
    if (window.dataManager) {
        await window.dataManager.requestSyncPermission();
    } else {
        showMessage('⚠️ Data manager not available. Please refresh the page.', 'error');
    }
}

// Toggle real-time sync on/off
function toggleRealTimeSync() {
    if (window.dataManager) {
        if (window.dataManager.syncInterval) {
            window.dataManager.stopRealTimeSync();
            showMessage('Real-time sync stopped', 'info');
        } else {
            window.dataManager.startRealTimeSync();
            showMessage('Real-time sync started', 'success');
        }
    }
}

// Manual sync functions
async function manualSyncToDrive() {
    if (window.dataManager) {
        try {
            await window.dataManager.save();
        } catch (error) {
            console.error('Manual sync failed:', error);
        }
    }
}

async function manualSyncFromDrive() {
    if (window.authManager) {
        try {
            const data = await window.authManager.loadFromDrive(true);
            if (data && window.dataManager) {
                window.dataManager.data = { ...window.dataManager.data, ...data };
                window.dataManager.refreshAllComponents();
                showMessage('Data loaded from Google Drive', 'success');
            }
        } catch (error) {
            console.error('Manual load failed:', error);
        }
    }
}

// Make functions globally available
window.requestSyncPermission = requestSyncPermission;
window.toggleRealTimeSync = toggleRealTimeSync;
window.manualSyncToDrive = manualSyncToDrive;
window.manualSyncFromDrive = manualSyncFromDrive;
