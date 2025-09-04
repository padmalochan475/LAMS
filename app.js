// Institute Lab Management System - Production Version

// Simple notification system for production
class NotificationManager {
    show(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `message message--${type}`;
        notification.textContent = message;
        
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(notification, container.firstChild);
            setTimeout(() => notification.remove(), duration);
        }
    }
}

class DataManager {
    constructor() {
        this.data = {
            days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            timeSlots: [],
            departments: ["CSE", "ECE", "EEE", "MECH", "CIVIL"],
            semesters: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
            groups: ["A", "B", "C", "D"],
            subGroups: ["1", "2", "3"],
            subjects: [],
            labRooms: [],
            theoryFaculty: [],
            labFaculty: [],
            assignments: [],
            academicYear: "2024-25",
            scheduleOrientation: "daysHorizontal", // or "timesHorizontal"
            lastModified: new Date().toISOString(),
            version: 1
        };
        this.isCloudMode = true; // Cloud-first mode
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.syncFailureCount = 0; // Track consecutive failures
        this.maxSyncFailures = 5; // Stop retrying after 5 failures
        this.init();
    }

    init() {
        // Load from cloud first, fallback to localStorage only for offline scenarios
        this.loadFromCloud().then(() => {
            this.validateMasterDataIntegrity();
            this.refreshAllComponents();
            
            // Auto-start real-time sync like all modern apps
            setTimeout(() => {
                if (window.authManager && window.authManager.isSignedIn) {
                    console.log('🔄 Auto-starting real-time sync for signed-in user...');
                    // Show friendly popup permission request instead of starting immediately
                    this.promptForSyncPermission();
                } else {
                    console.log('💡 LAMS initialized. Sign in to enable automatic real-time sync.');
                }
            }, 2000);
        });
    }

    // Cloud-first loading with localStorage fallback
    async loadFromCloud() {
        if (window.authManager && window.authManager.isSignedIn) {
            try {
                showMessage('🔄 Loading from cloud...', 'info');
                // Don't trigger popups during initialization
                const cloudData = await window.authManager.loadFromDrive(false);
                if (cloudData) {
                    // Merge cloud data with defaults
                    this.data = { ...this.data, ...cloudData };
                    this.version = cloudData.version || 0;
                    this.lastSyncTime = new Date().toISOString();
                    showMessage('✅ Data loaded from cloud', 'success');
                    console.log('📥 Cloud data loaded successfully');
                    return;
                }
            } catch (error) {
                console.warn('Cloud load failed, using localStorage fallback:', error);
                showMessage('⚠️ Cloud sync unavailable, using local data', 'warning');
            }
        }
        
        // Fallback to localStorage only if cloud is unavailable
        this.loadLocal();
    }

    // Local storage as fallback only
    loadLocal() {
        const saved = localStorage.getItem('labManagementData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.keys(this.data).forEach(key => {
                    if (parsed[key]) {
                        this.data[key] = parsed[key];
                    }
                });
                console.log('📱 Local fallback data loaded');
            } catch (e) {
                console.error('Error loading local data:', e);
            }
        }
    }

    // Cloud-first saving with real-time sync
    async save() {
        try {
            this.data.lastModified = new Date().toISOString();
            this.data.version = (this.data.version || 0) + 1;
            
            // Save to cloud immediately
            if (window.authManager && window.authManager.isSignedIn) {
                console.log('☁️ Attempting immediate cloud save...');
                const success = await window.authManager.saveToGoogleDrive(this.data);
                if (success) {
                    this.lastSyncTime = new Date().toISOString();
                    this.syncFailureCount = 0; // Reset failure count on success
                    showMessage('☁️ Synced to cloud', 'success');
                    console.log('☁️ Data saved to cloud successfully');
                } else {
                    throw new Error('Cloud save failed');
                }
            } else {
                throw new Error('Not signed in');
            }
            
            // Keep local copy as backup
            localStorage.setItem('labManagementData', JSON.stringify(this.data));
            
            this.validateMasterDataIntegrity();
            this.refreshAllComponents();
            
        } catch (error) {
            console.error('Save error:', error);
            this.syncFailureCount++;
            
            // Fallback to local save only
            localStorage.setItem('labManagementData', JSON.stringify(this.data));
            showMessage('⚠️ Saved locally, cloud sync will retry', 'warning');
            this.validateMasterDataIntegrity();
            this.refreshAllComponents();
            
            // Only retry if we haven't exceeded max failures
            if (this.syncFailureCount < this.maxSyncFailures && window.authManager && window.authManager.isSignedIn) {
                setTimeout(() => this.syncWithCloud(), 2000);
            } else if (this.syncFailureCount >= this.maxSyncFailures) {
                console.warn('⚠️ Too many sync failures, stopping auto-retry');
                showMessage('⚠️ Cloud sync disabled due to repeated failures. Check connection.', 'error');
            }
        }
    }

    // Real-time synchronization
    startRealTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        console.log('▶️ Starting aggressive real-time sync (every 3 seconds)...');
        
        // Sync every 3 seconds when signed in for true real-time experience
        this.syncInterval = setInterval(async () => {
            if (window.authManager && window.authManager.isSignedIn) {
                try {
                    await this.syncWithCloud();
                } catch (error) {
                    console.log('Background sync skipped:', error.message);
                }
            }
        }, 3000); // 3 second intervals for true real-time sync
        
        console.log('🔄 Real-time sync active - all changes will sync immediately');
    }

    updateSyncUI(isActive) {
        const syncBtn = document.getElementById('realTimeSyncBtn');
        const syncBtnText = document.getElementById('syncButtonText');
        const syncStatus = document.getElementById('syncStatus');
        const syncStatusText = document.getElementById('syncStatusText');
        
        if (!syncBtn || !syncBtnText || !syncStatus || !syncStatusText) return;
        
        if (isActive) {
            syncBtnText.textContent = 'Stop Real-Time Sync';
            syncBtn.querySelector('.nav-icon').textContent = '⏸️';
            syncStatus.querySelector('.nav-icon').textContent = '🔄';
            syncStatusText.textContent = 'Syncing every 3s';
        } else {
            syncBtnText.textContent = 'Start Real-Time Sync';
            syncBtn.querySelector('.nav-icon').textContent = '▶️';
            syncStatus.querySelector('.nav-icon').textContent = '🔄';
            syncStatusText.textContent = 'Auto-sync ready';
        }
    }

    async syncWithCloud() {
        try {
            // Try to get access token (background request, no popup spam)
            if (!window.authManager || !window.authManager.isSignedIn) {
                console.log('⏸️ User not signed in - skipping sync');
                return false;
            }

            // Try to get or refresh access token
            const token = await window.authManager.getAccessToken(false);
            if (!token) {
                console.log('⏸️ No access token available - use "Activate Real-Time Sync" for initial setup');
                return false;
            }

            console.log('🔄 Starting cloud sync...');
            
            // Load cloud version using existing token
            const cloudData = await window.authManager.loadFromDrive(true);
            if (!cloudData) {
                console.log('📤 No cloud data found, saving current version');
                await this.save();
                return true;
            }

            // Parse cloud data to get version info
            const cloudVersion = cloudData.version || 0;
            const cloudTime = new Date(cloudData.lastModified || 0);
            const localVersion = this.data.version || 0;
            const localTime = new Date(this.data.lastModified || 0);
            
            console.log(`📊 Version comparison - Cloud: ${cloudVersion} (${cloudTime.toLocaleString()}), Local: ${localVersion} (${localTime.toLocaleString()})`);

            // If cloud is newer, load it
            if (cloudVersion > localVersion || (cloudVersion === localVersion && cloudTime > localTime)) {
                console.log('⬇️ Loading newer data from cloud');
                
                // Update local data with cloud data
                this.data = { ...this.data, ...cloudData };
                this.lastSyncTime = new Date().toISOString();
                
                // Update UI to reflect changes
                this.refreshAllComponents();
                showMessage('✅ Data synced from cloud', 'success');
                return true;
            }

            // If local is newer, save to cloud
            if (localVersion > cloudVersion || (localVersion === cloudVersion && localTime > cloudTime)) {
                console.log('⬆️ Saving newer local data to cloud');
                const success = await window.authManager.saveToGoogleDrive(this.data);
                if (success) {
                    this.lastSyncTime = new Date().toISOString();
                    showMessage('☁️ Local changes synced to cloud', 'success');
                }
                return true;
            }

            console.log('✅ Data already in sync');
            this.lastSyncTime = new Date().toISOString();
            return true;

        } catch (error) {
            console.log('❌ Cloud sync failed:', error);
            showMessage('⚠️ Cloud sync failed - working offline', 'warning');
            return false;
        }
    }

    // Prompt user for sync permission in a friendly way
    promptForSyncPermission() {
        // Check if we already have permission
        window.authManager.getAccessToken(false).then(token => {
            if (token) {
                // We have permission, start sync immediately
                console.log('✅ Sync permission already granted - starting real-time sync');
                this.startRealTimeSync();
                showMessage('🔄 Real-time sync activated! Changes sync across all devices.', 'success');
            } else {
                // Need permission, show user-friendly prompt
                this.showSyncPermissionDialog();
            }
        }).catch(() => {
            // No permission, show dialog
            this.showSyncPermissionDialog();
        });
    }

    // Show friendly permission dialog
    showSyncPermissionDialog() {
        showMessage('💡 Enable real-time sync across devices? This requires one-time Google Drive permission.', 'info');
        
        // Create permission button in notification area
        setTimeout(() => {
            const enableSyncBtn = document.createElement('button');
            enableSyncBtn.textContent = '🔄 Enable Real-Time Sync';
            enableSyncBtn.className = 'btn btn--primary';
            enableSyncBtn.style.margin = '10px';
            enableSyncBtn.onclick = () => this.requestSyncPermission();
            
            // Find the message element and add button
            const messages = document.querySelectorAll('.message');
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                lastMessage.appendChild(document.createElement('br'));
                lastMessage.appendChild(enableSyncBtn);
            }
        }, 500);
    }

    // Request sync permission with user interaction
    async requestSyncPermission() {
        try {
            showMessage('🔄 Requesting Google Drive permission... Please allow the popup.', 'info');
            
            // This will show popup because user clicked button (user interaction)
            const token = await window.authManager.getAccessToken(true);
            
            if (token) {
                console.log('✅ Sync permission granted - starting real-time sync');
                this.startRealTimeSync();
                showMessage('🎉 Real-time sync enabled! Changes will sync across all devices within 3-6 seconds.', 'success');
            } else {
                showMessage('⚠️ Sync permission denied. Enable popups for this site to use real-time sync.', 'warning');
            }
        } catch (error) {
            console.log('❌ Permission request failed:', error);
            showMessage('⚠️ Please allow popups for this site to enable real-time sync.', 'warning');
        }
    }

    stopRealTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    validateMasterDataIntegrity() {
        this.data.assignments = this.data.assignments.filter(assignment => {
            return this.data.timeSlots.includes(assignment.timeSlot) &&
                   this.data.departments.includes(assignment.department) &&
                   this.data.semesters.includes(assignment.semester) &&
                   this.data.groups.includes(assignment.group) &&
                   this.data.subGroups.includes(assignment.subGroup) &&
                   this.data.subjects.includes(assignment.subject) &&
                   this.data.labRooms.includes(assignment.labRoom) &&
                   this.getFacultyShortNames('theory').includes(assignment.theoryFaculty) &&
                   this.getFacultyShortNames('lab').includes(assignment.labFaculty);
        });
    }

    getFacultyShortNames(type) {
        const facultyType = type === 'theory' ? 'theoryFaculty' : 'labFaculty';
        return this.data[facultyType].map(faculty => 
            typeof faculty === 'object' ? faculty.short : faculty
        );
    }
    
    getFacultyDisplayNames(type) {
        const facultyType = type === 'theory' ? 'theoryFaculty' : 'labFaculty';
        return this.data[facultyType].map(faculty => {
            if (typeof faculty === 'object') {
                return {
                    value: faculty.short,
                    display: `${faculty.short} - ${faculty.full}`
                };
            }
            return {
                value: faculty,
                display: faculty
            };
        });
    }

    // Trigger immediate sync on any data change
    triggerImmediateSync() {
        if (window.authManager && window.authManager.isSignedIn) {
            // Sync immediately on data changes
            setTimeout(() => this.syncWithCloud(), 100);
        }
    }

    // Override methods to trigger immediate sync
    addMasterDataItem(type, value) {
        if (!value || value.trim() === '') {
            showMessage('Please enter a value!', 'error');
            return false;
        }
        const trimmedValue = value.trim();
        
        if (this.data[type].includes(trimmedValue)) {
            showMessage('Item already exists!', 'error');
            return false;
        }
        
        this.data[type].push(trimmedValue);
        this.save();
        this.triggerImmediateSync(); // Sync immediately after adding
        showMessage('Item added successfully!', 'success');
        return true;
    }

    addFaculty(type, facultyData) {
        const facultyType = type === 'theory' ? 'theoryFaculty' : 'labFaculty';
        
        if (!facultyData.short || !facultyData.full || !facultyData.dept) {
            showMessage('All fields are required for faculty!', 'error');
            return false;
        }
        
        const existingShortNames = this.getFacultyShortNames(type);
        if (existingShortNames.includes(facultyData.short)) {
            showMessage('Faculty with this short name already exists!', 'error');
            return false;
        }

        this.data[facultyType].push(facultyData);
        this.save();
        showMessage('Faculty added successfully!', 'success');
        return true;
    }

    removeMasterDataItem(type, value) {
        if (this.isItemInUse(type, value)) {
            showMessage('Cannot delete: Item is currently in use in assignments!', 'error');
            return false;
        }

        const index = this.data[type].indexOf(value);
        if (index > -1) {
            this.data[type].splice(index, 1);
            this.save();
            showMessage('Item deleted successfully!', 'success');
            return true;
        }
        return false;
    }

    removeFaculty(type, shortName) {
        const facultyType = type === 'theory' ? 'theoryFaculty' : 'labFaculty';
        const field = type === 'theory' ? 'theoryFaculty' : 'labFaculty';
        
        const inUse = this.data.assignments.some(assignment => assignment[field] === shortName);
        if (inUse) {
            showMessage('Cannot delete: Faculty is currently assigned to lab sessions!', 'error');
            return false;
        }

        const index = this.data[facultyType].findIndex(faculty => 
            (typeof faculty === 'object' ? faculty.short : faculty) === shortName
        );
        
        if (index > -1) {
            this.data[facultyType].splice(index, 1);
            this.save();
            showMessage('Faculty deleted successfully!', 'success');
            return true;
        }
        return false;
    }

    isItemInUse(type, value) {
        const fieldMap = {
            timeSlots: 'timeSlot',
            departments: 'department',
            semesters: 'semester',
            groups: 'group',
            subGroups: 'subGroup',
            subjects: 'subject',
            labRooms: 'labRoom'
        };

        const field = fieldMap[type];
        if (!field) return false;

        return this.data.assignments.some(assignment => assignment[field] === value);
    }

    addAssignment(assignment) {
        const roomConflict = this.data.assignments.find(existing => 
            existing.day === assignment.day &&
            existing.timeSlot === assignment.timeSlot &&
            existing.labRoom === assignment.labRoom
        );

        const facultyConflict = this.data.assignments.find(existing => 
            existing.day === assignment.day &&
            existing.timeSlot === assignment.timeSlot &&
            (existing.theoryFaculty === assignment.theoryFaculty || 
             existing.labFaculty === assignment.labFaculty)
        );

        const classConflict = this.data.assignments.find(existing => 
            existing.day === assignment.day &&
            existing.timeSlot === assignment.timeSlot &&
            existing.department === assignment.department &&
            existing.semester === assignment.semester &&
            existing.group === assignment.group &&
            existing.subGroup === assignment.subGroup
        );

        if (roomConflict || facultyConflict || classConflict) {
            let conflictMessage = 'Conflict detected: ';
            const conflicts = [];
            if (roomConflict) conflicts.push('Room already in use');
            if (facultyConflict) conflicts.push('Faculty already assigned');
            if (classConflict) conflicts.push('Class already has a lab');
            
            conflictMessage += conflicts.join(', ');
            showMessage(conflictMessage, 'error');
            return false;
        }

        this.data.assignments.push(assignment);
        this.save();
        this.triggerImmediateSync(); // Sync immediately after adding assignment
        showMessage('Assignment created successfully!', 'success');
        return true;
    }

    removeAssignment(index) {
        if (index >= 0 && index < this.data.assignments.length) {
            this.data.assignments.splice(index, 1);
            this.save();
            this.triggerImmediateSync(); // Sync immediately after removing assignment
            showMessage('Assignment deleted successfully!', 'success');
            return true;
        }
        return false;
    }

    setAcademicYear(year) {
        if (!year || year.trim() === '') {
            showMessage('Please enter a valid academic year!', 'error');
            return false;
        }
        this.data.academicYear = year.trim();
        this.save();
        document.getElementById('currentAcademicYear').textContent = this.data.academicYear;
        document.getElementById('printAcademicYear').textContent = this.data.academicYear;
        showMessage('Academic year updated successfully!', 'success');
        return true;
    }

    toggleScheduleOrientation() {
        this.data.scheduleOrientation = this.data.scheduleOrientation === "daysHorizontal" 
            ? "timesHorizontal" 
            : "daysHorizontal";
        this.save();
        this.refreshAllComponents();
        return this.data.scheduleOrientation;
    }

    refreshAllComponents() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.doRefresh();
            });
        } else {
            this.doRefresh();
        }
    }

    doRefresh() {
        try {
            refreshDropdowns();
            updateCountBadges();
            renderDashboard();
            renderAssignmentsList();
            renderSchedule();
            renderMasterDataLists();
            renderPrintSchedule();
        } catch (e) {
            console.error('Error refreshing components:', e);
        }
    }


    getAssignmentDisplay(assignment) {
        return `${assignment.department}-${assignment.group}-${assignment.subGroup}-${assignment.subject}-[${assignment.theoryFaculty},${assignment.labFaculty}]-${assignment.labRoom} [${assignment.semester} SEM]`;
    }

    getAssignmentPrintDisplay(assignment) {
        return `${assignment.department}-${assignment.group}-${assignment.subGroup}-${assignment.subject}-[${assignment.theoryFaculty},${assignment.labFaculty}]-${assignment.labRoom}`;
    }

    searchAssignments(query) {
        if (!query.trim()) return this.data.assignments;
        
        const searchTerm = query.toLowerCase();
        return this.data.assignments.filter(assignment => 
            this.getAssignmentDisplay(assignment).toLowerCase().includes(searchTerm) ||
            assignment.day.toLowerCase().includes(searchTerm) ||
            assignment.timeSlot.toLowerCase().includes(searchTerm)
        );
    }
}

// Global instances
let dataManager;
let notificationManager;

// UI Management Functions
function showMessage(text, type = 'info') {
    const existing = document.querySelector('.message');
    if (existing) existing.remove();

    const message = document.createElement('div');
    message.className = `message message--${type}`;
    message.textContent = text;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(message, container.firstChild);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

function showConflictNotification(message) {
    const existing = document.querySelector('.conflict-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'conflict-notification';
    notification.innerHTML = `
        <div class="conflict-content">
            <div class="conflict-icon">⚠️</div>
            <div class="conflict-message">${message}</div>
            <button class="conflict-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Enhanced conflict notification with detailed information
function showEnhancedConflictNotification(message, conflicts) {
    const existing = document.querySelector('.enhanced-conflict-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'enhanced-conflict-modal';
    
    let conflictDetails = '';
    if (conflicts.roomConflict) {
        conflictDetails += `
            <div class="conflict-detail">
                <strong>Room Conflict:</strong> ${dataManager.getAssignmentDisplay(conflicts.roomConflict)}
            </div>
        `;
    }
    if (conflicts.facultyConflict) {
        conflictDetails += `
            <div class="conflict-detail">
                <strong>Faculty Conflict:</strong> ${dataManager.getAssignmentDisplay(conflicts.facultyConflict)}
            </div>
        `;
    }
    if (conflicts.classConflict) {
        conflictDetails += `
            <div class="conflict-detail">
                <strong>Class Conflict:</strong> ${dataManager.getAssignmentDisplay(conflicts.classConflict)}
            </div>
        `;
    }
    
    modal.innerHTML = `
        <div class="enhanced-conflict-content">
            <div class="conflict-header">
                <div class="conflict-icon-large">⚠️</div>
                <h3>Assignment Conflict Detected</h3>
                <button class="conflict-close" onclick="this.closest('.enhanced-conflict-modal').remove()">&times;</button>
            </div>
            <div class="conflict-body">
                <p class="conflict-summary">${message}</p>
                <div class="conflict-details">
                    <h4>Conflicting Assignments:</h4>
                    ${conflictDetails}
                </div>
            </div>
            <div class="conflict-actions">
                <button class="btn btn--secondary" onclick="this.closest('.enhanced-conflict-modal').remove()">Cancel</button>
                <button class="btn btn--primary" onclick="showTab('schedule'); this.closest('.enhanced-conflict-modal').remove();">View Schedule</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Auto dismiss after 10 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.classList.add('hide');
            setTimeout(() => modal.remove(), 300);
        }
    }, 10000);
}

function editAcademicYear() {
    const currentYear = dataManager.data.academicYear;
    const newYear = prompt("Enter academic year (e.g., 2024-25):", currentYear);
    if (newYear && newYear !== currentYear) {
        dataManager.setAcademicYear(newYear);
    }
}

function toggleScheduleOrientation() {
    const newOrientation = dataManager.toggleScheduleOrientation();
    const orientationText = newOrientation === "daysHorizontal" 
        ? "Days as Columns" 
        : "Times as Columns";
    showMessage(`Schedule view changed to ${orientationText}`, 'success');
}

function refreshDropdowns() {
    if (!dataManager) return;
    
    const dropdownConfigs = [
        { id: 'assignmentTimeSlot', data: dataManager.data.timeSlots },
        { id: 'assignmentDepartment', data: dataManager.data.departments },
        { id: 'assignmentSemester', data: dataManager.data.semesters },
        { id: 'assignmentGroup', data: dataManager.data.groups },
        { id: 'assignmentSubGroup', data: dataManager.data.subGroups },
        { id: 'assignmentSubject', data: dataManager.data.subjects },
        { id: 'assignmentLabRoom', data: dataManager.data.labRooms },
        { id: 'assignmentTheoryFaculty', data: dataManager.getFacultyDisplayNames('theory') },
        { id: 'assignmentLabFaculty', data: dataManager.getFacultyDisplayNames('lab') },
        { id: 'scheduleFilter', data: dataManager.data.departments },
        { id: 'scheduleSemesterFilter', data: dataManager.data.semesters },
        { id: 'scheduleGroupFilter', data: dataManager.data.groups },
        { id: 'printDepartmentFilter', data: dataManager.data.departments },
        { id: 'printSemesterFilter', data: dataManager.data.semesters },
        { id: 'printGroupFilter', data: dataManager.data.groups },
        { id: 'newTheoryFacultyDept', data: dataManager.data.departments },
        { id: 'newLabFacultyDept', data: dataManager.data.departments }
    ];

    dropdownConfigs.forEach(config => {
        const select = document.getElementById(config.id);
        if (select && config.data) {
            const currentValue = select.value;
            
            const firstOption = select.querySelector('option:first-child');
            const placeholder = firstOption ? firstOption.cloneNode(true) : null;
            
            select.innerHTML = '';
            
            if (placeholder) {
                select.appendChild(placeholder);
            }
            
            config.data.forEach(item => {
                const option = document.createElement('option');
                if (typeof item === 'object' && item.value && item.display) {
                    option.value = item.value;
                    option.textContent = item.display;
                } else {
                    option.value = item;
                    option.textContent = item;
                }
                select.appendChild(option);
            });
            
            if (config.data.includes(currentValue)) {
                select.value = currentValue;
            }
        }
    });
}

function updateCountBadges() {
    if (!dataManager) return;
    
    const counts = {
        departmentsCount: dataManager.data.departments.length,
        semestersCount: dataManager.data.semesters.length,
        groupsCount: dataManager.data.groups.length,
        subGroupsCount: dataManager.data.subGroups.length,
        timeSlotsCount: dataManager.data.timeSlots.length,
        subjectsCount: dataManager.data.subjects.length,
        labRoomsCount: dataManager.data.labRooms.length,
        theoryFacultyCount: dataManager.data.theoryFaculty.length,
        labFacultyCount: dataManager.data.labFaculty.length
    };

    Object.entries(counts).forEach(([id, count]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = count;
    });
}

function renderDashboard() {
    if (!dataManager) return;
    
    const totalAssignments = document.getElementById('totalAssignments');
    const totalFaculty = document.getElementById('totalFaculty');
    const totalRooms = document.getElementById('totalRooms');
    const totalSubjects = document.getElementById('totalSubjects');
    
    if (totalAssignments) totalAssignments.textContent = dataManager.data.assignments.length;
    if (totalFaculty) totalFaculty.textContent = dataManager.data.theoryFaculty.length + dataManager.data.labFaculty.length;
    if (totalRooms) totalRooms.textContent = dataManager.data.labRooms.length;
    if (totalSubjects) totalSubjects.textContent = dataManager.data.subjects.length;

    const recentList = document.getElementById('recentAssignmentsList');
    if (recentList) {
        const recent = dataManager.data.assignments.slice(-5).reverse();
        
        if (recent.length === 0) {
            recentList.innerHTML = '<p class="empty-state">No assignments created yet. Add master data first, then create assignments.</p>';
        } else {
            recentList.innerHTML = recent.map(assignment => `
                <div class="assignment-item">
                    <h4>${dataManager.getAssignmentDisplay(assignment)}</h4>
                    <div class="assignment-details">
                        <span class="assignment-time">${assignment.day} | ${assignment.timeSlot}</span>
                        <span class="assignment-badge">${assignment.department}</span>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Update admin stats if admin
    updateAdminStats();
}

function renderAssignmentsList() {
    if (!dataManager) return;
    
    const list = document.getElementById('assignmentsList');
    const searchInput = document.getElementById('assignmentSearch');
    if (!list) return;
    
    const query = searchInput ? searchInput.value : '';
    const assignments = dataManager.searchAssignments(query);
    
    if (assignments.length === 0) {
        list.innerHTML = query ? 
            '<p class="empty-state">No assignments match your search.</p>' : 
            '<p class="empty-state">No assignments created yet.</p>';
        return;
    }

    list.innerHTML = assignments.map((assignment, index) => {
        const originalIndex = dataManager.data.assignments.indexOf(assignment);
        return `
            <div class="assignment-item">
                <div class="flex justify-between items-center">
                    <div>
                        <h4>${dataManager.getAssignmentDisplay(assignment)}</h4>
                        <div class="assignment-details">
                            ${assignment.day} | ${assignment.timeSlot}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteAssignment(${originalIndex})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderSchedule() {
    if (!dataManager) return;
    
    const grid = document.getElementById('scheduleGrid');
    if (!grid) return;
    
    const deptFilter = document.getElementById('scheduleFilter')?.value || '';
    const semesterFilter = document.getElementById('scheduleSemesterFilter')?.value || '';
    const groupFilter = document.getElementById('scheduleGroupFilter')?.value || '';
    
    if (dataManager.data.timeSlots.length === 0) {
        grid.innerHTML = '<p class="empty-state">Add time slots and assignments to view the schedule.</p>';
        return;
    }

    let filteredAssignments = dataManager.data.assignments;
    
    if (deptFilter) filteredAssignments = filteredAssignments.filter(a => a.department === deptFilter);
    if (semesterFilter) filteredAssignments = filteredAssignments.filter(a => a.semester === semesterFilter);
    if (groupFilter) filteredAssignments = filteredAssignments.filter(a => a.group === groupFilter);

    if (dataManager.data.scheduleOrientation === "timesHorizontal") {
        let html = `
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        ${dataManager.data.timeSlots.map(slot => `<th>${slot}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        dataManager.data.days.forEach(day => {
            html += `<tr><td><strong>${day}</strong></td>`;
            
            dataManager.data.timeSlots.forEach(timeSlot => {
                const slotAssignments = filteredAssignments.filter(a => 
                    a.day === day && a.timeSlot === timeSlot
                );
                
                html += '<td>';
                slotAssignments.forEach(assignment => {
                    html += `<div class="schedule-entry">${dataManager.getAssignmentDisplay(assignment)}</div>`;
                });
                html += '</td>';
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        grid.innerHTML = html;
    } else {
        let html = `
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Time Slot</th>
                        ${dataManager.data.days.map(day => `<th>${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        dataManager.data.timeSlots.forEach(timeSlot => {
            html += `<tr><td><strong>${timeSlot}</strong></td>`;
            
            dataManager.data.days.forEach(day => {
                const dayAssignments = filteredAssignments.filter(a => 
                    a.day === day && a.timeSlot === timeSlot
                );
                
                html += '<td>';
                dayAssignments.forEach(assignment => {
                    html += `<div class="schedule-entry">${dataManager.getAssignmentDisplay(assignment)}</div>`;
                });
                html += '</td>';
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        grid.innerHTML = html;
    }
}

function renderMasterDataLists() {
    if (!dataManager) return;
    
    const configs = [
        { id: 'departmentsList', type: 'departments' },
        { id: 'semestersList', type: 'semesters' },
        { id: 'groupsList', type: 'groups' },
        { id: 'subGroupsList', type: 'subGroups' },
        { id: 'timeSlotsList', type: 'timeSlots' },
        { id: 'subjectsList', type: 'subjects' },
        { id: 'labRoomsList', type: 'labRooms' }
    ];

    configs.forEach(config => {
        const container = document.getElementById(config.id);
        if (!container) return;
        
        const items = dataManager.data[config.type];
        
        if (items.length === 0) {
            container.innerHTML = '<p class="empty-state">No items added yet.</p>';
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="master-data-item">
                <span>${item}</span>
                <button class="delete-btn" onclick="deleteMasterDataItem('${config.type}', '${item}')">Delete</button>
            </div>
        `).join('');
    });

    renderFacultyList('theory');
    renderFacultyList('lab');
}

function renderFacultyList(type) {
    if (!dataManager) return;
    
    const facultyType = type === 'theory' ? 'theoryFaculty' : 'labFaculty';
    const containerId = type === 'theory' ? 'theoryFacultyList' : 'labFacultyList';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const faculty = dataManager.data[facultyType];
    
    if (faculty.length === 0) {
        container.innerHTML = '<p class="empty-state">No faculty added yet.</p>';
        return;
    }

    container.innerHTML = faculty.map(facultyMember => {
        const displayData = typeof facultyMember === 'object' ? facultyMember : { short: facultyMember, full: '', dept: '' };
        const displayText = displayData.full && displayData.dept ? 
            `${displayData.short} - ${displayData.full} (${displayData.dept})` : 
            displayData.short;
        
        return `
            <div class="master-data-item faculty-item">
                <div>
                    <div class="faculty-display">${displayText}</div>
                </div>
                <button class="delete-btn" onclick="deleteFaculty('${type}', '${displayData.short}')">Delete</button>
            </div>
        `;
    }).join('');
}

function renderAnalytics() {
    if (!dataManager) return;
    
    try {
        renderFacultyWorkloadChart();
        renderSubjectDistributionChart();
        renderRoomUtilizationChart();
        renderDepartmentOverviewChart();
        renderTimeSlotChart();
        renderHeatmapChart();
    } catch (e) {
        console.error('Error rendering analytics:', e);
    }
}

function renderFacultyWorkloadChart() {
    const ctx = document.getElementById('facultyWorkloadChart');
    if (!ctx || !dataManager) return;

    const facultyWorkload = {};
    
    dataManager.data.assignments.forEach(assignment => {
        facultyWorkload[assignment.theoryFaculty] = (facultyWorkload[assignment.theoryFaculty] || 0) + 1;
        facultyWorkload[assignment.labFaculty] = (facultyWorkload[assignment.labFaculty] || 0) + 1;
    });

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(facultyWorkload),
            datasets: [{
                label: 'Number of Assignments',
                data: Object.values(facultyWorkload),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderSubjectDistributionChart() {
    const ctx = document.getElementById('subjectDistributionChart');
    if (!ctx || !dataManager) return;

    const subjectCount = {};
    dataManager.data.assignments.forEach(assignment => {
        subjectCount[assignment.subject] = (subjectCount[assignment.subject] || 0) + 1;
    });

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(subjectCount),
            datasets: [{
                data: Object.values(subjectCount),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function renderRoomUtilizationChart() {
    const ctx = document.getElementById('roomUtilizationChart');
    if (!ctx || !dataManager) return;

    const roomCount = {};
    dataManager.data.assignments.forEach(assignment => {
        roomCount[assignment.labRoom] = (roomCount[assignment.labRoom] || 0) + 1;
    });

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(roomCount),
            datasets: [{
                data: Object.values(roomCount),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function renderDepartmentOverviewChart() {
    const ctx = document.getElementById('departmentOverviewChart');
    if (!ctx || !dataManager) return;

    const deptCount = {};
    dataManager.data.assignments.forEach(assignment => {
        deptCount[assignment.department] = (deptCount[assignment.department] || 0) + 1;
    });

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(deptCount),
            datasets: [{
                label: 'Number of Assignments',
                data: Object.values(deptCount),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderTimeSlotChart() {
    const ctx = document.getElementById('timeSlotChart');
    if (!ctx || !dataManager) return;

    const timeSlotCount = {};
    dataManager.data.assignments.forEach(assignment => {
        timeSlotCount[assignment.timeSlot] = (timeSlotCount[assignment.timeSlot] || 0) + 1;
    });

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(timeSlotCount),
            datasets: [{
                label: 'Assignments per Time Slot',
                data: Object.values(timeSlotCount),
                borderColor: '#1FB8CD',
                backgroundColor: 'rgba(31, 184, 205, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderHeatmapChart() {
    const ctx = document.getElementById('heatmapChart');
    if (!ctx || !dataManager) return;

    const heatmapData = {};
    dataManager.data.days.forEach(day => {
        heatmapData[day] = {};
        dataManager.data.timeSlots.forEach(timeSlot => {
            heatmapData[day][timeSlot] = 0;
        });
    });

    dataManager.data.assignments.forEach(assignment => {
        if (heatmapData[assignment.day] && heatmapData[assignment.day][assignment.timeSlot] !== undefined) {
            heatmapData[assignment.day][assignment.timeSlot]++;
        }
    });

    if (ctx.chart) ctx.chart.destroy();

    const dayTotals = {};
    Object.keys(heatmapData).forEach(day => {
        dayTotals[day] = Object.values(heatmapData[day]).reduce((sum, count) => sum + count, 0);
    });

    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dayTotals),
            datasets: [{
                label: 'Daily Assignment Count',
                data: Object.values(dayTotals),
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderPrintSchedule() {
    if (!dataManager) return;
    
    const grid = document.getElementById('printGrid');
    if (!grid) return;
    
    const deptFilter = document.getElementById('printDepartmentFilter')?.value || '';
    const semesterFilter = document.getElementById('printSemesterFilter')?.value || '';
    const groupFilter = document.getElementById('printGroupFilter')?.value || '';
    
    const title = document.getElementById('printDepartmentTitle');
    if (title) {
        let titleText = '';
        if (deptFilter) titleText += `${deptFilter} Department`;
        if (semesterFilter) titleText += (titleText ? ' - ' : '') + `${semesterFilter} Semester`;
        if (groupFilter) titleText += (titleText ? ' - ' : '') + `Group ${groupFilter}`;
        if (!titleText) titleText = 'All Departments';
        title.textContent = titleText;
    }
    
    if (dataManager.data.timeSlots.length === 0 || dataManager.data.assignments.length === 0) {
        grid.innerHTML = '<p class="empty-state">No assignments to print.</p>';
        return;
    }

    let filteredAssignments = dataManager.data.assignments;
    if (deptFilter) filteredAssignments = filteredAssignments.filter(a => a.department === deptFilter);
    if (semesterFilter) filteredAssignments = filteredAssignments.filter(a => a.semester === semesterFilter);
    if (groupFilter) filteredAssignments = filteredAssignments.filter(a => a.group === groupFilter);

    // Calculate maximum assignments per cell for optimal sizing
    let maxAssignmentsPerCell = 1;
    dataManager.data.timeSlots.forEach(timeSlot => {
        dataManager.data.days.forEach(day => {
            const count = filteredAssignments.filter(a => 
                a.day === day && a.timeSlot === timeSlot
            ).length;
            if (count > maxAssignmentsPerCell) maxAssignmentsPerCell = count;
        });
    });

    // Dynamic font sizing based on content density
    let fontSize, cellHeight;
    if (maxAssignmentsPerCell <= 2) {
        fontSize = '11px';
        cellHeight = '80px';
    } else if (maxAssignmentsPerCell <= 5) {
        fontSize = '9px';
        cellHeight = '100px';
    } else if (maxAssignmentsPerCell <= 8) {
        fontSize = '8px';
        cellHeight = '120px';
    } else {
        fontSize = '7px';
        cellHeight = '140px';
    }

    // Always use time slots as rows for better A4 layout
    let html = `
        <table class="print-table optimized-print" style="font-size: ${fontSize}">
            <thead>
                <tr class="print-header-row">
                    <th class="time-column">Time Slot</th>
                    ${dataManager.data.days.map(day => `<th class="day-column">${day}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    dataManager.data.timeSlots.forEach(timeSlot => {
        html += `<tr class="time-row" style="height: ${cellHeight}">`;
        html += `<td class="time-cell"><strong>${timeSlot}</strong></td>`;
        
        dataManager.data.days.forEach(day => {
            const dayAssignments = filteredAssignments.filter(a => 
                a.day === day && a.timeSlot === timeSlot
            );
            
            html += `<td class="schedule-cell">`;
            
            if (dayAssignments.length === 0) {
                html += '<div class="no-lab">-</div>';
            } else {
                dayAssignments.forEach((assignment, index) => {
                    const printDisplay = dataManager.getAssignmentPrintDisplay(assignment);
                    
                    html += `
                        <div class="lab-entry lab-entry-${index % 3}">
                            <div class="lab-display">${printDisplay}</div>
                        </div>
                    `;
                });
            }
            
            html += '</td>';
        });
        
        html += '</tr>';
    });

    html += '</tbody></table>';
    grid.innerHTML = html;
}

// Event Handlers
function addMasterDataItem(type, inputId) {
    const input = document.getElementById(inputId);
    if (!input || !dataManager) return;
    
    const value = input.value.trim();
    
    if (dataManager.addMasterDataItem(type, value)) {
        input.value = '';
    }
}

function addFaculty(type) {
    if (!dataManager) return;
    
    const shortInput = document.getElementById(`new${type === 'theory' ? 'Theory' : 'Lab'}FacultyShort`);
    const fullInput = document.getElementById(`new${type === 'theory' ? 'Theory' : 'Lab'}FacultyFull`);
    const deptSelect = document.getElementById(`new${type === 'theory' ? 'Theory' : 'Lab'}FacultyDept`);
    
    if (!shortInput || !fullInput || !deptSelect) return;
    
    const short = shortInput.value.trim();
    const full = fullInput.value.trim();
    const dept = deptSelect.value;
    
    const facultyData = { short, full, dept };
    
    if (dataManager.addFaculty(type, facultyData)) {
        shortInput.value = '';
        fullInput.value = '';
        deptSelect.value = '';
    }
}

function deleteMasterDataItem(type, value) {
    if (!dataManager) return;
    
    if (confirm(`Are you sure you want to delete "${value}"?`)) {
        dataManager.removeMasterDataItem(type, value);
    }
}

function deleteFaculty(type, shortName) {
    if (!dataManager) return;
    
    if (confirm(`Are you sure you want to delete faculty "${shortName}"?`)) {
        dataManager.removeFaculty(type, shortName);
    }
}

function deleteAssignment(index) {
    if (!dataManager) return;
    
    if (confirm('Are you sure you want to delete this assignment?')) {
        dataManager.removeAssignment(index);
    }
}

// Simple tab management for production
function showTab(tabId, event = null) {
    // Remove active states
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active states
    const selectedTab = event ? event.target.closest('.nav-tab') : document.querySelector(`[onclick="showTab('${tabId}')"]`);
    const selectedContent = document.getElementById(`${tabId}-tab`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    // Special handling for different tabs
    switch (tabId) {
        case 'analytics':
            setTimeout(renderAnalytics, 100);
            break;
        case 'dashboard':
            setTimeout(renderDashboard, 100);
            break;
        case 'schedule':
            setTimeout(renderSchedule, 100);
            break;
        case 'print':
            setTimeout(() => {
                renderPrintSchedule();
                document.getElementById('printDate').textContent = new Date().toLocaleDateString();
            }, 100);
            break;
        case 'logs':
            setTimeout(refreshSyncLogs, 100);
            break;
    }
}

// Theme Management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-color-scheme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-color-scheme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize Application for production
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.style.display = 'none';
        
        // Initialize managers
        notificationManager = new NotificationManager();
        dataManager = new DataManager();
    } catch (error) {
        console.error('Application initialization failed:', error);
        return;
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
        assignmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const assignment = {
                day: document.getElementById('assignmentDay').value,
                timeSlot: document.getElementById('assignmentTimeSlot').value,
                department: document.getElementById('assignmentDepartment').value,
                semester: document.getElementById('assignmentSemester').value,
                group: document.getElementById('assignmentGroup').value,
                subGroup: document.getElementById('assignmentSubGroup').value,
                subject: document.getElementById('assignmentSubject').value,
                labRoom: document.getElementById('assignmentLabRoom').value,
                theoryFaculty: document.getElementById('assignmentTheoryFaculty').value,
                labFaculty: document.getElementById('assignmentLabFaculty').value
            };

            if (dataManager && dataManager.addAssignment(assignment)) {
                e.target.reset();
            }
        });
    }

    const clearForm = document.getElementById('clearForm');
    if (clearForm) {
        clearForm.addEventListener('click', function() {
            const form = document.getElementById('assignmentForm');
            if (form) form.reset();
        });
    }

    const assignmentSearch = document.getElementById('assignmentSearch');
    if (assignmentSearch) {
        assignmentSearch.addEventListener('input', () => {
            renderAssignmentsList();
            updateSearchStats();
        });
    }
    
    // Add window beforeunload handler
    window.addEventListener('beforeunload', (e) => {
        if (dataManager) {
            dataManager.save();
        }
    });

    const scheduleFilters = ['scheduleFilter', 'scheduleSemesterFilter', 'scheduleGroupFilter'];
    scheduleFilters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', renderSchedule);
        }
    });

    const printFilters = ['printDepartmentFilter', 'printSemesterFilter', 'printGroupFilter'];
    printFilters.forEach(filterId => {
        const filter = document.getElementById(filterId);
        if (filter) {
            filter.addEventListener('change', renderPrintSchedule);
        }
    });

    const masterDataInputs = [
        { id: 'newDepartment', type: 'departments' },
        { id: 'newSemester', type: 'semesters' },
        { id: 'newGroup', type: 'groups' },
        { id: 'newSubGroup', type: 'subGroups' },
        { id: 'newTimeSlot', type: 'timeSlots' },
        { id: 'newSubject', type: 'subjects' },
        { id: 'newLabRoom', type: 'labRooms' }
    ];

    masterDataInputs.forEach(config => {
        const input = document.getElementById(config.id);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    addMasterDataItem(config.type, config.id);
                }
            });
        }
    });

    const facultyInputs = [
        'newTheoryFacultyShort', 'newTheoryFacultyFull', 'newTheoryFacultyDept',
        'newLabFacultyShort', 'newLabFacultyFull', 'newLabFacultyDept'
    ];

    facultyInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const type = inputId.includes('Theory') ? 'theory' : 'lab';
                    addFaculty(type);
                }
            });
        }
    });

    console.log('🏫 Institute Lab Management System Loaded!');
});





// Additional Utility Functions
function exportData() {
    if (!dataManager) return;
    
    const data = {
        ...dataManager.data,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lams-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    notificationManager?.show('Data exported successfully!', 'success');
    debugManager?.log('Data exported', 'info');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('This will replace all current data. Are you sure?')) {
                    // Validate data structure
                    const requiredFields = ['departments', 'semesters', 'groups', 'subGroups', 'assignments'];
                    const isValid = requiredFields.every(field => Array.isArray(data[field]));
                    
                    if (isValid) {
                        dataManager.data = { ...dataManager.data, ...data };
                        dataManager.save();
                        notificationManager?.show('Data imported successfully!', 'success');
                        debugManager?.log('Data imported', 'success', data);
                    } else {
                        throw new Error('Invalid data format');
                    }
                }
            } catch (error) {
                notificationManager?.show('Failed to import data: ' + error.message, 'error');
                debugManager?.log('Import failed', 'error', error);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}



function previewAssignment() {
    const assignment = {
        day: document.getElementById('assignmentDay').value,
        timeSlot: document.getElementById('assignmentTimeSlot').value,
        department: document.getElementById('assignmentDepartment').value,
        semester: document.getElementById('assignmentSemester').value,
        group: document.getElementById('assignmentGroup').value,
        subGroup: document.getElementById('assignmentSubGroup').value,
        subject: document.getElementById('assignmentSubject').value,
        labRoom: document.getElementById('assignmentLabRoom').value,
        theoryFaculty: document.getElementById('assignmentTheoryFaculty').value,
        labFaculty: document.getElementById('assignmentLabFaculty').value
    };
    
    const preview = document.createElement('div');
    preview.className = 'assignment-preview-modal';
    preview.innerHTML = `
        <div class="preview-content">
            <div class="preview-header">
                <h3>Assignment Preview</h3>
                <button onclick="this.closest('.assignment-preview-modal').remove()">&times;</button>
            </div>
            <div class="preview-body">
                <div class="preview-display">
                    <h4>${dataManager?.getAssignmentDisplay(assignment) || 'Preview Assignment'}</h4>
                    <div class="preview-details">
                        <div class="preview-row">
                            <span class="preview-label">Schedule:</span>
                            <span class="preview-value">${assignment.day} | ${assignment.timeSlot}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">Class:</span>
                            <span class="preview-value">${assignment.department} - ${assignment.semester} - ${assignment.group}-${assignment.subGroup}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">Subject:</span>
                            <span class="preview-value">${assignment.subject}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">Lab Room:</span>
                            <span class="preview-value">${assignment.labRoom}</span>
                        </div>
                        <div class="preview-row">
                            <span class="preview-label">Faculty:</span>
                            <span class="preview-value">Theory: ${assignment.theoryFaculty}, Lab: ${assignment.labFaculty}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="preview-actions">
                <button class="btn btn--secondary" onclick="this.closest('.assignment-preview-modal').remove()">Close</button>
                <button class="btn btn--primary" onclick="document.getElementById('assignmentForm').dispatchEvent(new Event('submit')); this.closest('.assignment-preview-modal').remove();">Create Assignment</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(preview);
    setTimeout(() => preview.classList.add('show'), 10);
}

// Enhanced search functionality
function updateSearchStats() {
    const searchInput = document.getElementById('assignmentSearch');
    const statsContainer = document.getElementById('searchStats');
    
    if (!searchInput || !statsContainer || !dataManager) return;
    
    const query = searchInput.value.trim();
    if (query) {
        const results = dataManager.searchAssignments(query);
        statsContainer.innerHTML = `
            <small class="search-result-count">
                ${results.length} result${results.length !== 1 ? 's' : ''} found
            </small>
        `;
        statsContainer.style.display = 'block';
    } else {
        statsContainer.style.display = 'none';
    }
}

// Institute-specific analytics for management
function renderInstituteAnalytics() {
    if (!dataManager) return;
    
    // Lab utilization analysis
    const utilizationData = {};
    dataManager.data.labRooms.forEach(room => {
        utilizationData[room] = dataManager.data.assignments.filter(a => a.labRoom === room).length;
    });
    
    // Faculty workload analysis
    const facultyWorkload = {};
    dataManager.data.assignments.forEach(assignment => {
        facultyWorkload[assignment.theoryFaculty] = (facultyWorkload[assignment.theoryFaculty] || 0) + 1;
        facultyWorkload[assignment.labFaculty] = (facultyWorkload[assignment.labFaculty] || 0) + 1;
    });
    
    // Department distribution
    const deptDistribution = {};
    dataManager.data.assignments.forEach(assignment => {
        deptDistribution[assignment.department] = (deptDistribution[assignment.department] || 0) + 1;
    });
    
    // Time slot efficiency
    const timeSlotUsage = {};
    dataManager.data.timeSlots.forEach(slot => {
        timeSlotUsage[slot] = dataManager.data.assignments.filter(a => a.timeSlot === slot).length;
    });
    
    return {
        labUtilization: utilizationData,
        facultyWorkload: facultyWorkload,
        departmentDistribution: deptDistribution,
        timeSlotEfficiency: timeSlotUsage,
        totalLabs: dataManager.data.assignments.length,
        averageLabsPerDay: (dataManager.data.assignments.length / dataManager.data.days.length).toFixed(1)
    };
}

// Bulk operations for institute management
function bulkAssignFaculty(assignments, theoryFaculty, labFaculty) {
    if (!dataManager || !assignments.length) return false;
    
    assignments.forEach(assignment => {
        const index = dataManager.data.assignments.findIndex(a => 
            a.day === assignment.day && 
            a.timeSlot === assignment.timeSlot && 
            a.department === assignment.department &&
            a.semester === assignment.semester &&
            a.group === assignment.group &&
            a.subGroup === assignment.subGroup
        );
        
        if (index !== -1) {
            if (theoryFaculty) dataManager.data.assignments[index].theoryFaculty = theoryFaculty;
            if (labFaculty) dataManager.data.assignments[index].labFaculty = labFaculty;
        }
    });
    
    dataManager.save();
    dataManager.refreshAllComponents();
    return true;
}

// Generate semester-wise reports
function generateSemesterReport(semester) {
    if (!dataManager) return null;
    
    const semesterAssignments = dataManager.data.assignments.filter(a => a.semester === semester);
    const departments = [...new Set(semesterAssignments.map(a => a.department))];
    const subjects = [...new Set(semesterAssignments.map(a => a.subject))];
    const faculty = [...new Set([...semesterAssignments.map(a => a.theoryFaculty), ...semesterAssignments.map(a => a.labFaculty)])];
    
    return {
        semester,
        totalLabs: semesterAssignments.length,
        departments: departments.length,
        subjects: subjects.length,
        faculty: faculty.length,
        assignments: semesterAssignments
    };
}

// Admin functions
function showUserManagement() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return;
    }
    
    const pendingUsers = JSON.parse(localStorage.getItem(CONFIG.PENDING_USERS_KEY) || '[]');
    const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
    
    const modal = document.createElement('div');
    modal.className = 'user-management-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>User Management</h3>
                <button onclick="this.closest('.user-management-modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="user-section">
                    <h4>Pending Approval (${pendingUsers.length})</h4>
                    <div class="user-list pending-list">
                        ${pendingUsers.length === 0 ? '<p class="empty-state">No pending requests</p>' : 
                          pendingUsers.map(user => `
                            <div class="user-item pending-user">
                                <div class="user-info">
                                    <img src="${user.picture}" class="user-avatar-small" alt="${user.name}">
                                    <div>
                                        <div class="user-name">${user.name}</div>
                                        <div class="user-email">${user.email}</div>
                                        <div class="user-time">Requested: ${new Date(user.loginTime).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div class="user-actions">
                                    <button class="btn btn--sm btn--success" onclick="approveUser('${user.email}'); this.closest('.user-management-modal').remove(); showUserManagement();">Approve</button>
                                    <button class="btn btn--sm btn--danger" onclick="rejectUser('${user.email}'); this.closest('.user-management-modal').remove(); showUserManagement();">Reject</button>
                                </div>
                            </div>
                          `).join('')}
                    </div>
                </div>
                
                <div class="user-section">
                    <h4>Approved Users (${approvedUsers.length})</h4>
                    <div class="user-list approved-list">
                        ${approvedUsers.length === 0 ? '<p class="empty-state">No approved users</p>' : 
                          approvedUsers.map(user => `
                            <div class="user-item approved-user">
                                <div class="user-info">
                                    <img src="${user.picture}" class="user-avatar-small" alt="${user.name}">
                                    <div>
                                        <div class="user-name">${user.name}</div>
                                        <div class="user-email">${user.email}</div>
                                        <div class="user-time">Approved: ${new Date(user.approvedAt).toLocaleString()}</div>
                                    </div>
                                </div>
                                <div class="user-actions">
                                    <button class="btn btn--sm btn--danger" onclick="if(confirm('Remove ${user.name}?')) { removeApprovedUser('${user.email}'); this.closest('.user-management-modal').remove(); showUserManagement(); }">Remove</button>
                                </div>
                            </div>
                          `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Update dashboard stats for admin
function updateAdminStats() {
    if (!window.authManager?.currentUser?.isAdmin) return;
    
    const pendingUsers = JSON.parse(localStorage.getItem(CONFIG.PENDING_USERS_KEY) || '[]');
    const approvedUsers = JSON.parse(localStorage.getItem(CONFIG.APPROVED_USERS_KEY) || '[]');
    
    const approvedCount = document.getElementById('approvedUsersCount');
    const pendingCount = document.getElementById('pendingRequestsCount');
    
    if (approvedCount) approvedCount.textContent = approvedUsers.length;
    if (pendingCount) pendingCount.textContent = pendingUsers.length;
}

function clearAllData() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return;
    }
    
    if (confirm('This will delete ALL lab data. Are you sure?')) {
        if (confirm('This action cannot be undone. Continue?')) {
            localStorage.clear();
            if (dataManager) {
                dataManager.data = {
                    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    timeSlots: [],
                    departments: ["CSE", "ECE", "EEE", "MECH", "CIVIL"],
                    semesters: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
                    groups: ["A", "B", "C", "D"],
                    subGroups: ["1", "2", "3"],
                    subjects: [],
                    labRooms: [],
                    theoryFaculty: [],
                    labFaculty: [],
                    assignments: [],
                    academicYear: "2024-25",
                    scheduleOrientation: "daysHorizontal"
                };
                dataManager.save();
                dataManager.refreshAllComponents();
            }
            showMessage('All data cleared successfully', 'success');
        }
    }
}

function downloadLogs() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return;
    }
    
    const logs = {
        timestamp: new Date().toISOString(),
        user: window.authManager.currentUser,
        dataStats: {
            assignments: window.dataManager?.data.assignments.length || 0,
            faculty: (window.dataManager?.data.theoryFaculty.length || 0) + (window.dataManager?.data.labFaculty.length || 0),
            subjects: window.dataManager?.data.subjects.length || 0,
            rooms: window.dataManager?.data.labRooms.length || 0
        },
        config: CONFIG
    };
    
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lams-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Enhanced import with admin check
function importData() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required for data import', 'error');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('This will replace all current data. Are you sure?')) {
                    const requiredFields = ['departments', 'semesters', 'groups', 'subGroups', 'assignments'];
                    const isValid = requiredFields.every(field => Array.isArray(data[field]));
                    
                    if (isValid) {
                        dataManager.data = { ...dataManager.data, ...data };
                        dataManager.save();
                        showMessage('Data imported successfully!', 'success');
                    } else {
                        throw new Error('Invalid data format');
                    }
                }
            } catch (error) {
                showMessage('Failed to import data: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// Sync Logs Functions
function refreshSyncLogs() {
    const logs = JSON.parse(localStorage.getItem('lams_sync_logs') || '[]');
    const logsList = document.getElementById('syncLogsList');
    
    if (!logsList) return;
    
    if (logs.length === 0) {
        logsList.innerHTML = '<p class="empty-state">No sync logs available.</p>';
        return;
    }
    
    logsList.innerHTML = logs.map(log => {
        const statusIcon = {
            'success': '✅',
            'error': '❌', 
            'info': 'ℹ️'
        }[log.status] || '📝';
        
        const typeLabel = {
            'save': 'Save to Drive',
            'load': 'Load from Drive',
            'auto': 'Auto Sync'
        }[log.type] || log.type;
        
        return `
            <div class="log-entry log-${log.status}">
                <div class="log-header">
                    <span class="log-icon">${statusIcon}</span>
                    <span class="log-type">${typeLabel}</span>
                    <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <div class="log-message">${log.message}</div>
                ${log.details ? `
                    <div class="log-details">
                        <small>${JSON.stringify(log.details, null, 2)}</small>
                    </div>
                ` : ''}
                <div class="log-user">User: ${log.user}</div>
            </div>
        `;
    }).join('');
}

function clearSyncLogs() {
    if (confirm('Are you sure you want to clear all sync logs?')) {
        localStorage.removeItem('lams_sync_logs');
        refreshSyncLogs();
        showMessage('Sync logs cleared', 'success');
    }
}

function exportSyncLogs() {
    const logs = JSON.parse(localStorage.getItem('lams_sync_logs') || '[]');
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sync-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('Sync logs exported', 'success');
}

// Export functions for global access
window.dataManager = dataManager;
window.notificationManager = notificationManager;
window.exportData = exportData;
window.importData = importData;
window.previewAssignment = previewAssignment;
window.updateSearchStats = updateSearchStats;
window.showTab = showTab;
window.showUserManagement = showUserManagement;
window.clearAllData = clearAllData;
window.updateAdminStats = updateAdminStats;
window.addMasterDataItem = addMasterDataItem;
window.addFaculty = addFaculty;
window.deleteMasterDataItem = deleteMasterDataItem;
window.deleteFaculty = deleteFaculty;
window.deleteAssignment = deleteAssignment;
window.editAcademicYear = editAcademicYear;
window.toggleScheduleOrientation = toggleScheduleOrientation;
window.refreshSyncLogs = refreshSyncLogs;
window.clearSyncLogs = clearSyncLogs;
window.exportSyncLogs = exportSyncLogs;
