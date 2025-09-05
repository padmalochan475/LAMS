// Activity tracking wrapper for all CRUD operations
class ActivityTracker {
    static trackCreate(type, item, details) {
        const message = `created ${type}: ${details}`;
        window.realtimeSync?.saveData(window.dataManager?.data, 'create', message);
        console.log(`📝 Activity: ${message}`);
    }
    
    static trackDelete(type, item, details) {
        const message = `deleted ${type}: ${details}`;
        window.realtimeSync?.saveData(window.dataManager?.data, 'delete', message);
        console.log(`🗑️ Activity: ${message}`);
    }
    
    static trackEdit(type, oldValue, newValue, details) {
        const message = `edited ${type}: ${details}`;
        window.realtimeSync?.saveData(window.dataManager?.data, 'edit', message);
        console.log(`✏️ Activity: ${message}`);
    }
    
    static trackUpdate(details) {
        const message = details;
        window.realtimeSync?.saveData(window.dataManager?.data, 'update', message);
        console.log(`🔄 Activity: ${message}`);
    }
}

// Override DataManager methods to include activity tracking
if (typeof window !== 'undefined') {
    // Wait for DataManager to be available
    setTimeout(() => {
        if (window.dataManager) {
            // Override addAssignment
            const originalAddAssignment = window.dataManager.addAssignment;
            window.dataManager.addAssignment = function(assignment) {
                const result = originalAddAssignment.call(this, assignment);
                if (result) {
                    const details = `${assignment.department}-${assignment.group}-${assignment.subGroup}-${assignment.subject}`;
                    ActivityTracker.trackCreate('assignment', assignment, details);
                }
                return result;
            };
            
            // Override deleteAssignment
            const originalDeleteAssignment = window.dataManager.deleteAssignment;
            window.dataManager.deleteAssignment = function(index) {
                const assignment = this.data.assignments[index];
                const result = originalDeleteAssignment.call(this, index);
                if (result && assignment) {
                    const details = `${assignment.department}-${assignment.group}-${assignment.subGroup}-${assignment.subject}`;
                    ActivityTracker.trackDelete('assignment', assignment, details);
                }
                return result;
            };
        }
    }, 2000);
}

window.ActivityTracker = ActivityTracker;