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
        this.waitingForPermission = false; // Prevent permission spam
        
        // 100% Cloud-based user management (NO localStorage)
        this.pendingUsers = [];
        this.approvedUsers = [];
        
        this.init();
    }

    init() {
        // Load from cloud first, fallback to localStorage only for offline scenarios
        this.loadFromCloud().then(() => {
            this.validateMasterDataIntegrity();
            this.refreshAllComponents();
            
            // Auto-start real-time sync immediately like all modern apps
            setTimeout(() => {
                if (window.authManager && window.authManager.isSignedIn) {
                    console.log('� Auto-starting real-time sync - no user action required');
                    this.startRealTimeSync();
                    showMessage('✅ Real-time sync active across all devices', 'success');
                } else {
                    console.log('💡 LAMS ready. Sign in to enable automatic sync.');
                    this.updateSyncStatus('Sign in to sync');
                }
            }, 1000);
        });
    }

    // Enhanced loading with multiple sync sources
    async loadFromCloud() {
        // Try GitHub sync first if configured
        if (window.githubSync && window.githubSync.isConfigured() && CONFIG.FEATURES.GITHUB_SYNC) {
            try {
                console.log('🐙 Attempting to load from GitHub...');
                const githubData = await window.githubSync.loadFromGitHub();
                if (githubData && Object.keys(githubData).length > 1) {
                    this.data = { ...this.data, ...githubData };
                    this.assignDataArrays();
                    console.log('🐙 Data loaded from GitHub successfully');
                    showMessage('✅ Data loaded from GitHub repository', 'success');
                    return;
                }
            } catch (error) {
                console.log('⚠️ GitHub load failed, trying other sources:', error.message);
            }
        }
        
        // Try free sync as backup
        if (window.freeSync) {
            const syncData = await window.freeSync.loadData();
            if (syncData && Object.keys(syncData).length > 1) {
                this.data = { ...this.data, ...syncData };
                this.assignDataArrays();
                console.log('🔄 Data loaded from free sync');
                return;
            }
        }
        
        if (!window.authManager || !window.authManager.isSignedIn) {
            console.log('🔐 User not signed in - loading default data structure');
            this.initializeDefaultData();
            return;
        }

        try {
            showMessage('☁️ Loading data from Google Drive...', 'info');
            
            // Force cloud loading - no localStorage fallback
            const cloudData = await window.authManager.loadFromDrive(false);
            
            if (cloudData && Object.keys(cloudData).length > 1) {
                // Load main application data from cloud
                this.data = { ...this.data, ...cloudData };
                this.version = cloudData.version || 0;
                this.lastSyncTime = new Date().toISOString();
                
                this.assignDataArrays();

                console.log('📊 Data arrays properly assigned:', {
                    assignments: this.assignments.length,
                    subjects: this.subjects.length,
                    periods: this.periods.length,
                    branches: this.branches.length
                });
                
                // Force refresh of all components to show loaded data
                setTimeout(() => {
                    this.refreshAllComponents();
                    if (typeof renderSchedule === 'function') renderSchedule();
                    if (typeof renderAssignmentList === 'function') renderAssignmentList();
                    if (typeof populateFormDropdowns === 'function') populateFormDropdowns();
                    console.log('🔄 All components refreshed with loaded data');
                }, 500);
                
                // Load user management data from cloud (NO localStorage)
                if (cloudData.userManagement) {
                    console.log('👥 Loading user management from Google Drive');
                    this.pendingUsers = cloudData.userManagement.pendingUsers || [];
                    this.approvedUsers = cloudData.userManagement.approvedUsers || [];
                    console.log('📋 Cloud pending users:', this.pendingUsers.length);
                    console.log('✅ Cloud approved users:', this.approvedUsers.length);
                    
                    // Update UI badge from cloud data
                    if (window.authManager) {
                        window.authManager.updatePendingUsersCountFromCloud(this.pendingUsers.length);
                    }
                } else {
                    // Initialize empty user management for new accounts
                    this.pendingUsers = [];
                    this.approvedUsers = [];
                    console.log('🆕 New account - initializing empty user management');
                }
                
                showMessage('✅ Data loaded from Google Drive successfully!', 'success');
                console.log('☁️ Cloud data loaded successfully');
            } else {
                // No existing data in cloud - initialize with defaults for new account
                console.log('🆕 No existing cloud data found - initializing new account');
                this.initializeDefaultData();
                // Save initial data structure to cloud
                await this.save();
                showMessage('🆕 New account initialized with default data', 'success');
            }
        } catch (error) {
            console.error('❌ Cloud loading failed:', error);
            showMessage('❌ Failed to load from Google Drive. Please check internet connection.', 'error');
            // Initialize defaults for offline operation
            this.initializeDefaultData();
            this.pendingUsers = [];
            this.approvedUsers = [];
        }
    }

    initializeDefaultData() {
        // Initialize with basic data structure
        this.data = {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            timeSlots: ['9:00-10:00', '10:00-11:00', '11:00-12:00', '2:00-3:00', '3:00-4:00'],
            departments: ['Computer Science', 'Mathematics', 'Physics'],
            semesters: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester'],
            groups: ['Group A', 'Group B', 'Group C'],
            subGroups: ['Sub Group 1', 'Sub Group 2'],
            subjects: ['Data Structures', 'Algorithms', 'Database Systems'],
            labRooms: ['Lab 1', 'Lab 2', 'Lab 3'],
            theoryFaculty: ['Dr. Smith', 'Prof. Johnson', 'Dr. Brown'],
            labFaculty: ['Prof. Davis', 'Dr. Wilson', 'Prof. Miller'],
            assignments: [],
            academicYear: '2024-25',
            scheduleOrientation: 'daysHorizontal',
            lastModified: new Date().toISOString(),
            version: 1
        };

        // Properly assign data to individual arrays for CRUD operations
        this.assignments = this.data.assignments || [];
        this.subjects = this.data.subjects || [];
        this.faculties = {
            theoryFaculty: this.data.theoryFaculty || [],
            labFaculty: this.data.labFaculty || []
        };
        this.periods = this.data.timeSlots || [];
        this.branches = this.data.departments || [];
        this.days = this.data.days || [];
        this.timeSlots = this.data.timeSlots || [];
        this.departments = this.data.departments || [];
        this.semesters = this.data.semesters || [];
        this.groups = this.data.groups || [];
        this.subGroups = this.data.subGroups || [];
        this.labRooms = this.data.labRooms || [];

        this.assignDataArrays();
        console.log('🔄 Default data structure initialized with proper array assignments');
        
        // Force refresh after initialization
        setTimeout(() => {
            this.refreshAllComponents();
            console.log('🔄 Components refreshed after default data initialization');
        }, 200);
    }
    
    assignDataArrays() {
        // Properly assign data to individual arrays for CRUD operations
        this.assignments = this.data.assignments || [];
        this.subjects = this.data.subjects || [];
        this.faculties = {
            theoryFaculty: this.data.theoryFaculty || [],
            labFaculty: this.data.labFaculty || []
        };
        this.periods = this.data.timeSlots || [];
        this.branches = this.data.departments || [];
        this.days = this.data.days || [];
        this.timeSlots = this.data.timeSlots || [];
        this.departments = this.data.departments || [];
        this.semesters = this.data.semesters || [];
        this.groups = this.data.groups || [];
        this.subGroups = this.data.subGroups || [];
        this.labRooms = this.data.labRooms || [];
    }

    // 100% Cloud-based saving - NO LOCAL STORAGE
    async save() {
        if (!window.authManager || !window.authManager.isSignedIn) {
            showMessage('� Sign in required to save to Google Drive', 'warning');
            return false;
        }

        try {
            this.data.lastModified = new Date().toISOString();
            this.data.version = (this.data.version || 0) + 1;
            
            // Include user management data in cloud sync (NO localStorage)
            const dataToSync = {
                ...this.data,
                userManagement: {
                    pendingUsers: this.pendingUsers || [],
                    approvedUsers: this.approvedUsers || [],
                    lastUpdated: new Date().toISOString()
                }
            };
            
            console.log('☁️ Saving everything to Google Drive:', {
                pendingCount: (this.pendingUsers || []).length,
                approvedCount: (this.approvedUsers || []).length
            });
            
            const success = await window.authManager.saveToGoogleDrive(dataToSync, true);
            if (success) {
                this.lastSyncTime = new Date().toISOString();
                this.syncFailureCount = 0;
                showMessage('✅ All data saved to Google Drive', 'success');
                return true;
            } else {
                throw new Error('Cloud save failed');
            }
        } catch (error) {
            console.error('❌ Failed to save to Google Drive:', error);
            showMessage('❌ Failed to save to Google Drive', 'error');
            this.syncFailureCount = (this.syncFailureCount || 0) + 1;
            return false;
        }
    }

    // Real-time synchronization with smart user interaction detection
    startRealTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        console.log('▶️ Starting intelligent real-time sync...');
        
        // Update status immediately
        this.updateSyncStatus('Smart sync active');
        
        // Enhanced interaction tracking
        this.lastUserActivity = Date.now();
        this.isDropdownOpen = false;
        this.isFormActive = false;
        this.isSyncInProgress = false;
        this.setupAdvancedInteractionTracking();
        
        // Intelligent sync every 5 seconds - much faster for real-time feel
        this.syncInterval = setInterval(async () => {
            if (window.authManager && window.authManager.isSignedIn) {
                // Skip sync if any interactive element is active
                if (this.shouldSkipSync()) {
                    console.log('⏸️ Sync paused - user interface active');
                    return;
                }
                
                try {
                    this.isSyncInProgress = true;
                    const result = await this.syncWithCloud();
                    this.isSyncInProgress = false;
                    
                    if (result) {
                        console.log('✅ Background sync completed successfully');
                        this.updateSyncStatus('Synced ' + new Date().toLocaleTimeString());
                    }
                } catch (error) {
                    this.isSyncInProgress = false;
                    console.log('⏸️ Background sync skipped:', error.message);
                }
            } else {
                this.stopRealTimeSync();
            }
        }, 5000); // 5 second intervals for real-time sync
        
        console.log('🎯 Smart sync active - detects dropdowns and form interactions');
    }

    setupAdvancedInteractionTracking() {
        // Track all user interactions
        const events = ['click', 'keypress', 'input', 'change', 'focus', 'mousemove'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.lastUserActivity = Date.now();
            }, true);
        });

        // Specifically detect dropdown interactions
        document.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'SELECT' || e.target.closest('select')) {
                this.isDropdownOpen = true;
                console.log('🎯 Dropdown opened - sync paused');
                // Set a longer pause for dropdown interactions
                setTimeout(() => {
                    this.isDropdownOpen = false;
                    console.log('🎯 Dropdown timeout - sync can resume');
                }, 3000); // 3 seconds for dropdown selection
            }
        }, true);

        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                console.log('🎯 Dropdown selection made');
                // Give extra time after selection before resuming sync
                setTimeout(() => {
                    this.isDropdownOpen = false;
                    console.log('🎯 Dropdown closed - sync can resume');
                }, 2000); // Wait 2 seconds after selection
            }
        }, true);

        // Detect form interactions
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                this.isFormActive = true;
                console.log('📝 Form active - sync paused');
            }
        }, true);

        document.addEventListener('focusout', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                setTimeout(() => {
                    this.isFormActive = false;
                    console.log('📝 Form inactive - sync can resume');
                }, 500);
            }
        }, true);
    }

    // Comprehensive check for when to skip sync
    shouldSkipSync() {
        const now = Date.now();
        const timeSinceActivity = now - this.lastUserActivity;
        
        // Check if dropdown is open
        if (this.isDropdownOpen) {
            this.updateSyncStatus('Paused - dropdown open');
            return true;
        }
        
        // Check if form is active
        if (this.isFormActive) {
            this.updateSyncStatus('Paused - form active');
            return true;
        }
        
        // Check if user is actively filling assignment form
        const assignmentForm = document.getElementById('assignmentForm');
        const isFillingForm = assignmentForm && Array.from(assignmentForm.elements).some(element => 
            element === document.activeElement || element.value.trim() !== ''
        );
        
        // Skip if any of these conditions are true:
        const shouldSkip = (
            timeSinceActivity < 3000 ||  // User active in last 3 seconds (increased)
            this.isSyncInProgress ||     // Sync already running
            document.activeElement?.tagName === 'SELECT' ||  // Select element focused
            document.activeElement?.tagName === 'INPUT' ||   // Input element focused
            document.querySelector('select:focus') ||        // Any select has focus
            document.querySelector('input:focus') ||         // Any input has focus
            !!document.querySelector('.dropdown-open') ||   // Custom dropdown open
            isFillingForm                                    // User filling assignment form
        );
        
        if (shouldSkip) {
            if (isFillingForm) {
                this.updateSyncStatus('Paused - creating assignment');
            } else if (timeSinceActivity < 3000) {
                this.updateSyncStatus('Paused - user active');
            }
        }
        
        return shouldSkip;
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
                // Only show the first time, then wait silently
                if (!this.waitingForPermission) {
                    this.waitingForPermission = true;
                    console.log('⏸️ Waiting for Google Drive permissions - sync will start automatically once granted');
                    this.updateSyncStatus('Waiting for permission');
                    
                    // Try to get permission with popup (one time only)
                    setTimeout(async () => {
                        try {
                            const popupToken = await window.authManager.getAccessToken(true);
                            if (popupToken) {
                                this.waitingForPermission = false;
                                this.updateSyncStatus('Auto-sync active');
                                console.log('✅ Permissions granted - sync now active');
                            }
                        } catch (error) {
                            console.log('💡 User can enable sync by interacting with any Google Drive feature');
                        }
                    }, 2000);
                }
                return false;
            }
            
            // Reset flag when we have token
            if (this.waitingForPermission) {
                this.waitingForPermission = false;
                this.updateSyncStatus('Auto-sync active');
                console.log('✅ Sync permissions now available - continuing with normal operation');
            }

            console.log('🔄 Starting cloud sync...');
            
            // Load cloud version using existing token (no popups for background sync)
            const cloudData = await window.authManager.loadFromDrive(false);
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
                
                // Properly assign data to individual arrays for immediate access
                this.assignments = this.data.assignments || [];
                this.subjects = this.data.subjects || [];
                this.faculties = {
                    theoryFaculty: this.data.theoryFaculty || [],
                    labFaculty: this.data.labFaculty || []
                };
                this.periods = this.data.timeSlots || [];
                this.branches = this.data.departments || [];
                
                console.log('📊 Data updated from cloud:', {
                    assignments: this.assignments.length,
                    subjects: this.subjects.length,
                    faculty: this.data.theoryFaculty.length + this.data.labFaculty.length
                });
                
                // Update UI to reflect changes
                setTimeout(() => {
                    this.refreshAllComponents();
                    showMessage('✅ Data synced from cloud', 'success');
                }, 100);
                return true;
            }

            // If local is newer, save to cloud
            if (localVersion > cloudVersion || (localVersion === cloudVersion && localTime > cloudTime)) {
                console.log('⬆️ Saving newer local data to cloud');
                const success = await window.authManager.saveToGoogleDrive(this.data, false); // No popups for background sync
                if (success) {
                    this.lastSyncTime = new Date().toISOString();
                    showMessage('☁️ Local changes synced to cloud', 'success');
                }
                return true;
            }

            console.log('✅ Data already in sync');
            this.lastSyncTime = new Date().toISOString();
            this.updateSyncStatus('Auto-sync active');
            return true;

        } catch (error) {
            console.log('❌ Cloud sync failed:', error);
            showMessage('⚠️ Cloud sync failed - working offline', 'warning');
            return false;
        }
    }

    updateSyncStatus(status) {
        const syncStatusText = document.getElementById('syncStatusText');
        const syncIcon = document.querySelector('#syncStatus .nav-icon');
        
        if (syncStatusText) {
            syncStatusText.textContent = status;
        }
        
        // Update icon based on status
        if (syncIcon) {
            if (status.includes('Syncing')) {
                syncIcon.textContent = '🔄';
            } else if (status.includes('Synced') || status.includes('Active')) {
                syncIcon.textContent = '✅';
            } else if (status.includes('Ready') || status.includes('Available')) {
                syncIcon.textContent = '☁️';
            } else {
                syncIcon.textContent = '🔄';
            }
        }
    }

    stopRealTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            this.updateSyncStatus('Sync stopped');
            console.log('🛑 Real-time sync stopped');
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
        console.log('🚀 Triggering immediate sync after data change');
        
        if (window.authManager && window.authManager.isSignedIn) {
            // Sync to Google Drive immediately
            this.syncWithCloud().then(() => {
                console.log('✅ Google Drive sync completed - changes visible to all users');
                this.updateSyncStatus('✅ Synced to all devices');
                showMessage('✅ Changes synced to Google Drive!', 'success');
                
                // Also sync to GitHub if configured
                if (window.githubSync && window.githubSync.isConfigured() && CONFIG.FEATURES.GITHUB_SYNC) {
                    window.githubSync.syncToGitHub(this.data).then(success => {
                        if (success) {
                            console.log('🐙 GitHub sync completed successfully');
                            showMessage('🐙 Changes also synced to GitHub!', 'success');
                        }
                    }).catch(error => {
                        console.log('⚠️ GitHub sync failed:', error);
                    });
                }
            }).catch(error => {
                console.log('⚠️ Google Drive sync failed:', error);
                showMessage('⚠️ Sync failed - try again', 'warning');
            });
        } else {
            console.log('💡 Not signed in - changes saved locally only');
            showMessage('💡 Sign in to sync changes to all users', 'info');
        }
        
        // Always ensure UI is updated immediately regardless of sync status
        setTimeout(() => {
            this.refreshAllComponents();
        }, 100);
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
        
        // Immediately update UI and sync
        this.refreshAllComponents();
        this.save();
        this.triggerImmediateSync(); // Sync immediately after adding
        
        showMessage('✅ Item added and synced to all users!', 'success');
        console.log('✅ Master data item added and UI refreshed immediately');
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
        
        // Immediately update UI and sync
        this.refreshAllComponents();
        this.save();
        this.triggerImmediateSync(); // Sync immediately after adding faculty
        
        showMessage('✅ Faculty added and synced to all users!', 'success');
        console.log('✅ Faculty added and UI refreshed immediately');
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
            
            // Immediately update UI and sync
            this.refreshAllComponents();
            this.save();
            this.triggerImmediateSync(); // Sync immediately after master data deletion
            
            showMessage('✅ Item deleted and synced to all users!', 'success');
            console.log('✅ Master data item deleted and UI refreshed immediately');
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
            
            // Immediately update UI and sync
            this.refreshAllComponents();
            this.save();
            this.triggerImmediateSync(); // Sync immediately after faculty deletion
            
            showMessage('✅ Faculty deleted and synced to all users!', 'success');
            console.log('✅ Faculty deleted and UI refreshed immediately');
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
        // Validate all required fields
        const requiredFields = ['day', 'timeSlot', 'department', 'semester', 'group', 'subGroup', 'subject', 'labRoom', 'theoryFaculty', 'labFaculty'];
        const missingFields = requiredFields.filter(field => !assignment[field] || assignment[field].trim() === '');
        
        if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
            alert(errorMsg);
            console.log('❌ Assignment validation failed - missing fields:', missingFields);
            return false;
        }

        console.log('📝 Creating assignment:', assignment);

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
            console.log('❌ Assignment conflict detected:', conflicts);
            return false;
        }

        // Add assignment to data
        this.data.assignments.push(assignment);
        console.log('✅ Assignment added to data. Total assignments:', this.data.assignments.length);
        
        // Immediately update UI before saving/syncing
        this.assignments = this.data.assignments; // Update local reference
        this.refreshAllComponents(); // Refresh UI immediately
        
        this.save();
        this.triggerImmediateSync(); // Sync immediately after adding assignment
        
        showMessage('✅ Assignment created successfully!', 'success');
        console.log('✅ Assignment added and UI refreshed immediately');
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
        
        // Immediately update UI and sync
        document.getElementById('currentAcademicYear').textContent = this.data.academicYear;
        document.getElementById('printAcademicYear').textContent = this.data.academicYear;
        this.save();
        this.triggerImmediateSync(); // Sync immediately after academic year change
        
        showMessage('✅ Academic year updated and synced to all users!', 'success');
        console.log('✅ Academic year updated and synced immediately');
        return true;
    }

    toggleScheduleOrientation() {
        this.data.scheduleOrientation = this.data.scheduleOrientation === "daysHorizontal" 
            ? "timesHorizontal" 
            : "daysHorizontal";
        
        // Immediately update UI and sync
        this.save();
        this.triggerImmediateSync(); // Sync immediately after orientation change
        this.refreshAllComponents();
        
        console.log('✅ Schedule orientation changed and synced immediately');
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
            console.log('🔄 Refreshing all components with current data:', {
                assignments: this.data.assignments.length,
                subjects: this.data.subjects.length,
                faculty: this.data.theoryFaculty.length + this.data.labFaculty.length
            });
            
            // Skip refresh if user is actively interacting with forms
            const activeElement = document.activeElement;
            const isUserInteracting = activeElement && (
                activeElement.tagName === 'SELECT' ||
                activeElement.tagName === 'INPUT' ||
                activeElement.closest('#assignmentForm')
            );
            
            if (!isUserInteracting) {
                refreshDropdowns();
            }
            
            updateCountBadges();
            renderDashboard();
            renderAssignmentsList();
            renderSchedule();
            renderMasterDataLists();
            renderPrintSchedule();
            
            // Force update the current tab if it's analytics
            const activeTab = document.querySelector('.nav-tab.active');
            if (activeTab && activeTab.textContent.trim().includes('Analytics')) {
                setTimeout(() => {
                    renderAnalytics();
                }, 200);
            }
            
            console.log('✅ All components refreshed successfully');
        } catch (e) {
            console.error('Error refreshing components:', e);
            showMessage('⚠️ Some components failed to refresh', 'warning');
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
    // Fallback for missing message system
    if (!document.querySelector('.container')) {
        alert(text);
        return;
    }
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
    const currentYear = window.dataManager.data.academicYear;
    const newYear = prompt("Enter academic year (e.g., 2024-25):", currentYear);
    if (newYear && newYear !== currentYear) {
        window.dataManager.setAcademicYear(newYear);
    }
}

function toggleScheduleOrientation() {
    const newOrientation = window.dataManager.toggleScheduleOrientation();
    const orientationText = newOrientation === "daysHorizontal" 
        ? "Days as Columns" 
        : "Times as Columns";
    showMessage(`Schedule view changed to ${orientationText}`, 'success');
}

function refreshDropdowns() {
    if (!window.dataManager) return;
    
    // Store all current form values before refresh
    const formValues = {};
    const assignmentForm = document.getElementById('assignmentForm');
    if (assignmentForm) {
        const formData = new FormData(assignmentForm);
        for (let [key, value] of formData.entries()) {
            formValues[key] = value;
        }
    }
    
    const dropdownConfigs = [
        { id: 'assignmentTimeSlot', data: window.dataManager.data.timeSlots },
        { id: 'assignmentDepartment', data: window.dataManager.data.departments },
        { id: 'assignmentSemester', data: window.dataManager.data.semesters },
        { id: 'assignmentGroup', data: window.dataManager.data.groups },
        { id: 'assignmentSubGroup', data: window.dataManager.data.subGroups },
        { id: 'assignmentSubject', data: window.dataManager.data.subjects },
        { id: 'assignmentLabRoom', data: window.dataManager.data.labRooms },
        { id: 'assignmentTheoryFaculty', data: window.dataManager.getFacultyDisplayNames('theory') },
        { id: 'assignmentLabFaculty', data: window.dataManager.getFacultyDisplayNames('lab') },
        { id: 'scheduleFilter', data: window.dataManager.data.departments },
        { id: 'scheduleSemesterFilter', data: window.dataManager.data.semesters },
        { id: 'scheduleGroupFilter', data: window.dataManager.data.groups },
        { id: 'printDepartmentFilter', data: window.dataManager.data.departments },
        { id: 'printSemesterFilter', data: window.dataManager.data.semesters },
        { id: 'printGroupFilter', data: window.dataManager.data.groups },
        { id: 'newTheoryFacultyDept', data: window.dataManager.data.departments },
        { id: 'newLabFacultydept', data: window.dataManager.data.departments }
    ];

    dropdownConfigs.forEach(config => {
        const select = document.getElementById(config.id);
        if (select && config.data) {
            const currentValue = select.value;
            
            // Skip refresh if user is actively using this dropdown
            if (document.activeElement === select) {
                return;
            }
            
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
            
            // Restore previous value
            if (currentValue && config.data.some(item => 
                (typeof item === 'object' ? item.value : item) === currentValue
            )) {
                select.value = currentValue;
            }
        }
    });
    
    // Restore all form values after dropdown refresh
    setTimeout(() => {
        Object.keys(formValues).forEach(key => {
            const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
            if (element && element.value !== formValues[key]) {
                element.value = formValues[key];
            }
        });
    }, 50);
}

function updateCountBadges() {
    if (!window.dataManager) return;
    
    const counts = {
        departmentsCount: window.dataManager.data.departments.length,
        semestersCount: window.dataManager.data.semesters.length,
        groupsCount: window.dataManager.data.groups.length,
        subGroupsCount: window.dataManager.data.subGroups.length,
        timeSlotsCount: window.dataManager.data.timeSlots.length,
        subjectsCount: window.dataManager.data.subjects.length,
        labRoomsCount: window.dataManager.data.labRooms.length,
        theoryFacultyCount: window.dataManager.data.theoryFaculty.length,
        labFacultyCount: window.dataManager.data.labFaculty.length
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
    if (!dataManager) {
        console.error('❌ DataManager not available for renderAssignmentsList');
        return;
    }
    
    const list = document.getElementById('assignmentsList');
    const searchInput = document.getElementById('assignmentSearch');
    if (!list) {
        console.error('❌ assignmentsList element not found');
        return;
    }
    
    console.log('📋 Rendering assignments list with data:', {
        total: dataManager.data.assignments.length,
        assignments: dataManager.data.assignments.map(a => `${a.subject} - ${a.department}`)
    });
    
    const query = searchInput ? searchInput.value : '';
    const assignments = dataManager.searchAssignments(query);
    
    if (assignments.length === 0) {
        const message = query ? 
            'No assignments match your search.' : 
            'No assignments created yet. Click "Add Assignment" to create your first lab assignment.';
        list.innerHTML = `<p class="empty-state">${message}</p>`;
        console.log('📋 No assignments to display');
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
    
    console.log(`✅ Rendered ${assignments.length} assignments successfully`);
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
    if (!window.dataManager) return;
    
    try {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            showMessage('📊 Loading analytics library...', 'info');
            setTimeout(renderAnalytics, 1000); // Retry after 1 second
            return;
        }
        
        console.log('📊 Rendering analytics with data:', {
            assignments: window.dataManager.data.assignments.length,
            faculty: window.dataManager.data.theoryFaculty.length + window.dataManager.data.labFaculty.length
        });
        
        renderFacultyWorkloadChart();
        renderSubjectDistributionChart();
        renderRoomUtilizationChart();
        renderDepartmentOverviewChart();
        renderTimeSlotChart();
        renderHeatmapChart();
        
        // Enhanced Interactive Analytics
        renderSubjectFacultyChart();
        renderWeeklyWorkloadChart();
        renderDepartmentResourceChart();
        renderFacultyWorkloadTable();
        updateAnalyticsFilters();
        
        showMessage('📊 Analytics loaded successfully!', 'success');
    } catch (e) {
        console.error('Error rendering analytics:', e);
        showMessage('❌ Analytics failed to load. Refreshing...', 'error');
        setTimeout(renderAnalytics, 2000);
    }
}

function renderFacultyWorkloadChart() {
    const ctx = document.getElementById('facultyWorkloadChart');
    if (!ctx || !window.dataManager) {
        console.log('📊 Faculty workload chart: missing element or data manager');
        return;
    }

    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.log('📊 Chart.js not ready, retrying in 1 second...');
        setTimeout(renderFacultyWorkloadChart, 1000);
        return;
    }

    const facultyWorkload = {};
    
    window.dataManager.data.assignments.forEach(assignment => {
        if (assignment.theoryFaculty) {
            facultyWorkload[assignment.theoryFaculty] = (facultyWorkload[assignment.theoryFaculty] || 0) + 1;
        }
        if (assignment.labFaculty) {
            facultyWorkload[assignment.labFaculty] = (facultyWorkload[assignment.labFaculty] || 0) + 1;
        }
    });

    if (ctx.chart) ctx.chart.destroy();
    
    console.log('📊 Rendering faculty workload chart with data:', facultyWorkload);

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
    if (!ctx || !window.dataManager) return;

    const subjectCount = {};
    window.dataManager.data.assignments.forEach(assignment => {
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
    if (!ctx || !window.dataManager) return;

    const roomCount = {};
    window.dataManager.data.assignments.forEach(assignment => {
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
    if (!ctx || !window.dataManager) return;

    const deptCount = {};
    window.dataManager.data.assignments.forEach(assignment => {
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
    if (!ctx || !window.dataManager) return;

    const timeSlotCount = {};
    window.dataManager.data.assignments.forEach(assignment => {
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
    if (!ctx || !window.dataManager) return;

    const heatmapData = {};
    window.dataManager.data.days.forEach(day => {
        heatmapData[day] = {};
        window.dataManager.data.timeSlots.forEach(timeSlot => {
            heatmapData[day][timeSlot] = 0;
        });
    });

    window.dataManager.data.assignments.forEach(assignment => {
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

// Enhanced Interactive Analytics Functions

function updateAnalyticsFilters() {
    if (!window.dataManager) return;
    
    // Update subject filter
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) {
        subjectFilter.innerHTML = '<option value="">All Subjects</option>';
        window.dataManager.data.subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectFilter.appendChild(option);
        });
    }
    
    // Update department filter
    const departmentFilter = document.getElementById('departmentFilter');
    if (departmentFilter) {
        departmentFilter.innerHTML = '<option value="">All Departments</option>';
        window.dataManager.data.departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            departmentFilter.appendChild(option);
        });
    }
}

function renderSubjectFacultyChart() {
    const ctx = document.getElementById('subjectFacultyChart');
    if (!ctx || !window.dataManager) return;

    const subjectFacultyData = {};
    
    // Analyze faculty assignments per subject
    window.dataManager.data.assignments.forEach(assignment => {
        if (!subjectFacultyData[assignment.subject]) {
            subjectFacultyData[assignment.subject] = new Set();
        }
        subjectFacultyData[assignment.subject].add(assignment.theoryFaculty);
        subjectFacultyData[assignment.subject].add(assignment.labFaculty);
    });

    // Convert to counts
    const subjects = Object.keys(subjectFacultyData);
    const facultyCounts = subjects.map(subject => subjectFacultyData[subject].size);
    
    // Update statistics
    const avgFaculty = facultyCounts.reduce((a, b) => a + b, 0) / facultyCounts.length || 0;
    const mostPopular = subjects[facultyCounts.indexOf(Math.max(...facultyCounts))] || '-';
    
    document.getElementById('avgFacultyPerSubject').textContent = avgFaculty.toFixed(1);
    document.getElementById('mostPopularSubject').textContent = mostPopular;

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjects,
            datasets: [{
                label: 'Faculty Count per Subject',
                data: facultyCounts,
                backgroundColor: '#1FB8CD',
                borderColor: '#0EA5E9',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} faculty members assigned`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Faculty'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Subjects'
                    }
                }
            }
        }
    });
}

function renderWeeklyWorkloadChart() {
    const ctx = document.getElementById('weeklyWorkloadChart');
    if (!ctx || !window.dataManager) return;

    const showTheoryOnly = document.getElementById('showTheoryOnly')?.checked;
    const showLabOnly = document.getElementById('showLabOnly')?.checked;
    
    const dayWorkload = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => dayWorkload[day] = 0);
    
    window.dataManager.data.assignments.forEach(assignment => {
        if (assignment.day && dayWorkload.hasOwnProperty(assignment.day)) {
            let count = 1;
            if (showTheoryOnly && assignment.theoryFaculty) count = 1;
            else if (showLabOnly && assignment.labFaculty) count = 1;
            else if (!showTheoryOnly && !showLabOnly) count = 1;
            else count = 0;
            
            dayWorkload[assignment.day] += count;
        }
    });
    
    // Update statistics
    const workloadValues = Object.values(dayWorkload);
    const peakDay = days[workloadValues.indexOf(Math.max(...workloadValues))];
    const totalHours = workloadValues.reduce((a, b) => a + b, 0);
    
    document.getElementById('peakDay').textContent = peakDay;
    document.getElementById('totalWeeklyHours').textContent = totalHours;

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Daily Workload',
                data: Object.values(dayWorkload),
                borderColor: '#FFC185',
                backgroundColor: 'rgba(255, 193, 133, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Sessions'
                    }
                }
            }
        }
    });
}

function renderDepartmentResourceChart() {
    const ctx = document.getElementById('departmentResourceChart');
    if (!ctx || !window.dataManager) return;

    const selectedDept = document.getElementById('departmentFilter')?.value;
    
    let assignments = window.dataManager.data.assignments;
    if (selectedDept) {
        assignments = assignments.filter(a => a.department === selectedDept);
    }
    
    const labRooms = [...new Set(assignments.map(a => a.labRoom))].length;
    const totalLabRooms = window.dataManager.data.labRooms.length;
    const labUtilization = totalLabRooms > 0 ? (labRooms / totalLabRooms * 100) : 0;
    
    const facultyCount = new Set([...assignments.map(a => a.theoryFaculty), ...assignments.map(a => a.labFaculty)]).size;
    const totalFaculty = window.dataManager.data.theoryFaculty.length + window.dataManager.data.labFaculty.length;
    const facultyEfficiency = totalFaculty > 0 ? (facultyCount / totalFaculty * 100) : 0;
    
    // Update statistics
    document.getElementById('labUtilization').textContent = `${labUtilization.toFixed(1)}%`;
    document.getElementById('facultyEfficiency').textContent = `${facultyEfficiency.toFixed(1)}%`;
    
    const resourceData = {
        'Lab Utilization': labUtilization,
        'Faculty Efficiency': facultyEfficiency,
        'Room Occupancy': assignments.length > 0 ? (assignments.length / window.dataManager.data.timeSlots.length * 100) : 0
    };

    if (ctx.chart) ctx.chart.destroy();

    ctx.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(resourceData),
            datasets: [{
                data: Object.values(resourceData),
                backgroundColor: ['#B4413C', '#5D878F', '#DB4545'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

function updateSubjectFacultyAnalysis() {
    renderSubjectFacultyChart();
}

function updateWeeklyWorkload() {
    renderWeeklyWorkloadChart();
}

function updateDepartmentAnalysis() {
    renderDepartmentResourceChart();
}

function renderFacultyWorkloadTable() {
    if (!window.dataManager) return;
    
    const tableContainer = document.getElementById('facultyWorkloadTable');
    if (!tableContainer) return;
    
    const facultyWorkload = {};
    const facultySubjects = {};
    
    // Collect all faculty and their assignments
    window.dataManager.data.assignments.forEach(assignment => {
        // Theory faculty
        if (assignment.theoryFaculty) {
            if (!facultyWorkload[assignment.theoryFaculty]) {
                facultyWorkload[assignment.theoryFaculty] = { theory: 0, lab: 0, type: 'Theory' };
                facultySubjects[assignment.theoryFaculty] = new Set();
            }
            facultyWorkload[assignment.theoryFaculty].theory++;
            facultySubjects[assignment.theoryFaculty].add(assignment.subject);
        }
        
        // Lab faculty
        if (assignment.labFaculty) {
            if (!facultyWorkload[assignment.labFaculty]) {
                facultyWorkload[assignment.labFaculty] = { theory: 0, lab: 0, type: 'Lab' };
                facultySubjects[assignment.labFaculty] = new Set();
            }
            facultyWorkload[assignment.labFaculty].lab++;
            facultySubjects[assignment.labFaculty].add(assignment.subject);
        }
    });
    
    const maxLoad = Math.max(...Object.values(facultyWorkload).map(f => f.theory + f.lab), 1);
    
    let tableHTML = `
        <table class="workload-table" style="width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.05); border-radius: 8px; overflow: hidden;">
            <thead>
                <tr>
                    <th style="padding: 12px; background: rgba(255, 255, 255, 0.1); font-weight: bold;">Faculty</th>
                    <th style="padding: 12px; background: rgba(255, 255, 255, 0.1); font-weight: bold;">Type</th>
                    <th style="padding: 12px; background: rgba(255, 255, 255, 0.1); font-weight: bold;">Theory Load</th>
                    <th style="padding: 12px; background: rgba(255, 255, 255, 0.1); font-weight: bold;">Lab Load</th>
                    <th style="padding: 12px; background: rgba(255, 255, 255, 0.1); font-weight: bold;">Total Load</th>
                    <th style="padding: 12px; background: rgba(255, 255, 255, 0.1); font-weight: bold;">Subjects</th>
                    <th style="padding: 12px; background: rgba(255, 255, 255, 0.1); font-weight: bold;">Workload</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    Object.entries(facultyWorkload).forEach(([faculty, load]) => {
        const totalLoad = load.theory + load.lab;
        const workloadPercent = (totalLoad / maxLoad) * 100;
        const subjects = Array.from(facultySubjects[faculty]);
        
        tableHTML += `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);" onmouseover="this.style.background='rgba(255, 255, 255, 0.05)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px; font-weight: bold;">${faculty}</td>
                <td style="padding: 12px;">
                    <span style="background: ${load.type === 'Theory' ? '#1FB8CD' : '#FFC185'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${load.type}
                    </span>
                </td>
                <td style="padding: 12px; text-align: center; font-weight: bold; color: #4CAF50;">${load.theory}</td>
                <td style="padding: 12px; text-align: center; font-weight: bold; color: #FFC185;">${load.lab}</td>
                <td style="padding: 12px; text-align: center; font-weight: bold; font-size: 1.1rem;">${totalLoad}</td>
                <td style="padding: 12px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${subjects.map(subject => 
                            `<span style="background: linear-gradient(45deg, #1FB8CD, #0EA5E9); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; white-space: nowrap;">${subject}</span>`
                        ).join('')}
                    </div>
                </td>
                <td style="padding: 12px; width: 150px;">
                    <div style="width: 100%; height: 20px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; overflow: hidden; position: relative;">
                        <div style="height: 100%; background: linear-gradient(90deg, #4CAF50, #45a049); border-radius: 10px; width: ${workloadPercent}%; transition: width 0.3s ease;"></div>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.8rem; font-weight: bold; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
                            ${workloadPercent.toFixed(0)}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    
    if (Object.keys(facultyWorkload).length === 0) {
        tableContainer.innerHTML = '<p class="empty-state">No faculty assignments found. Create some assignments first.</p>';
    } else {
        tableContainer.innerHTML = tableHTML;
    }
}

function updateFacultyWorkloadTable() {
    if (!window.dataManager) return;
    
    const typeFilter = document.getElementById('facultyTypeFilter')?.value || 'all';
    const searchFilter = document.getElementById('facultySearchFilter')?.value.toLowerCase() || '';
    
    renderFacultyWorkloadTable();
    
    // Apply filters
    const table = document.querySelector('.workload-table');
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const facultyName = row.cells[0].textContent.toLowerCase();
        const facultyType = row.cells[1].textContent.toLowerCase();
        
        let showRow = true;
        
        // Type filter
        if (typeFilter !== 'all') {
            showRow = showRow && facultyType.includes(typeFilter);
        }
        
        // Search filter
        if (searchFilter) {
            showRow = showRow && facultyName.includes(searchFilter);
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

function renderPrintSchedule() {
    if (!window.dataManager) return;
    
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
        if (dataManager.removeMasterDataItem(type, value)) {
            // Force immediate UI refresh after deletion
            setTimeout(() => {
                renderMasterDataLists();
                refreshDropdowns();
                updateCountBadges();
                console.log('🔄 UI updated immediately after master data deletion');
            }, 50);
        }
    }
}

function deleteFaculty(type, shortName) {
    if (!dataManager) return;
    
    if (confirm(`Are you sure you want to delete faculty "${shortName}"?`)) {
        if (dataManager.removeFaculty(type, shortName)) {
            // Force immediate UI refresh after deletion
            setTimeout(() => {
                renderMasterDataLists();
                refreshDropdowns();
                updateCountBadges();
                console.log('🔄 UI updated immediately after faculty deletion');
            }, 50);
        }
    }
}

function deleteAssignment(index) {
    if (!dataManager) return;
    
    if (confirm('Are you sure you want to delete this assignment?')) {
        if (dataManager.removeAssignment(index)) {
            // Force immediate UI refresh after deletion
            setTimeout(() => {
                renderAssignmentsList();
                renderSchedule();
                renderDashboard();
                updateCountBadges();
                console.log('🔄 UI updated immediately after assignment deletion');
            }, 50);
        }
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
        case 'activity':
            setTimeout(refreshActivityFeed, 100);
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
        console.log('🚀 LAMS Application Starting...');
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.style.display = 'none';
        
        // Initialize managers
        window.notificationManager = new NotificationManager();
        window.dataManager = new DataManager();
        
        console.log('✅ DataManager initialized and assigned to window.dataManager');
        console.log('🔍 DataManager properties:', Object.keys(window.dataManager));
        
        // Check Chart.js availability
        let chartCheckCount = 0;
        const checkChartJS = () => {
            if (typeof Chart !== 'undefined') {
                console.log('✅ Chart.js loaded successfully');
                return;
            }
            
            chartCheckCount++;
            if (chartCheckCount < 10) {
                console.log(`⏳ Waiting for Chart.js... (attempt ${chartCheckCount})`);
                setTimeout(checkChartJS, 1000);
            } else {
                console.error('❌ Chart.js failed to load after 10 seconds');
                showMessage('📊 Analytics charts may not display correctly', 'warning');
            }
        };
        
        setTimeout(checkChartJS, 1000);
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showMessage('Failed to initialize application. Please refresh the page.', 'error');
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
            console.log('📝 Form submitted - creating assignment...');
            
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

            console.log('📋 Assignment data collected:', assignment);

            if (!dataManager) {
                console.error('❌ DataManager not available');
                alert('System error - DataManager not found. Please refresh the page.');
                return;
            }

            try {
                if (dataManager.addAssignment(assignment)) {
                    console.log('✅ Assignment created successfully, clearing form...');
                    e.target.reset();
                    alert('Assignment created successfully!');
                    // Refresh UI
                    setTimeout(() => {
                        if (typeof renderAssignmentsList === 'function') renderAssignmentsList();
                        if (typeof renderSchedule === 'function') renderSchedule();
                        if (typeof renderDashboard === 'function') renderDashboard();
                        if (typeof updateCountBadges === 'function') updateCountBadges();
                        console.log('🔄 UI updated after assignment creation');
                    }, 100);
                } else {
                    console.log('❌ Assignment creation failed');
                    alert('Assignment creation failed. Check console for details.');
                }
            } catch (error) {
                console.error('❌ Error creating assignment:', error);
                alert('Error: ' + error.message);
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
    
    // Enhanced sync activation function
    window.activateRealTimeSync = function() {
        if (window.dataManager) {
            console.log('🚀 Activating real-time sync after sign-in');
            if (!window.dataManager.syncInterval) {
                window.dataManager.startRealTimeSync();
            }
            window.dataManager.updateSyncStatus('✅ Real-time sync active');
            showMessage('✅ Real-time sync activated - changes will sync to all users!', 'success');
        }
    };
    
    // Enhanced sync deactivation function
    window.deactivateRealTimeSync = function() {
        if (window.dataManager) {
            console.log('⏸️ Deactivating real-time sync after sign-out');
            window.dataManager.stopRealTimeSync();
            window.dataManager.updateSyncStatus('Sign in to sync');
            showMessage('💡 Sign in to enable real-time sync', 'info');
        }
    };
    
    // Add window beforeunload handler
    window.addEventListener('beforeunload', (e) => {
        if (window.dataManager) {
            window.dataManager.save();
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
    console.log('🔧 Debug: Type debugSystemStatus() in console to check system status');
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
                        window.dataManager.data = { ...window.dataManager.data, ...data };
                        window.dataManager.save();
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
    
    window.dataManager.save();
    window.dataManager.refreshAllComponents();
    return true;
}

// Generate semester-wise reports
function generateSemesterReport(semester) {
    if (!window.dataManager) return null;
    
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
    
    // Get user data from cloud (100% cloud-based)
    const pendingUsers = window.dataManager?.pendingUsers || [];
    const approvedUsers = window.dataManager?.approvedUsers || [];
    
    console.log('� Admin Panel - Loading from Google Drive');
    console.log('📋 Pending users from cloud:', pendingUsers.length);
    console.log('✅ Approved users from cloud:', approvedUsers.length);
    console.log('📊 Pending users data:', pendingUsers);
    
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
                                    <button class="btn btn--sm btn--success" onclick="approveUser('${user.email}').then(() => { this.closest('.user-management-modal').remove(); showUserManagement(); })">Approve</button>
                                    <button class="btn btn--sm btn--danger" onclick="rejectUser('${user.email}').then(() => { this.closest('.user-management-modal').remove(); showUserManagement(); })">Reject</button>
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
    
    // Use 100% cloud-based data instead of localStorage
    const pendingUsers = window.dataManager?.pendingUsers || [];
    const approvedUsers = window.dataManager?.approvedUsers || [];
    
    const approvedCount = document.getElementById('approvedUsersCount');
    const pendingCount = document.getElementById('pendingRequestsCount');
    
    if (approvedCount) approvedCount.textContent = approvedUsers.length;
    if (pendingCount) pendingCount.textContent = pendingUsers.length;
}

// User approval functions for admin
async function approveUser(email) {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return false;
    }
    
    try {
        const pendingUsers = window.dataManager?.pendingUsers || [];
        const approvedUsers = window.dataManager?.approvedUsers || [];
        
        // Find the user in pending list
        const userIndex = pendingUsers.findIndex(u => u.email === email);
        if (userIndex === -1) {
            showMessage('User not found in pending list', 'error');
            return false;
        }
        
        const user = pendingUsers[userIndex];
        
        // Add approval timestamp
        user.approvedAt = new Date().toISOString();
        user.approvedBy = window.authManager.currentUser.email;
        
        // Move from pending to approved
        pendingUsers.splice(userIndex, 1);
        approvedUsers.push(user);
        
        // Update data manager
        window.dataManager.pendingUsers = pendingUsers;
        window.dataManager.approvedUsers = approvedUsers;
        
        // Save to cloud immediately
        const success = await window.dataManager.save();
        if (success) {
            console.log('✅ User approved and synced to cloud:', user.email);
            showMessage(`User ${user.name} has been approved!`, 'success');
            
            // Update admin stats
            updateAdminStats();
            
            // Trigger immediate sync
            window.dataManager.triggerImmediateSync();
            
            return true;
        } else {
            throw new Error('Failed to sync approval to cloud');
        }
    } catch (error) {
        console.error('Error approving user:', error);
        showMessage(`Failed to approve user: ${error.message}`, 'error');
        return false;
    }
}

async function rejectUser(email) {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return false;
    }
    
    try {
        const pendingUsers = window.dataManager?.pendingUsers || [];
        
        // Find and remove the user from pending list
        const userIndex = pendingUsers.findIndex(u => u.email === email);
        if (userIndex === -1) {
            showMessage('User not found in pending list', 'error');
            return false;
        }
        
        const user = pendingUsers[userIndex];
        pendingUsers.splice(userIndex, 1);
        
        // Update data manager
        window.dataManager.pendingUsers = pendingUsers;
        
        // Save to cloud immediately
        const success = await window.dataManager.save();
        if (success) {
            console.log('❌ User rejected and removed from cloud:', user.email);
            showMessage(`User ${user.name} has been rejected and removed.`, 'info');
            
            // Update admin stats
            updateAdminStats();
            
            // Trigger immediate sync
            window.dataManager.triggerImmediateSync();
            
            return true;
        } else {
            throw new Error('Failed to sync rejection to cloud');
        }
    } catch (error) {
        console.error('Error rejecting user:', error);
        showMessage(`Failed to reject user: ${error.message}`, 'error');
        return false;
    }
}

async function removeApprovedUser(email) {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return false;
    }
    
    try {
        const approvedUsers = window.dataManager?.approvedUsers || [];
        
        // Find and remove the user from approved list
        const userIndex = approvedUsers.findIndex(u => u.email === email);
        if (userIndex === -1) {
            showMessage('User not found in approved list', 'error');
            return false;
        }
        
        const user = approvedUsers[userIndex];
        approvedUsers.splice(userIndex, 1);
        
        // Update data manager
        window.dataManager.approvedUsers = approvedUsers;
        
        // Save to cloud immediately
        const success = await window.dataManager.save();
        if (success) {
            console.log('🗑️ Approved user removed from cloud:', user.email);
            showMessage(`User ${user.name} has been removed from approved users.`, 'info');
            
            // Update admin stats
            updateAdminStats();
            
            // Trigger immediate sync
            window.dataManager.triggerImmediateSync();
            
            return true;
        } else {
            throw new Error('Failed to sync removal to cloud');
        }
    } catch (error) {
        console.error('Error removing approved user:', error);
        showMessage(`Failed to remove user: ${error.message}`, 'error');
        return false;
    }
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
                window.dataManager.save();
                window.dataManager.refreshAllComponents();
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
                        window.dataManager.data = { ...window.dataManager.data, ...data };
                        window.dataManager.save();
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

// Debug function to check system status
function debugSystemStatus() {
    if (!window.dataManager) {
        console.log('❌ DataManager not available');
        return;
    }
    
    console.log('🔍 System Status Debug:');
    console.log('Time Slots:', window.dataManager.data.timeSlots);
    console.log('Departments:', window.dataManager.data.departments);
    console.log('Semesters:', window.dataManager.data.semesters);
    console.log('Groups:', window.dataManager.data.groups);
    console.log('Sub Groups:', window.dataManager.data.subGroups);
    console.log('Subjects:', window.dataManager.data.subjects);
    console.log('Lab Rooms:', window.dataManager.data.labRooms);
    console.log('Theory Faculty:', window.dataManager.data.theoryFaculty);
    console.log('Lab Faculty:', window.dataManager.data.labFaculty);
    console.log('Current Assignments:', window.dataManager.data.assignments);
    
    // Check if basic data exists
    const hasTimeSlots = window.dataManager.data.timeSlots.length > 0;
    const hasSubjects = window.dataManager.data.subjects.length > 0;
    const hasLabRooms = window.dataManager.data.labRooms.length > 0;
    const hasFaculty = window.dataManager.data.theoryFaculty.length > 0 && window.dataManager.data.labFaculty.length > 0;
    
    console.log('✅ Ready to create assignments:', hasTimeSlots && hasSubjects && hasLabRooms && hasFaculty);
    
    if (!hasTimeSlots) console.log('⚠️ Missing: Time Slots - Go to Master Data tab and add time slots');
    if (!hasSubjects) console.log('⚠️ Missing: Subjects - Go to Master Data tab and add subjects');
    if (!hasLabRooms) console.log('⚠️ Missing: Lab Rooms - Go to Master Data tab and add lab rooms');
    if (!hasFaculty) console.log('⚠️ Missing: Faculty - Go to Master Data tab and add theory and lab faculty');
}

// GitHub Integration Functions
function configureGitHubSync() {
    if (!window.authManager || !window.authManager.currentUser || !window.authManager.currentUser.isAdmin) {
        showMessage('Only admin can configure GitHub integration', 'error');
        return;
    }

    const token = prompt(`Configure GitHub Integration

Please enter your GitHub Personal Access Token:

Instructions:
1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token with 'repo' permissions
3. Copy the token and paste it below

Repository: ${CONFIG.GITHUB.OWNER}/${CONFIG.GITHUB.REPO}
Data will be synced to: ${CONFIG.GITHUB.DATA_FILE_PATH}

Enter token:`);

    if (token && window.githubSync) {
        if (window.githubSync.setGitHubToken(token)) {
            updateGitHubStatus();
            showMessage('GitHub integration configured successfully!', 'success');
        }
    }
}

function syncToGitHub() {
    if (!window.githubSync || !window.githubSync.isConfigured()) {
        showMessage('GitHub not configured. Please configure first.', 'warning');
        configureGitHubSync();
        return;
    }

    if (!window.dataManager) {
        showMessage('No data manager available', 'error');
        return;
    }

    showMessage('🐙 Syncing to GitHub repository...', 'info');
    
    window.githubSync.syncToGitHub(window.dataManager.data).then(success => {
        if (success) {
            updateGitHubStatus();
            showMessage(`🐙 Successfully synced to GitHub repository!

Repository: ${window.githubSync.getRepositoryUrl()}
Data File: ${window.githubSync.getDataFileUrl()}`, 'success');
        } else {
            showMessage('GitHub sync failed. Check console for details.', 'error');
        }
    }).catch(error => {
        console.error('GitHub sync error:', error);
        showMessage(`GitHub sync failed: ${error.message}`, 'error');
    });
}

function updateGitHubStatus() {
    const statusElement = document.getElementById('github-sync-status');
    if (statusElement && window.githubSync) {
        if (window.githubSync.isConfigured()) {
            statusElement.textContent = 'Configured';
            statusElement.className = 'stat-value success';
        } else {
            statusElement.textContent = 'Not Configured';
            statusElement.className = 'stat-value warning';
        }
    }
}

// Initialize GitHub status on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateGitHubStatus, 1000);
});

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
window.configureGitHubSync = configureGitHubSync;
window.syncToGitHub = syncToGitHub;
window.updateGitHubStatus = updateGitHubStatus;
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.removeApprovedUser = removeApprovedUser;
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
window.debugSystemStatus = debugSystemStatus;
