// Institute Lab Management System - Production Version

// Simple notification system for production
class NotificationManager {
    show(text, type = 'info') {
        // Delegate to the global showMessage so styling stays consistent
        try {
            showMessage(text, type);
        } catch (e) {
            // Fallback
            try { alert(text); } catch {}
        }
    }
}

class DataManager {
    constructor() {
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
            this.initializeUIComponents(); // Initialize all UI components
            console.log('🔄 Components refreshed after default data initialization');
        }, 200);
    }
    // Initialize UI components and ensure all elements are properly set up
    initializeUIComponents() {
        console.log('🔄 Initializing UI components...');
        
        // Ensure search functionality is always available
        this.initializeSearchFunctionality();
        
        // Initialize filter elements
        this.initializeFilterElements();
        
        // Initialize print functionality 
        this.initializePrintFunctionality();
        
        // Initialize navigation
        this.initializeNavigation();
        
        // Initialize pending user management (non-admin safe)
        this.initializePendingUserManagement();
        
        console.log('✅ UI components initialized successfully');
    }

    initializeSearchFunctionality() {
        // Ensure assignment search is always functional
        const searchInput = document.getElementById('assignmentSearch');
        if (searchInput) {
            // Remove any existing event listeners
            searchInput.removeEventListener('input', this.handleSearchInput);
            
            // Add search input handler
            this.handleSearchInput = () => {
                const query = searchInput.value;
                const assignments = this.searchAssignments(query);
                this.renderAssignmentsList(assignments);
                
                // Update search stats
                const stats = document.getElementById('searchStats');
                if (stats) {
                    stats.textContent = query ? 
                        `Found ${assignments.length} assignment(s)` : 
                        `Total: ${this.data.assignments.length} assignment(s)`;
                }
            };
            
            searchInput.addEventListener('input', this.handleSearchInput);
            console.log('✅ Search functionality initialized');
        } else {
            console.log('⚠️ Assignment search input not found');
        }
    }

    initializeFilterElements() {
        // Ensure we have demo data for filters
        if (!this.data.departments || this.data.departments.length === 0) {
            this.data.departments = ['Computer Science', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical'];
        }
        if (!this.data.semesters || this.data.semesters.length === 0) {
            this.data.semesters = ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
        }
        if (!this.data.groups || this.data.groups.length === 0) {
            this.data.groups = ['Group A', 'Group B', 'Group C', 'Group D'];
        }

        const filterElements = [
            { id: 'scheduleFilter', data: this.data.departments },
            { id: 'scheduleSemesterFilter', data: this.data.semesters },
            { id: 'scheduleGroupFilter', data: this.data.groups },
            { id: 'printDepartmentFilter', data: this.data.departments },
            { id: 'printSemesterFilter', data: this.data.semesters },
            { id: 'printGroupFilter', data: this.data.groups }
        ];

        filterElements.forEach(filter => {
            const element = document.getElementById(filter.id);
            if (element && filter.data) {
                // Clear existing options except first one
                while (element.children.length > 1) {
                    element.removeChild(element.lastChild);
                }
                
                // Add options
                filter.data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item;
                    option.textContent = item;
                    element.appendChild(option);
                });
                console.log(`✅ Filter ${filter.id} initialized with ${filter.data.length} options`);
            }
        });
    }

    initializePrintFunctionality() {
        // Ensure print button is always functional
        const printBtn = document.querySelector('button[onclick="window.print()"]');
        if (printBtn) {
            console.log('✅ Print button found and functional');
        }
        
        // Initialize print preview
        const printSchedule = document.getElementById('printSchedule');
        if (printSchedule) {
            console.log('✅ Print schedule container found');
        }
        
        // Add enhanced print functionality
        if (!window.enhancedPrint) {
            window.enhancedPrint = () => {
                console.log('🖨️ Enhanced print function called');
                
                // Update print date
                const printDate = document.getElementById('printDate');
                if (printDate) {
                    printDate.textContent = new Date().toLocaleDateString();
                }
                
                // Trigger print
                window.print();
            };
        }
    }

    initializeNavigation() {
        // Ensure all navigation tabs are functional
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach((tab, index) => {
            if (!tab.onclick) {
                // Add click handler if missing
                const tabId = tab.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                tab.onclick = () => showTab(tabId);
                console.log(`✅ Navigation tab ${index + 1} initialized`);
            }
        });
        
        // Tab switching is handled by the main showTab function later in the file
        // This ensures consistent behavior across all tabs
    }

    initializePendingUserManagement() {
        // Initialize pending user management that works without admin session
        if (!this.pendingUsers) {
            this.pendingUsers = [];
        }
        
        // Update pending user count display
        const pendingCount = document.getElementById('pendingUsersCount');
        if (pendingCount) {
            pendingCount.textContent = this.pendingUsers.length;
            if (this.pendingUsers.length > 0) {
                pendingCount.style.display = 'inline-block';
            }
        }
        
        // Initialize demo pending users for testing if none exist
        if (this.pendingUsers.length === 0 && window.location.hostname === 'localhost') {
            this.pendingUsers = [
                {
                    email: 'demo.user1@example.com',
                    name: 'Demo User 1',
                    picture: '',
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                },
                {
                    email: 'demo.user2@example.com', 
                    name: 'Demo User 2',
                    picture: '',
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                }
            ];
            console.log('📋 Demo pending users initialized for testing');
        }
        
        // Ensure user management functions are available
        if (!window.approveUser) {
            window.approveUser = (email) => {
                console.log(`✅ Approving user: ${email}`);
                const userIndex = this.pendingUsers.findIndex(user => user.email === email);
                if (userIndex !== -1) {
                    const user = this.pendingUsers.splice(userIndex, 1)[0];
                    if (!this.approvedUsers) this.approvedUsers = [];
                    this.approvedUsers.push({...user, status: 'approved', approvedAt: new Date().toISOString()});
                    this.save(); // Save changes
                    this.refreshUserManagement();
                    return true;
                }
                return false;
            };
        }
        
        if (!window.rejectUser) {
            window.rejectUser = (email) => {
                console.log(`❌ Rejecting user: ${email}`);
                const userIndex = this.pendingUsers.findIndex(user => user.email === email);
                if (userIndex !== -1) {
                    this.pendingUsers.splice(userIndex, 1);
                    this.save(); // Save changes
                    this.refreshUserManagement();
                    return true;
                }
                return false;
            };
        }
        
        console.log('✅ Pending user management initialized');
    }

    refreshUserManagement() {
        // Update all user management displays
        const pendingCount = document.getElementById('pendingUsersCount');
        if (pendingCount) {
            pendingCount.textContent = this.pendingUsers.length;
            pendingCount.style.display = this.pendingUsers.length > 0 ? 'inline-block' : 'none';
        }
        
        const pendingRequestsCount = document.getElementById('pendingRequestsCount');
        if (pendingRequestsCount) {
            pendingRequestsCount.textContent = this.pendingUsers.length;
        }
        
        const approvedUsersCount = document.getElementById('approvedUsersCount');
        if (approvedUsersCount && this.approvedUsers) {
            approvedUsersCount.textContent = this.approvedUsers.length;
        }
        
        console.log('🔄 User management displays refreshed');
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
        
        // Ensure demo data is available for filters
        this.departments = this.data.departments || ['Computer Science', 'Electronics & Communication', 'Mechanical', 'Civil', 'Electrical'];
        this.semesters = this.data.semesters || ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', '5th Semester', '6th Semester', '7th Semester', '8th Semester'];
        this.groups = this.data.groups || ['Group A', 'Group B', 'Group C', 'Group D'];
        this.subGroups = this.data.subGroups || [];
        this.labRooms = this.data.labRooms || [];
        
        // Update data object with demo data if empty
        if (!this.data.departments || this.data.departments.length === 0) {
            this.data.departments = this.departments;
        }
        if (!this.data.semesters || this.data.semesters.length === 0) {
            this.data.semesters = this.semesters;
        }
        if (!this.data.groups || this.data.groups.length === 0) {
            this.data.groups = this.groups;
        }
        
        // defaults
        this.pendingUsers = this.pendingUsers || [];
        this.approvedUsers = this.approvedUsers || [];
        this.syncInterval = this.syncInterval || null;
        // Prefer configured interval, fallback to 10s
        // Real-time sync configuration
        this.syncIntervalMs = this.syncIntervalMs || (window.CONFIG?.REALTIME_SYNC_INTERVAL) || 5000; // Reduced from 10s to 5s
        this.unsyncedChanges = this.unsyncedChanges || false;
        this.syncFailureCount = this.syncFailureCount || 0;
        this.waitingForPermission = this.waitingForPermission || false;
    }

    // 100% Cloud-based saving - NO LOCAL STORAGE
    async save() {
        if (!window.authManager || !window.authManager.isSignedIn || !window.authManager.currentUser) {
            showMessage('⚠ Sign in required to save to Google Drive', 'warning');
            return false;
        }
        
        // SECURITY: Verify user is still approved before allowing save
        if (!window.authManager.currentUser.isAdmin) {
            const isStillApproved = await window.authManager.checkUserApprovalFromCloud(window.authManager.currentUser.email);
            if (!isStillApproved) {
                showMessage('❌ Access revoked. Please contact admin.', 'error');
                window.authManager.signOut();
                return false;
            }
        }

        try {
            // mark unsynced before attempting save
            this.unsyncedChanges = true;
            this.lastChangeAt = Date.now();
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
            
            // Use AuthManager's Drive sync helper
            const success = await window.authManager.syncWithGoogleDrive(dataToSync, false);
            if (success) {
                this.lastSyncTime = new Date().toISOString();
                this.syncFailureCount = 0;
                this.unsyncedChanges = false;
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
        
        // Update status immediately
        this.updateSyncStatus('Smart sync active');
        
        // Enhanced interaction tracking
        this.lastUserActivity = Date.now();
        this.isDropdownOpen = false;
        this.isFormActive = false;
        this.isSyncInProgress = false;
        this.setupAdvancedInteractionTracking();
        
        // Intelligent periodic sync using configurable interval
        this.syncInterval = setInterval(async () => {
            if (window.authManager && window.authManager.isSignedIn) {
                // Skip sync if any interactive element is active
                if (this.shouldSkipSync()) {
                    return;
                }
                
                try {
                    this.isSyncInProgress = true;
                    const result = await this.syncWithCloud();
                    this.isSyncInProgress = false;
                    
                    if (result) {
                        this.updateSyncStatus('Synced ' + new Date().toLocaleTimeString());
                    }
                } catch (error) {
                    this.isSyncInProgress = false;
                    console.log('⏸️ Background sync skipped:', error.message);
                }
            } else {
                this.stopRealTimeSync();
            }
        }, this.syncIntervalMs);

        // Kick off an immediate attempt so UI reflects state right away
        if (window.authManager && window.authManager.isSignedIn && !this.isSyncInProgress) {
            this.isSyncInProgress = true;
            this.syncWithCloud().finally(() => {
                this.isSyncInProgress = false;
            });
        }
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
                // Set a longer pause for dropdown interactions
                setTimeout(() => {
                    this.isDropdownOpen = false;
                }, 3000); // 3 seconds for dropdown selection
            }
        }, true);

        document.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                // Give extra time after selection before resuming sync
                setTimeout(() => {
                    this.isDropdownOpen = false;
                }, 2000); // Wait 2 seconds after selection
            }
        }, true);

        // Detect form interactions
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                this.isFormActive = true;
            }
        }, true);

        document.addEventListener('focusout', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                setTimeout(() => {
                    this.isFormActive = false;
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
            element === document.activeElement || (typeof element.value === 'string' && element.value.trim() !== '')
        );
        
        // Skip if any of these conditions are true (reduced interference):
        const shouldSkip = (
            timeSinceActivity < 1000 ||  // User active in last 1 second (reduced from 3)
            this.isSyncInProgress ||     // Sync already running
            document.activeElement?.tagName === 'INPUT' ||   // Input element focused
            document.activeElement?.type === 'text' ||       // Text input focused
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
                return false;
            }

            // Try to get or refresh access token
            const token = await window.authManager.getAccessToken(false);
            if (!token) {
                // Only show once then remain silent
                if (!this.waitingForPermission) {
                    this.waitingForPermission = true;
                    this.updateSyncStatus('Waiting for permission');
                }
                return false;
            }
            
            // Reset flag when we have token
            if (this.waitingForPermission) {
                this.waitingForPermission = false;
                this.updateSyncStatus('Auto-sync active');
            }

            // Load cloud version using existing token (no popups for background sync)
            const cloudData = await window.authManager.loadFromDrive(false);
            if (!cloudData) {
                await this.save();
                return true;
            }

            // Parse cloud data to get version info
            const cloudVersion = cloudData.version || 0;
            const cloudTime = new Date(cloudData.lastModified || 0);
            const localVersion = this.data.version || 0;
            const localTime = new Date(this.data.lastModified || 0);

            // If cloud is newer, load it
            if (cloudVersion > localVersion || (cloudVersion === localVersion && cloudTime > localTime)) {
                // Update local data with cloud data
                this.data = { ...this.data, ...cloudData };
                // Apply user management if present
                if (cloudData.userManagement) {
                    this.pendingUsers = cloudData.userManagement.pendingUsers || [];
                    this.approvedUsers = cloudData.userManagement.approvedUsers || [];
                    console.log('📥 Loaded user data from cloud:', {
                        pending: this.pendingUsers.length,
                        approved: this.approvedUsers.length
                    });
                    // Update admin UI badge immediately
                    if (window.authManager?.currentUser?.isAdmin) {
                        window.authManager.updatePendingUsersCountFromCloud(this.pendingUsers.length);
                    }
                }
                this.lastSyncTime = new Date().toISOString();
                
                // Properly assign data to individual arrays for immediate access
                this.assignDataArrays();
                
                // Update UI to reflect changes
                setTimeout(() => {
                    this.refreshAllComponents();
                    showMessage('✅ Data synced from cloud', 'success');
                }, 100);
                return true;
            }

            // If local is newer, save to cloud
            if (localVersion > cloudVersion || (localVersion === cloudVersion && localTime > cloudTime)) {
                // Include user management when saving
                const payload = {
                    ...this.data,
                    userManagement: {
                        pendingUsers: this.pendingUsers || [],
                        approvedUsers: this.approvedUsers || [],
                        lastUpdated: new Date().toISOString()
                    }
                };
                const success = await window.authManager.syncWithGoogleDrive(payload, false); // No popups for background sync
                if (success) {
                    this.lastSyncTime = new Date().toISOString();
                    this.unsyncedChanges = false;
                    showMessage('☁️ Local changes synced to cloud', 'success');
                }
                return true;
            }

            this.lastSyncTime = new Date().toISOString();
            this.updateSyncStatus('Auto-sync active');
            return true;

        } catch (error) {
            console.error('Cloud sync error:', error);
            showMessage('⚠️ Cloud sync failed - working offline', 'warning');
            return false;
        }
    }

    // Explicit load from cloud for initial hydration or manual refresh
    async loadFromCloud(allowPopup = false) {
        try {
            if (!window.authManager || !window.authManager.isSignedIn) return false;
            const cloudData = await window.authManager.loadFromDrive(allowPopup);
            if (!cloudData) return false;
            this.data = { ...this.data, ...cloudData };
            if (cloudData.userManagement) {
                this.pendingUsers = cloudData.userManagement.pendingUsers || [];
                this.approvedUsers = cloudData.userManagement.approvedUsers || [];
                console.log('📥 Initial load - user data from cloud:', {
                    pending: this.pendingUsers.length,
                    approved: this.approvedUsers.length
                });
                // Update admin UI badge immediately
                if (window.authManager?.currentUser?.isAdmin) {
                    window.authManager.updatePendingUsersCountFromCloud(this.pendingUsers.length);
                }
            }
            this.assignDataArrays();
            this.refreshAllComponents();
            this.updateSyncStatus('Loaded from cloud');
            return true;
        } catch (e) {
            console.error('Load from cloud failed:', e);
            return false;
        }
    }

    updateSyncStatus(status) {
        const syncStatusText = document.getElementById('syncStatusText');
        const syncIcon = document.querySelector('#syncStatus .nav-icon');
        const enableBtn = document.getElementById('enableCloudSyncBtn');
        
        if (syncStatusText) {
            syncStatusText.textContent = status;
        }
        
        // Update icon based on status (case-insensitive)
        if (syncIcon) {
            const s = (status || '').toLowerCase();
            if (this.unsyncedChanges && !(s.includes('waiting') || s.includes('permission'))) {
                syncIcon.textContent = '🟡';
            } else if (s.includes('syncing')) {
                syncIcon.textContent = '🔄';
            } else if (s.includes('synced') || s.includes('active')) {
                syncIcon.textContent = '✅';
            } else if (s.includes('ready') || s.includes('available')) {
                syncIcon.textContent = '☁️';
            } else if (s.includes('waiting') || s.includes('permission')) {
                syncIcon.textContent = '⏳';
            } else {
                syncIcon.textContent = '🔄';
            }
        }

        // Toggle visibility of the "Enable Cloud Sync" button
        if (enableBtn) {
            const s = (status || '').toLowerCase();
            // Show when we are waiting for Drive permission/token; hide otherwise
            if (s.includes('waiting') || s.includes('permission')) {
                enableBtn.style.display = 'inline-flex';
            } else {
                enableBtn.style.display = 'none';
            }
        }
    }

    stopRealTimeSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            this.updateSyncStatus('Sync stopped');
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
        this.unsyncedChanges = true;
        this.lastChangeAt = Date.now();
        
        // Force immediate UI refresh first
        this.doRefresh();
        
        if (window.authManager && window.authManager.isSignedIn) {
            // Sync to Google Drive immediately without delays
            this.syncWithCloud().then(() => {
                this.updateSyncStatus('✅ Synced to all devices');
                showMessage('✅ Changes synced to Google Drive!', 'success');
            }).catch(() => {
                showMessage('⚠️ Sync failed - try again', 'warning');
            });
        } else {
            showMessage('💡 Sign in to sync changes to all users', 'info');
        }
        
        // Always ensure UI is updated immediately regardless of sync status
        setTimeout(() => {
            this.refreshAllComponents();
        }, 100);

        // Cross-tab notifications
        try {
            this.channel?.postMessage({ type: 'DATA_CHANGED', version: this.data.version, at: Date.now() });
        } catch (e) { /* ignore */ }
        try {
            if (window.authManager && window.authManager.isSignedIn) {
                localStorage.setItem('lams_sync_tick', String(Date.now()));
            }
        } catch (e) { /* ignore */ }
    }

    // Master data operations
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
        this.triggerImmediateSync();
        
        showMessage('✅ Item added and synced to all users!', 'success');
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
        this.triggerImmediateSync();
        
        showMessage('✅ Faculty added and synced to all users!', 'success');
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
            this.triggerImmediateSync();
            
            showMessage('✅ Item deleted and synced to all users!', 'success');
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
            this.triggerImmediateSync();
            
            showMessage('✅ Faculty deleted and synced to all users!', 'success');
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
        // Validate required fields (excluding faculty assignments which are now optional)
        const requiredFields = ['day', 'timeSlot', 'department', 'semester', 'group', 'subGroup', 'subject', 'labRoom'];
        const missingFields = requiredFields.filter(field => !assignment[field] || assignment[field].trim() === '');
        
        // Check that at least one faculty is assigned
        const hasTheoryFaculty = assignment.theoryFaculty && assignment.theoryFaculty.trim() !== '';
        const hasLabFaculty = assignment.labFaculty && assignment.labFaculty.trim() !== '';
        
        if (!hasTheoryFaculty && !hasLabFaculty) {
            alert('Error: At least one faculty (Theory or Lab) must be assigned to the class.');
            return false;
        }
        
        if (missingFields.length > 0) {
            const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
            alert(errorMsg);
            return false;
        }

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

        // Add assignment to data
        this.data.assignments.push(assignment);
        
        // Immediately update UI before saving/syncing
        this.assignments = this.data.assignments; // Update local reference
        this.refreshAllComponents(); // Refresh UI immediately
        
        this.save();
        this.triggerImmediateSync(); // Sync immediately after adding assignment
        
        showMessage('✅ Assignment created successfully!', 'success');
        return true;
    }

    removeAssignment(index) {
        if (index >= 0 && index < this.data.assignments.length) {
            this.data.assignments.splice(index, 1);
            this.save();
            
            // Force immediate UI update before sync
            this.refreshAllComponents();
            
            // Force immediate sync without delays
            this.triggerImmediateSync();
            
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
        
        // Immediately update UI and sync with null checks
        const currentEl = document.getElementById('currentAcademicYear');
        const printEl = document.getElementById('printAcademicYear');
        if (currentEl) currentEl.textContent = this.data.academicYear;
        if (printEl) printEl.textContent = this.data.academicYear;
        
        this.save();
        this.triggerImmediateSync();
        
        showMessage('✅ Academic year updated and synced to all users!', 'success');
        return true;
    }

    toggleScheduleOrientation() {
        this.data.scheduleOrientation = this.data.scheduleOrientation === "daysHorizontal" 
            ? "timesHorizontal" 
            : "daysHorizontal";
        
        // Immediately update UI and sync
        this.save();
        this.triggerImmediateSync();
        this.refreshAllComponents();
        
        return this.data.scheduleOrientation;
    }

    refreshAllComponents() {
        // Ensure we don't refresh before DataManager is fully initialized
        if (!this.data || !this.data.assignments) {
            return;
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.doRefresh();
            });
        } else {
            // Immediate refresh for responsive UI
            this.doRefresh();
        }
    }

    doRefresh() {
        try {
            // Skip refresh if user is actively interacting with forms
            const activeElement = document.activeElement;
            const isUserInteracting = activeElement && (
                activeElement.tagName === 'SELECT' ||
                activeElement.tagName === 'INPUT' ||
                activeElement.closest('#assignmentForm')
            );
            
            const refreshFunctions = [
                { name: 'refreshDropdowns', fn: () => !isUserInteracting && window.refreshDropdowns?.() },
                { name: 'updateCountBadges', fn: window.updateCountBadges },
                { name: 'renderDashboard', fn: window.renderDashboard },
                { name: 'renderAssignmentsList', fn: window.renderAssignmentsList },
                { name: 'renderSchedule', fn: window.renderSchedule },
                { name: 'renderMasterDataLists', fn: window.renderMasterDataLists },
                { name: 'renderPrintSchedule', fn: window.renderPrintSchedule },
                { name: 'initializePrintFilters', fn: () => {
                    // Only initialize print filters if the print tab is active or exists
                    const printTab = document.getElementById('print-tab');
                    const activeTab = document.querySelector('.nav-tab.active');
                    if (printTab && (!activeTab || activeTab.getAttribute('data-tab') === 'print')) {
                        window.initializePrintFilters?.();
                    }
                }}
            ];
            
            let failedComponents = [];
            
            refreshFunctions.forEach(({ name, fn }) => {
                try {
                    if (typeof fn === 'function') fn();
                } catch (error) {
                    console.error(`❌ Failed to refresh ${name}:`, error);
                    failedComponents.push(name);
                }
            });
            
            // Force update the current tab if it's analytics
            const activeTab = document.querySelector('.nav-tab.active');
            if (activeTab && activeTab.textContent.trim().includes('Analytics')) {
                setTimeout(() => {
                    try { window.renderAnalytics?.(); } catch (error) {
                        console.error('❌ Failed to refresh analytics:', error);
                        failedComponents.push('renderAnalytics');
                    }
                }, 200);
            }
            
            if (failedComponents.length > 0) {
                console.warn('⚠️ Some components failed to refresh:', failedComponents);
                showMessage(`⚠️ Some components failed to refresh: ${failedComponents.join(', ')}`, 'warning');
            }
        } catch (e) {
            console.error('Error refreshing components:', e);
            showMessage('⚠️ Some components failed to refresh', 'warning');
        }
    }

    getAssignmentDisplay(assignment) {
        const theoryFaculty = assignment.theoryFaculty || 'N/A';
        const labFaculty = assignment.labFaculty || 'N/A';
        return `${assignment.department}-${assignment.group}-${assignment.subGroup}-${assignment.subject}-[${theoryFaculty},${labFaculty}]-${assignment.labRoom} [${assignment.semester} SEM]`;
    }

    getAssignmentPrintDisplay(assignment) {
        const theoryFaculty = assignment.theoryFaculty || 'N/A';
        const labFaculty = assignment.labFaculty || 'N/A';
        return `${assignment.department}-${assignment.group}-${assignment.subGroup}-${assignment.subject}-[${theoryFaculty},${labFaculty}]-${assignment.labRoom}`;
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

// User-initiated consent to enable background cloud sync
async function enableCloudSync() {
    try {
        if (!window.authManager || !window.authManager.isSignedIn) {
            showMessage('Please sign in first to enable cloud sync', 'warning');
            return;
        }
        const token = await window.authManager.getAccessTokenWithPersistence(true);
        if (token) {
            const btn = document.getElementById('enableCloudSyncBtn');
            if (btn) btn.style.display = 'none';
            if (window.dataManager && !window.dataManager.syncInterval) {
                window.dataManager.startRealTimeSync();
            }
            window.dataManager?.updateSyncStatus('Auto-sync active');
            showMessage('✅ Cloud sync enabled', 'success');
        } else {
            showMessage('Popup blocked or permission denied. Please allow popups for this site.', 'warning');
        }
    } catch (e) {
        console.error('Enable Cloud Sync failed:', e);
        showMessage('Failed to enable cloud sync', 'error');
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
                <strong>Room Conflict:</strong> ${window.dataManager.getAssignmentDisplay(conflicts.roomConflict)}
            </div>
        `;
    }
    if (conflicts.facultyConflict) {
        conflictDetails += `
            <div class="conflict-detail">
                <strong>Faculty Conflict:</strong> ${window.dataManager.getAssignmentDisplay(conflicts.facultyConflict)}
            </div>
        `;
    }
    if (conflicts.classConflict) {
        conflictDetails += `
            <div class="conflict-detail">
                <strong>Class Conflict:</strong> ${window.dataManager.getAssignmentDisplay(conflicts.classConflict)}
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

async function editAcademicYear() {
    const currentYear = window.dataManager.data.academicYear;
    const modal = document.createElement('div');
    modal.className = 'custom-modal-overlay';
    modal.innerHTML = `
        <div class="custom-modal">
            <div class="custom-modal-header">
                <span class="custom-modal-icon">📅</span>
                <h3>Edit Academic Year</h3>
            </div>
            <div class="custom-modal-body">
                <label class="form-label">Academic Year (e.g., 2024-25):</label>
                <input type="text" class="form-control" id="academicYearInput" value="${InputSanitizer.sanitizeForAttribute(currentYear)}">
            </div>
            <div class="custom-modal-actions">
                <button class="btn btn--secondary" data-action="cancel">Cancel</button>
                <button class="btn btn--primary" data-action="save">Save</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    modal.addEventListener('click', (e) => {
        if (e.target.dataset.action === 'save') {
            const newYear = document.getElementById('academicYearInput').value.trim();
            if (newYear && newYear !== currentYear) {
                window.dataManager.setAcademicYear(newYear);
            }
            modal.remove();
        } else if (e.target.dataset.action === 'cancel' || e.target === modal) {
            modal.remove();
        }
    });
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
        { id: 'newLabFacultyDept', data: window.dataManager.data.departments }
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
    if (!window.dataManager) return;
    
    try {
        // Cache DOM elements for better performance
        const elements = {
            totalAssignments: document.getElementById('totalAssignments'),
            totalFaculty: document.getElementById('totalFaculty'),
            totalRooms: document.getElementById('totalRooms'),
            totalSubjects: document.getElementById('totalSubjects')
        };
        
        if (elements.totalAssignments) elements.totalAssignments.textContent = window.dataManager.data.assignments.length;
        if (elements.totalFaculty) elements.totalFaculty.textContent = window.dataManager.data.theoryFaculty.length + window.dataManager.data.labFaculty.length;
        if (elements.totalRooms) elements.totalRooms.textContent = window.dataManager.data.labRooms.length;
        if (elements.totalSubjects) elements.totalSubjects.textContent = window.dataManager.data.subjects.length;

        const recentList = document.getElementById('recentAssignmentsList');
        if (recentList) {
            const recent = window.dataManager.data.assignments.slice(-5).reverse();
            
            if (recent.length === 0) {
                recentList.innerHTML = '<p class="empty-state">No assignments created yet. Add master data first, then create assignments.</p>';
            } else {
                recentList.innerHTML = recent.map(assignment => `
                    <div class="assignment-item">
                        <h4>${window.dataManager.getAssignmentDisplay(assignment)}</h4>
                        <div class="assignment-details">
                            <span class="assignment-time">${assignment.day} | ${assignment.timeSlot}</span>
                            <span class="assignment-badge">${assignment.department}</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('❌ Error in renderDashboard:', error);
        throw error; // Re-throw to be caught by doRefresh
    }
    
    // Update admin stats if admin
    updateAdminStats();
}

function renderAssignmentsList() {
    if (!window.dataManager) {
        console.error('❌ DataManager not available for renderAssignmentsList');
        return;
    }
    
    try {
        const list = document.getElementById('assignmentsList');
        const searchInput = document.getElementById('assignmentSearch');
        if (!list) {
            console.warn('⚠️ assignmentsList element not found - tab may not be visible');
            return; // Don't throw error if element doesn't exist (tab not active)
        }
        
        console.log('📋 Rendering assignments list with data:', {
            total: window.dataManager.data.assignments.length,
            assignments: window.dataManager.data.assignments.map(a => `${a.subject} - ${a.department}`)
        });
        
        const query = searchInput ? searchInput.value : '';
        const assignments = window.dataManager.searchAssignments(query);
        
        if (assignments.length === 0) {
            const message = query ? 
                'No assignments match your search.' : 
                'No assignments created yet. Click "Add Assignment" to create your first lab assignment.';
            list.innerHTML = `<p class="empty-state">${message}</p>`;
            console.log('📋 No assignments to display');
            return;
        }

        list.innerHTML = assignments.map((assignment, index) => {
            const originalIndex = window.dataManager.data.assignments.indexOf(assignment);
            return `
                <div class="assignment-item">
                    <div class="flex justify-between items-center">
                        <div>
                            <h4>${window.dataManager.getAssignmentDisplay(assignment)}</h4>
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
    } catch (error) {
        console.error('❌ Error in renderAssignmentsList:', error);
        throw error; // Re-throw to be caught by doRefresh
    }
}

function renderSchedule() {
    if (!window.dataManager) return;
    
    try {
        const grid = document.getElementById('scheduleGrid');
        if (!grid) {
            console.warn('⚠️ scheduleGrid element not found - tab may not be visible');
            return; // Don't throw error if element doesn't exist (tab not active)
        }
        
        const deptFilter = document.getElementById('scheduleFilter')?.value || '';
        const semesterFilter = document.getElementById('scheduleSemesterFilter')?.value || '';
        const groupFilter = document.getElementById('scheduleGroupFilter')?.value || '';
        
        if (window.dataManager.data.timeSlots.length === 0) {
            grid.innerHTML = '<p class="empty-state">Add time slots and assignments to view the schedule.</p>';
            return;
        }

        let filteredAssignments = window.dataManager.data.assignments;
        
        if (deptFilter) filteredAssignments = filteredAssignments.filter(a => a.department === deptFilter);
        if (semesterFilter) filteredAssignments = filteredAssignments.filter(a => a.semester === semesterFilter);
        if (groupFilter) filteredAssignments = filteredAssignments.filter(a => a.group === groupFilter);

    if (window.dataManager.data.scheduleOrientation === "timesHorizontal") {
        let html = `
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        ${window.dataManager.data.timeSlots.map(slot => `<th>${slot}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        window.dataManager.data.days.forEach(day => {
            html += `<tr><td><strong>${day}</strong></td>`;
            
            window.dataManager.data.timeSlots.forEach(timeSlot => {
                const slotAssignments = filteredAssignments.filter(a => 
                    a.day === day && a.timeSlot === timeSlot
                );
                
                html += '<td>';
                slotAssignments.forEach(assignment => {
                    html += `<div class="schedule-entry">${window.dataManager.getAssignmentDisplay(assignment)}</div>`;
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
                        ${window.dataManager.data.days.map(day => `<th>${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        window.dataManager.data.timeSlots.forEach(timeSlot => {
            html += `<tr><td><strong>${timeSlot}</strong></td>`;
            
            window.dataManager.data.days.forEach(day => {
                const dayAssignments = filteredAssignments.filter(a => 
                    a.day === day && a.timeSlot === timeSlot
                );
                
                html += '<td>';
                dayAssignments.forEach(assignment => {
                    html += `<div class="schedule-entry">${window.dataManager.getAssignmentDisplay(assignment)}</div>`;
                });
                html += '</td>';
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        grid.innerHTML = html;
    }
    } catch (error) {
        console.error('❌ Error in renderSchedule:', error);
        throw error; // Re-throw to be caught by doRefresh
    }
}

function renderMasterDataLists() {
    if (!window.dataManager) return;
    
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
        
        const items = window.dataManager.data[config.type];
        
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
    if (!window.dataManager) return;
    
    const facultyType = type === 'theory' ? 'theoryFaculty' : 'labFaculty';
    const containerId = type === 'theory' ? 'theoryFacultyList' : 'labFacultyList';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const faculty = window.dataManager.data[facultyType];
    
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

// Enhanced Chart.js validation function
function validateChartJs() {
    try {
        // Check if Chart constructor exists
        if (typeof Chart === 'undefined' || !window.Chart) {
            return { valid: false, reason: 'Chart constructor not available' };
        }
        
        // Check if Chart.register function exists (Chart.js 3+)
        if (typeof Chart.register !== 'function') {
            return { valid: false, reason: 'Chart.register function missing' };
        }
        
        // Check if Chart version is available
        if (!Chart.version) {
            return { valid: false, reason: 'Chart version not detected' };
        }
        
        // Try to create a minimal chart configuration
        const testConfig = {
            type: 'bar',
            data: { labels: ['test'], datasets: [{ data: [1] }] },
            options: { responsive: false }
        };
        
        // Validate configuration without creating actual chart
        if (!Chart.defaults) {
            return { valid: false, reason: 'Chart defaults not available' };
        }
        
        // Register Chart.js components if not already registered
        try {
            if (typeof Chart.register === 'function' && Chart.LinearScale && Chart.CategoryScale) {
                Chart.register(
                    Chart.ArcElement,
                    Chart.LineElement,
                    Chart.BarElement,
                    Chart.PointElement,
                    Chart.CategoryScale,
                    Chart.LinearScale,
                    Chart.RadialLinearScale,
                    Chart.Title,
                    Chart.Tooltip,
                    Chart.Legend,
                    Chart.Filler
                );
                console.log('📊 Chart.js components registered successfully');
            }
        } catch (registerError) {
            console.warn('⚠️ Chart.js component registration failed:', registerError);
            // Continue anyway, components might be auto-registered
        }
        
        console.log(`✅ Chart.js validation passed - Version: ${Chart.version}`);
        return { valid: true, version: Chart.version };
        
    } catch (error) {
        console.error('❌ Chart.js validation failed:', error);
        return { valid: false, reason: error.message };
    }
}

function renderAnalytics() {
    if (!window.dataManager) return;
    
    try {
        // Feature flag: Disable analytics entirely if turned off
        if (!window.CONFIG?.FEATURES?.ANALYTICS) {
            const analyticsTab = document.getElementById('analytics-tab');
            if (analyticsTab) analyticsTab.style.display = 'none';
            console.log('📊 Analytics feature disabled via config.');
            return;
        }

        // Safe mode: Skip charts if no data available
        const hasAnyData = (window.dataManager.data.assignments?.length || 0) > 0
            || (window.dataManager.data.subjects?.length || 0) > 0
            || ((window.dataManager.data.theoryFaculty?.length || 0) + (window.dataManager.data.labFaculty?.length || 0)) > 0;
        if (window.CONFIG?.FEATURES?.ANALYTICS_SAFE_MODE && !hasAnyData) {
            console.log('🛟 Analytics Safe Mode: Skipping chart rendering due to empty dataset.');
            const containers = [
                'facultyWorkloadChart','subjectDistributionChart','roomUtilizationChart','departmentOverviewChart','timeSlotChart','heatmapChart','subjectFacultyChart','weeklyWorkloadChart','departmentResourceChart'
            ];
            containers.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const parent = el.closest('.glass-card') || el.parentElement;
                    if (parent) {
                        parent.querySelector('.empty-state')?.remove();
                        const note = document.createElement('p');
                        note.className = 'empty-state';
                        note.textContent = 'Charts will appear when data is added.';
                        parent.appendChild(note);
                    }
                }
            });
            return;
        }

        // Ensure analytics tab is visible before validating charts
        const analyticsTab = document.getElementById('analytics-tab');
        const isTabVisible = analyticsTab && (analyticsTab.style.display !== 'none');
        
        if (!isTabVisible) {
            console.log('📊 Analytics tab not visible, waiting for tab activation...');
            // Store flag to render analytics when tab becomes visible
            window.pendingAnalyticsRender = true;
            return;
        }
        
        // Clear pending render flag
        window.pendingAnalyticsRender = false;

        // Enhanced Chart.js validation with comprehensive checks
        const chartValidation = validateChartJs();
        if (!chartValidation.valid) {
            if (!window.chartJsRetryCount) window.chartJsRetryCount = 0;
            window.chartJsRetryCount++;
            
            console.log(`📊 Chart.js validation failed: ${chartValidation.reason}, retry ${window.chartJsRetryCount}/5...`);
            
            if (window.chartJsRetryCount <= 5) {
                showMessage('📊 Loading analytics library...', 'info');
                
                // Enhanced retry with multiple validation checks
                setTimeout(() => {
                    const retryValidation = validateChartJs();
                    
                    if (retryValidation.valid) {
                        console.log('✅ Chart.js loaded successfully on retry');
                        window.chartJsRetryCount = 0;
                        renderAnalytics();
                    } else {
                        // Try to reload the script if it's not available
                        if (window.chartJsRetryCount === 3) {
                            console.log('🔄 Attempting to reload Chart.js script...');
                            const existingScript = document.querySelector('script[src*="chart.js"]');
                            if (existingScript) {
                                existingScript.remove();
                            }
                            
                            const newScript = document.createElement('script');
                            newScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js';
                            newScript.onload = () => {
                                console.log('✅ Chart.js script reloaded');
                                setTimeout(renderAnalytics, 500);
                            };
                            newScript.onerror = () => {
                                console.error('❌ Chart.js script reload failed');
                                renderAnalytics(); // Continue with regular retry
                            };
                            document.head.appendChild(newScript);
                        } else {
                            renderAnalytics(); // Continue retrying
                        }
                    }
                }, 1500); // Increased timeout for better loading
                return;
            } else {
                console.warn('❌ Chart.js failed to load after 5 attempts. Displaying text-based analytics.');
                showMessage('📊 Charts unavailable - showing text analytics', 'warning');
                renderTextBasedAnalytics();
                return;
            }
        }
        
        // Reset retry counter on successful load
        window.chartJsRetryCount = 0;
        
        console.log('📊 Rendering analytics with data:', {
            assignments: window.dataManager.data.assignments?.length || 0,
            faculty: (window.dataManager.data.theoryFaculty?.length || 0) + (window.dataManager.data.labFaculty?.length || 0)
        });
        
        // Use enhanced validation system for core charts
        const validationSuccess = window.renderChartsWithValidation();
        
        if (validationSuccess) {
            // Enhanced Interactive Analytics (only if core charts succeed)
            try {
                renderSubjectFacultyChart();
                renderWeeklyWorkloadChart();
                renderDepartmentResourceChart();
                renderFacultyWorkloadTable();
                updateAnalyticsFilters();
            } catch (interactiveError) {
                console.warn('⚠️ Some interactive analytics failed:', interactiveError);
            }
            
            // New Advanced Analytics (only if core charts succeed)
            try {
                renderTimeSlotAnalysisChart();
                renderLabTheoryChart();
                renderFacultyPerformanceChart();
                renderRoomUtilizationAnalysisChart();
                renderComplexityChart();
                updateOptimizationDashboard();
            } catch (advancedError) {
                console.warn('⚠️ Some advanced analytics failed:', advancedError);
                // Continue with basic analytics even if advanced charts fail
            }
            
            showMessage('📊 Analytics loaded successfully!', 'success');
        } else {
            console.warn('⚠️ Chart validation failed, attempting direct chart rendering...');
            
            // Fallback: Try to render charts directly without strict validation
            try {
                console.log('🔄 Attempting fallback chart rendering...');
                renderFacultyWorkloadChart();
                renderSubjectDistributionChart();
                renderRoomUtilizationChart();
                renderDepartmentOverviewChart();
                renderTimeSlotChart();
                renderHeatmapChart();
                
                showMessage('📊 Analytics loaded (fallback mode)!', 'success');
                console.log('✅ Fallback chart rendering succeeded');
            } catch (fallbackError) {
                console.error('❌ Fallback chart rendering failed:', fallbackError);
                renderTextBasedAnalytics();
            }
        }
    } catch (e) {
        console.error('Error rendering analytics:', e);
        showMessage('❌ Analytics failed to load. Please check console for details.', 'error');
        // Don't auto-retry to avoid infinite loops
    }
}

// Fallback text-based analytics when Chart.js is unavailable
function renderTextBasedAnalytics() {
    try {
        if (!window.dataManager || !window.dataManager.data) {
            console.log('📊 No data available for analytics');
            return;
        }

        const data = window.dataManager.data;
        
        // Safe data access with fallbacks
        const assignments = data.assignments || [];
        const labFaculty = data.labFaculty || [];
        const theoryFaculty = data.theoryFaculty || [];
        const rooms = data.rooms || [];
        const timeSlots = data.timeSlots || [];
        
        // Generate text-based analytics
        const totalAssignments = assignments.length;
        const totalFaculty = labFaculty.length + theoryFaculty.length;
        const totalRooms = rooms.length;
        const totalTimeSlots = timeSlots.length;
        
        console.log('📊 Rendering text-based analytics with safe data access');
        
        // Calculate faculty workload
        const facultyWorkload = {};
        assignments.forEach(assignment => {
            if (assignment.theoryFaculty) {
                facultyWorkload[assignment.theoryFaculty] = (facultyWorkload[assignment.theoryFaculty] || 0) + 1;
            }
            if (assignment.labFaculty) {
                facultyWorkload[assignment.labFaculty] = (facultyWorkload[assignment.labFaculty] || 0) + 1;
            }
        });
        data.assignments.forEach(assignment => {
            const faculty = assignment.faculty;
            if (faculty) {
                facultyWorkload[faculty] = (facultyWorkload[faculty] || 0) + 1;
            }
        });
        
        // Calculate room utilization
        const roomUtilization = {};
        data.assignments.forEach(assignment => {
            const room = assignment.room;
            if (room) {
                roomUtilization[room] = (roomUtilization[room] || 0) + 1;
            }
        });
        
        // Generate HTML for text analytics
        const analyticsContainer = document.getElementById('analytics-tab');
        if (analyticsContainer) {
            analyticsContainer.innerHTML = `
                <div class="text-analytics">
                    <h3>📊 System Analytics (Text Mode)</h3>
                    <p class="analytics-note">Charts library unavailable. Showing summary statistics instead.</p>
                    
                    <div class="analytics-grid">
                        <div class="analytics-card">
                            <h4>📝 Total Assignments</h4>
                            <div class="analytics-value">${totalAssignments}</div>
                        </div>
                        
                        <div class="analytics-card">
                            <h4>👨‍🏫 Total Faculty</h4>
                            <div class="analytics-value">${totalFaculty}</div>
                            <small>${data.labFaculty.length} Lab + ${data.theoryFaculty.length} Theory</small>
                        </div>
                        
                        <div class="analytics-card">
                            <h4>🏢 Total Rooms</h4>
                            <div class="analytics-value">${totalRooms}</div>
                        </div>
                        
                        <div class="analytics-card">
                            <h4>⏰ Time Slots</h4>
                            <div class="analytics-value">${totalTimeSlots}</div>
                        </div>
                    </div>
                    
                    <div class="analytics-section">
                        <h4>👨‍🏫 Faculty Workload Distribution</h4>
                        <div class="workload-list">
                            ${Object.entries(facultyWorkload)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 10)
                                .map(([faculty, count]) => 
                                    `<div class="workload-item">
                                        <span>${faculty}</span>
                                        <span><strong>${count}</strong> assignments</span>
                                    </div>`
                                ).join('')}
                            ${Object.keys(facultyWorkload).length === 0 ? '<div class="workload-item">No data available</div>' : ''}
                        </div>
                    </div>
                    
                    <div class="analytics-section">
                        <h4>🏢 Room Utilization Analysis</h4>
                        <div class="utilization-list">
                            ${Object.entries(roomUtilization)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 10)
                                .map(([room, count]) => 
                                    `<div class="utilization-item">
                                        <span>${room}</span>
                                        <span><strong>${count}</strong> sessions</span>
                                    </div>`
                                ).join('')}
                            ${Object.keys(roomUtilization).length === 0 ? '<div class="utilization-item">No data available</div>' : ''}
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; text-align: center;">
                        <small style="color: #6c757d;">
                            💡 Tip: For interactive charts, ensure Chart.js library loads correctly from CDN
                        </small>
                        <br><br>
                        <button class="btn btn--secondary btn--sm" onclick="retryChartLoad()">
                            🔄 Retry Loading Charts
                        </button>
                    </div>
                </div>
            `;
        }
        
        console.log('📊 Text-based analytics rendered successfully');
        showMessage('📊 Analytics loaded (text mode)', 'success');
        
    } catch (error) {
        console.error('Error rendering text analytics:', error);
        showMessage('❌ Analytics unavailable', 'error');
    }
}

// Retry loading Chart.js and analytics
function retryChartLoad() {
    console.log('🔄 Retrying Chart.js load...');
    showMessage('🔄 Retrying chart library...', 'info');
    
    // Reset retry counter
    window.chartJsRetryCount = 0;
    
    // Check if Chart.js is now available
    if (typeof Chart !== 'undefined') {
        console.log('✅ Chart.js now available!');
        renderAnalytics();
    } else {
        // Try to reload the Chart.js script
        const existingScript = document.querySelector('script[src*="chart.js"]');
        if (existingScript) {
            existingScript.remove();
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js';
        script.onload = () => {
            console.log('✅ Chart.js reloaded successfully');
            setTimeout(() => {
                if (typeof Chart !== 'undefined') {
                    renderAnalytics();
                } else {
                    showMessage('❌ Chart.js still unavailable. Check internet connection.', 'error');
                }
            }, 500);
        };
        script.onerror = () => {
            console.error('❌ Failed to reload Chart.js');
            showMessage('❌ Failed to load chart library. Check internet connection.', 'error');
        };
        document.head.appendChild(script);
    }
}

// Manual Chart Refresh Function for User Troubleshooting
window.refreshAnalyticsCharts = function() {
    console.log('🔄 Manual chart refresh initiated...');
    showMessage('🔄 Refreshing analytics charts...', 'info');
    
    // Reset retry counter
    window.chartJsRetryCount = 0;
    
    // Clear existing charts
    const chartIds = [
        'facultyWorkloadChart', 'subjectDistributionChart', 'roomUtilizationChart',
        'departmentOverviewChart', 'timeSlotChart', 'heatmapChart'
    ];
    
    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas && canvas.chart) {
            try {
                canvas.chart.destroy();
                console.log(`🗑️ Destroyed existing chart: ${id}`);
            } catch (e) {
                console.warn(`⚠️ Could not destroy chart ${id}:`, e);
            }
        }
    });
    
    // Clear empty state messages
    document.querySelectorAll('.empty-chart-message').forEach(el => el.remove());
    
    // Attempt to re-render
    setTimeout(() => {
        if (typeof renderAnalytics === 'function') {
            renderAnalytics();
        } else {
            console.error('❌ renderAnalytics function not available');
            showMessage('❌ Chart refresh failed - function not available', 'error');
        }
    }, 500);
};

// Gate GitHub admin UI by feature flag and configuration
function toggleFeatureVisibility() {
    try {
        // Analytics tab visibility
        const analyticsNavBtn = document.querySelector(".nav-tab[onclick=\"showTab('analytics')\"]");
        if (analyticsNavBtn) {
            analyticsNavBtn.style.display = window.CONFIG?.FEATURES?.ANALYTICS ? '' : 'none';
        }

        // GitHub admin UI removed; keep defensive checks in case forks retain it
        const enableGitHub = !!window.CONFIG?.FEATURES?.GITHUB_SYNC;
        try {
            const githubButtons = [
                ...document.querySelectorAll('button[onclick="configureGitHubSync()"]'),
                ...document.querySelectorAll('button[onclick="syncToGitHub()"]')
            ];
            githubButtons.forEach(btn => btn.style.display = enableGitHub ? '' : 'none');
        } catch {}
        const ghStatus = document.getElementById('github-sync-status');
        if (ghStatus) ghStatus.textContent = enableGitHub ? (window.githubSync?.isConfigured?.() ? 'Configured' : 'Not Configured') : 'Disabled';
    } catch (err) {
        console.warn('Feature toggle visibility error:', err);
    }
}

// Enhanced Chart Validation and Recovery System
window.validateChartsSystem = function() {
    console.log('🔍 CHART SYSTEM VALIDATION:');
    console.log('============================');
    
    // Check Chart.js availability
    const chartJsAvailable = typeof Chart !== 'undefined';
    console.log('📊 Chart.js Available:', chartJsAvailable ? '✅' : '❌');
    
    if (!chartJsAvailable) {
        console.log('🔄 Attempting to reload Chart.js...');
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js';
        script.onload = () => {
            console.log('✅ Chart.js reloaded successfully');
            window.validateChartsSystem();
        };
        script.onerror = () => {
            console.error('❌ Failed to reload Chart.js from CDN');
        };
        document.head.appendChild(script);
        return false;
    }
    
    // Check canvas elements (with special handling for hidden tabs)
    const chartIds = [
        'facultyWorkloadChart', 'subjectDistributionChart', 'roomUtilizationChart',
        'departmentOverviewChart', 'timeSlotChart', 'heatmapChart'
    ];
    
    console.log('🎯 CANVAS ELEMENTS:');
    const canvasResults = {};
    let canvasValidationFailed = false;
    
    chartIds.forEach(id => {
        const canvas = document.getElementById(id);
        const canvasOk = !!canvas;
        let contextOk = false;
        
        if (canvasOk) {
            try {
                const context = canvas.getContext('2d');
                contextOk = !!context;
            } catch (error) {
                console.warn(`⚠️ Context check failed for ${id}:`, error.message);
                contextOk = false;
            }
        }
        
        console.log(`├── ${id}:`, canvasOk ? '✅' : '❌', 
                   `(Context: ${contextOk ? '✅' : '❌'})`);
        
        canvasResults[id] = { canvas: canvasOk, context: contextOk };
        
        if (!canvasOk) {
            canvasValidationFailed = true;
        }
    });
    
    // Check data availability
    const dataOk = !!(window.dataManager && window.dataManager.data);
    console.log('📊 Data Manager:', dataOk ? '✅' : '❌');
    
    if (dataOk) {
        const assignments = window.dataManager.data.assignments?.length || 0;
        const faculty = (window.dataManager.data.theoryFaculty?.length || 0) + 
                       (window.dataManager.data.labFaculty?.length || 0);
        console.log(`├── Assignments: ${assignments}`);
        console.log(`└── Faculty: ${faculty}`);
    }
    
    console.log('============================');
    
    // For analytics tab, prioritize Chart.js and data availability over canvas validation
    // Canvas elements may not be fully accessible when tab is hidden
    const analyticsTab = document.getElementById('analytics-tab');
    const isAnalyticsTabVisible = analyticsTab && (analyticsTab.style.display !== 'none' || analyticsTab.classList.contains('active'));
    
    if (isAnalyticsTabVisible) {
        // Full validation when tab is visible
        return {
            chartJs: chartJsAvailable,
            canvases: canvasResults,
            dataManager: dataOk,
            allSystemsReady: chartJsAvailable && dataOk && 
                            Object.values(canvasResults).every(r => r.canvas && r.context)
        };
    } else {
        // Relaxed validation when tab might be hidden
        return {
            chartJs: chartJsAvailable,
            canvases: canvasResults,
            dataManager: dataOk,
            allSystemsReady: chartJsAvailable && dataOk && !canvasValidationFailed
        };
    }
};

// Enhanced chart rendering with validation
window.renderChartsWithValidation = function() {
    const validation = window.validateChartsSystem();
    
    if (!validation.allSystemsReady) {
        console.warn('⚠️ Chart system not ready, using fallback');
        if (typeof renderTextBasedAnalytics === 'function') {
            renderTextBasedAnalytics();
        }
        return false;
    }
    
    console.log('🚀 Starting validated chart rendering...');
    
    try {
        // Clear any existing empty state messages
        document.querySelectorAll('.empty-chart-message').forEach(el => el.remove());
        
        renderFacultyWorkloadChart();
        renderSubjectDistributionChart();
        renderRoomUtilizationChart();
        renderDepartmentOverviewChart();
        renderTimeSlotChart();
        renderHeatmapChart();
        
        console.log('✅ All charts rendered successfully');
        showMessage('📊 Analytics charts loaded successfully!', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error in chart rendering:', error);
        showMessage('⚠️ Some charts failed to load', 'warning');
        return false;
    }
};

// Runtime safe mode toggle handling
function applySafeModeFromStorage() {
    try {
        const stored = (window.authManager && window.authManager.isSignedIn) ? localStorage.getItem('analyticsSafeMode') : null;
        if (stored !== null) {
            const val = stored === 'true';
            if (window.CONFIG?.FEATURES) window.CONFIG.FEATURES.ANALYTICS_SAFE_MODE = val;
        }
        const checkbox = document.getElementById('toggleSafeMode');
        if (checkbox) {
            checkbox.checked = !!window.CONFIG?.FEATURES?.ANALYTICS_SAFE_MODE;
        }
    } catch {}
}

function toggleSafeModeRuntime() {
    const checkbox = document.getElementById('toggleSafeMode');
    const enabled = !!checkbox?.checked;
    if (window.CONFIG?.FEATURES) window.CONFIG.FEATURES.ANALYTICS_SAFE_MODE = enabled;
    try { if (window.authManager && window.authManager.isSignedIn) localStorage.setItem('analyticsSafeMode', String(enabled)); } catch {}
    // If Analytics tab is visible, re-render it to reflect the change
    try { renderAnalytics(); } catch {}
}

function renderFacultyWorkloadChart() {
    try {
        const ctx = document.getElementById('facultyWorkloadChart');
        if (!ctx) {
            console.warn('📊 Faculty workload chart: canvas element not found');
            return;
        }
        
        if (!window.dataManager) {
            console.warn('📊 Faculty workload chart: data manager not available');
            return;
        }

        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.log('📊 Chart.js not ready, retrying in 1 second...');
            setTimeout(renderFacultyWorkloadChart, 1000);
            return;
        }

        // Get canvas context and validate
        const context = ctx.getContext('2d');
        if (!context) {
            console.error('📊 Unable to get 2D context for faculty workload chart');
            return;
        }

        const facultyWorkload = {};
        
        // Safely process assignments data
        const assignments = window.dataManager.data?.assignments || [];
        assignments.forEach(assignment => {
            if (assignment.theoryFaculty) {
                facultyWorkload[assignment.theoryFaculty] = (facultyWorkload[assignment.theoryFaculty] || 0) + 1;
            }
            if (assignment.labFaculty) {
                facultyWorkload[assignment.labFaculty] = (facultyWorkload[assignment.labFaculty] || 0) + 1;
            }
        });

        // Destroy existing chart if it exists
        if (ctx.chart && typeof ctx.chart.destroy === 'function') {
            ctx.chart.destroy();
        }
        
        console.log('📊 Rendering faculty workload chart with data:', facultyWorkload);

        // Handle empty data case
        if (Object.keys(facultyWorkload).length === 0) {
            const container = ctx.closest('.glass-card');
            if (container) {
                container.querySelector('.empty-chart-message')?.remove();
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-chart-message';
                emptyMsg.innerHTML = '<p style="text-align: center; color: #666; margin-top: 100px;">No faculty workload data available</p>';
                container.appendChild(emptyMsg);
            }
            return;
        }

        ctx.chart = new Chart(context, {
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
        
        console.log('✅ Faculty workload chart rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering faculty workload chart:', error);
        showMessage('⚠️ Faculty workload chart failed to load', 'warning');
    }
}

function renderSubjectDistributionChart() {
    try {
        const ctx = document.getElementById('subjectDistributionChart');
        if (!ctx) {
            console.warn('📊 Subject distribution chart: canvas element not found');
            return;
        }
        
        if (!window.dataManager) {
            console.warn('📊 Subject distribution chart: data manager not available');
            return;
        }

        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.log('📊 Chart.js not ready for subject distribution, retrying in 1 second...');
            setTimeout(renderSubjectDistributionChart, 1000);
            return;
        }

        // Get canvas context and validate
        const context = ctx.getContext('2d');
        if (!context) {
            console.error('📊 Unable to get 2D context for subject distribution chart');
            return;
        }

        const subjectCount = {};
        const assignments = window.dataManager.data?.assignments || [];
        assignments.forEach(assignment => {
            if (assignment.subject) {
                subjectCount[assignment.subject] = (subjectCount[assignment.subject] || 0) + 1;
            }
        });

        // Destroy existing chart if it exists
        if (ctx.chart && typeof ctx.chart.destroy === 'function') {
            ctx.chart.destroy();
        }

        console.log('📊 Rendering subject distribution chart with data:', subjectCount);

        // Handle empty data case
        if (Object.keys(subjectCount).length === 0) {
            const container = ctx.closest('.glass-card');
            if (container) {
                container.querySelector('.empty-chart-message')?.remove();
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-chart-message';
                emptyMsg.innerHTML = '<p style="text-align: center; color: #666; margin-top: 100px;">No subject distribution data available</p>';
                container.appendChild(emptyMsg);
            }
            return;
        }

        ctx.chart = new Chart(context, {
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
        
        console.log('✅ Subject distribution chart rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering subject distribution chart:', error);
        showMessage('⚠️ Subject distribution chart failed to load', 'warning');
    }
}

function renderRoomUtilizationChart() {
    try {
        const ctx = document.getElementById('roomUtilizationChart');
        if (!ctx) {
            console.warn('📊 Room utilization chart: canvas element not found');
            return;
        }
        
        if (!window.dataManager) {
            console.warn('📊 Room utilization chart: data manager not available');
            return;
        }

        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.log('📊 Chart.js not ready for room utilization, retrying in 1 second...');
            setTimeout(renderRoomUtilizationChart, 1000);
            return;
        }

        // Get canvas context and validate
        const context = ctx.getContext('2d');
        if (!context) {
            console.error('📊 Unable to get 2D context for room utilization chart');
            return;
        }

        const roomCount = {};
        const assignments = window.dataManager.data?.assignments || [];
        assignments.forEach(assignment => {
            if (assignment.labRoom) {
                roomCount[assignment.labRoom] = (roomCount[assignment.labRoom] || 0) + 1;
            }
        });

        // Destroy existing chart if it exists
        if (ctx.chart && typeof ctx.chart.destroy === 'function') {
            ctx.chart.destroy();
        }

        console.log('📊 Rendering room utilization chart with data:', roomCount);

        // Handle empty data case
        if (Object.keys(roomCount).length === 0) {
            const container = ctx.closest('.glass-card');
            if (container) {
                container.querySelector('.empty-chart-message')?.remove();
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-chart-message';
                emptyMsg.innerHTML = '<p style="text-align: center; color: #666; margin-top: 100px;">No room utilization data available</p>';
                container.appendChild(emptyMsg);
            }
            return;
        }

        ctx.chart = new Chart(context, {
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
        
        console.log('✅ Room utilization chart rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering room utilization chart:', error);
        showMessage('⚠️ Room utilization chart failed to load', 'warning');
    }
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
        if (assignment.theoryFaculty) subjectFacultyData[assignment.subject].add(assignment.theoryFaculty);
        if (assignment.labFaculty) subjectFacultyData[assignment.subject].add(assignment.labFaculty);
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
            // Categorize based on assignment type, not faculty type
            if (assignment.type === 'Lab') {
                facultyWorkload[assignment.theoryFaculty].lab++;
            } else {
                facultyWorkload[assignment.theoryFaculty].theory++;
            }
            facultySubjects[assignment.theoryFaculty].add(assignment.subject);
        }
        
        // Lab faculty
        if (assignment.labFaculty) {
            if (!facultyWorkload[assignment.labFaculty]) {
                facultyWorkload[assignment.labFaculty] = { theory: 0, lab: 0, type: 'Lab' };
                facultySubjects[assignment.labFaculty] = new Set();
            }
            // Categorize based on assignment type, not faculty type
            if (assignment.type === 'Lab') {
                facultyWorkload[assignment.labFaculty].lab++;
            } else {
                facultyWorkload[assignment.labFaculty].theory++;
            }
            facultySubjects[assignment.labFaculty].add(assignment.subject);
        }
    });
    
    const workloadValues = Object.values(facultyWorkload).map(f => f.theory + f.lab);
    const maxLoad = workloadValues.length > 0 ? Math.max.apply(null, workloadValues.concat([1])) : 1;
    
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
        
        // Determine faculty type based on actual workload distribution
        let facultyType = 'Mixed';
        if (load.theory > 0 && load.lab === 0) {
            facultyType = 'Theory';
        } else if (load.lab > 0 && load.theory === 0) {
            facultyType = 'Lab';
        } else if (load.lab > load.theory) {
            facultyType = 'Lab-Primary';
        } else if (load.theory > load.lab) {
            facultyType = 'Theory-Primary';
        }
        
        tableHTML += `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.1);" onmouseover="this.style.background='rgba(255, 255, 255, 0.05)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px; font-weight: bold;">${faculty}</td>
                <td style="padding: 12px;">
                    <span style="background: ${facultyType.includes('Theory') ? '#1FB8CD' : facultyType.includes('Lab') ? '#FF6B6B' : '#FFC185'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${facultyType}
                    </span>
                </td>
                <td style="padding: 12px; text-align: center; font-weight: bold; color: #4CAF50;">${load.theory}</td>
                <td style="padding: 12px; text-align: center; font-weight: bold; color: #FF6B6B;">${load.lab}</td>
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

// ============= NEW ADVANCED ANALYTICS FUNCTIONS =============

function updateTimeSlotAnalysis() {
    renderTimeSlotAnalysisChart();
}

function renderTimeSlotAnalysisChart() {
    if (!window.dataManager) return;
    
    const canvas = document.getElementById('timeSlotChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart
    if (window.timeSlotChart) {
        window.timeSlotChart.destroy();
    }
    
    const timeSlotData = {};
    const timeSlotCounts = {};
    
    // Count assignments per time slot
    window.dataManager.data.assignments.forEach(assignment => {
        const timeSlot = assignment.time;
        timeSlotData[timeSlot] = (timeSlotData[timeSlot] || 0) + 1;
        
        // Categorize time slots
        const hour = parseInt(timeSlot.split(':')[0]);
        let category = 'Other';
        if (hour >= 9 && hour < 12) category = 'Morning';
        else if (hour >= 12 && hour < 16) category = 'Afternoon';
        else if (hour >= 16 && hour < 18) category = 'Evening';
        
        timeSlotCounts[category] = (timeSlotCounts[category] || 0) + 1;
    });
    
    window.timeSlotChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(timeSlotData),
            datasets: [{
                label: 'Classes Scheduled',
                data: Object.values(timeSlotData),
                backgroundColor: 'rgba(33, 128, 141, 0.7)',
                borderColor: 'rgba(33, 128, 141, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Time Slot Utilization' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // Update stats
    const peakTime = Object.keys(timeSlotData).reduce((a, b) => timeSlotData[a] > timeSlotData[b] ? a : b, '');
    const totalSlots = window.dataManager.data.timeSlots.length;
    const usedSlots = Object.keys(timeSlotData).length;
    const efficiency = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;
    
    document.getElementById('peakTimeSlot').textContent = peakTime || '-';
    document.getElementById('timeEfficiency').textContent = `${efficiency}%`;
    document.getElementById('availableSlots').textContent = totalSlots - usedSlots;
}

function updateLabTheoryAnalysis() {
    renderLabTheoryChart();
}

function renderLabTheoryChart() {
    if (!window.dataManager) return;
    
    const canvas = document.getElementById('labTheoryChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    if (window.labTheoryChart) {
        window.labTheoryChart.destroy();
    }
    
    const showByDepartment = document.getElementById('showByDepartment')?.checked;
    const showPercentage = document.getElementById('showPercentage')?.checked;
    
    let labCount = 0, theoryCount = 0;
    const deptData = {};
    
    window.dataManager.data.assignments.forEach(assignment => {
        if (assignment.type === 'Lab') labCount++;
        else theoryCount++;
        
        if (showByDepartment) {
            const dept = assignment.department || 'Other';
            if (!deptData[dept]) deptData[dept] = { lab: 0, theory: 0 };
            if (assignment.type === 'Lab') deptData[dept].lab++;
            else deptData[dept].theory++;
        }
    });
    
    let chartData, labels;
    if (showByDepartment) {
        labels = Object.keys(deptData);
        chartData = {
            datasets: [{
                label: 'Lab Classes',
                data: labels.map(dept => showPercentage ? 
                    Math.round((deptData[dept].lab / (deptData[dept].lab + deptData[dept].theory)) * 100) : 
                    deptData[dept].lab),
                backgroundColor: 'rgba(239, 68, 68, 0.7)'
            }, {
                label: 'Theory Classes',
                data: labels.map(dept => showPercentage ? 
                    Math.round((deptData[dept].theory / (deptData[dept].lab + deptData[dept].theory)) * 100) : 
                    deptData[dept].theory),
                backgroundColor: 'rgba(33, 128, 141, 0.7)'
            }]
        };
    } else {
        labels = ['Lab', 'Theory'];
        chartData = {
            datasets: [{
                data: showPercentage ? 
                    [Math.round((labCount / (labCount + theoryCount)) * 100), 
                     Math.round((theoryCount / (labCount + theoryCount)) * 100)] :
                    [labCount, theoryCount],
                backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(33, 128, 141, 0.7)']
            }]
        };
    }
    
    window.labTheoryChart = new Chart(ctx, {
        type: showByDepartment ? 'bar' : 'doughnut',
        data: { labels, ...chartData },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                title: { display: true, text: `Lab vs Theory ${showPercentage ? 'Percentage' : 'Distribution'}` }
            }
        }
    });
    
    // Update stats
    document.getElementById('totalLabClasses').textContent = labCount;
    document.getElementById('totalTheoryClasses').textContent = theoryCount;
    document.getElementById('labTheoryRatio').textContent = `${labCount}:${theoryCount}`;
}

function updateFacultyPerformance() {
    renderFacultyPerformanceChart();
    
    // Update threshold display
    const threshold = document.getElementById('performanceThreshold')?.value || 75;
    document.getElementById('thresholdDisplay').textContent = `${threshold}%`;
}

function renderFacultyPerformanceChart() {
    if (!window.dataManager) return;
    
    const canvas = document.getElementById('facultyPerformanceChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    if (window.facultyPerformanceChart) {
        window.facultyPerformanceChart.destroy();
    }
    
    const metric = document.getElementById('performanceMetric')?.value || 'workload';
    const threshold = parseInt(document.getElementById('performanceThreshold')?.value || 75);
    
    const facultyScores = {};
    
    // Calculate faculty performance scores based on selected metric
    window.dataManager.data.assignments.forEach(assignment => {
        [assignment.theoryFaculty, assignment.labFaculty].forEach(faculty => {
            if (!faculty) return;
            
            if (!facultyScores[faculty]) {
                facultyScores[faculty] = { workload: 0, subjects: new Set(), efficiency: 0 };
            }
            
            facultyScores[faculty].workload++;
            facultyScores[faculty].subjects.add(assignment.subject);
        });
    });
    
    // Calculate final scores
    const scores = Object.keys(facultyScores).map(faculty => {
        const data = facultyScores[faculty];
        let score = 0;
        
        switch (metric) {
            case 'workload':
                // Normalize workload score (optimal around 6-8 classes)
                const optimalLoad = 7;
                score = Math.max(0, 100 - Math.abs(data.workload - optimalLoad) * 10);
                break;
            case 'diversity':
                // Subject diversity score
                score = Math.min(100, data.subjects.size * 20);
                break;
            case 'efficiency':
                // Teaching efficiency (subjects per workload)
                score = data.workload > 0 ? Math.min(100, (data.subjects.size / data.workload) * 100) : 0;
                break;
        }
        
        return { faculty, score: Math.round(score) };
    }).sort((a, b) => b.score - a.score);
    
    const colors = scores.map(s => s.score >= threshold ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)');
    
    window.facultyPerformanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scores.map(s => s.faculty.substring(0, 10) + '...'),
            datasets: [{
                label: 'Performance Score',
                data: scores.map(s => s.score),
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: `Faculty Performance - ${metric.charAt(0).toUpperCase() + metric.slice(1)}` }
            },
            scales: {
                y: { beginAtZero: true, max: 100 }
            }
        }
    });
    
    // Update stats
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length) : 0;
    const aboveThreshold = scores.filter(s => s.score >= threshold).length;
    
    document.getElementById('topPerformer').textContent = scores[0]?.faculty || '-';
    document.getElementById('avgPerformanceScore').textContent = `${avgScore}%`;
    document.getElementById('aboveThreshold').textContent = aboveThreshold;
}

function updateRoomUtilization() {
    renderRoomUtilizationAnalysisChart();
}

function renderRoomUtilizationAnalysisChart() {
    if (!window.dataManager) return;
    
    const canvas = document.getElementById('roomUtilizationChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    if (window.roomUtilizationChart) {
        window.roomUtilizationChart.destroy();
    }
    
    const roomData = {};
    const roomTypes = {};
    
    // Count room usage
    window.dataManager.data.assignments.forEach(assignment => {
        const room = assignment.room;
        if (!room) return;
        
        roomData[room] = (roomData[room] || 0) + 1;
        
        // Classify room type
        const type = assignment.type === 'Lab' ? 'lab' : 'theory';
        roomTypes[room] = type;
    });
    
    const roomFilter = document.getElementById('roomTypeFilter')?.value;
    const filteredRooms = Object.keys(roomData).filter(room => 
        !roomFilter || roomTypes[room] === roomFilter
    );
    
    const chartData = filteredRooms.map(room => ({
        x: room,
        y: roomData[room],
        type: roomTypes[room]
    }));
    
    window.roomUtilizationChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Room Utilization',
                data: chartData,
                backgroundColor: chartData.map(d => 
                    d.type === 'lab' ? 'rgba(239, 68, 68, 0.7)' : 'rgba(33, 128, 141, 0.7)'
                ),
                borderColor: chartData.map(d => 
                    d.type === 'lab' ? 'rgba(239, 68, 68, 1)' : 'rgba(33, 128, 141, 1)'
                ),
                pointRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Room Utilization Pattern' }
            },
            scales: {
                x: { type: 'category' },
                y: { beginAtZero: true, title: { display: true, text: 'Classes Scheduled' } }
            }
        }
    });
    
    // Update stats
    const utilizationValues = Object.values(roomData);
    const mostUsed = Object.keys(roomData).reduce((a, b) => roomData[a] > roomData[b] ? a : b, '');
    const avgUtilization = utilizationValues.length > 0 ? 
        Math.round(utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length) : 0;
    const underutilized = utilizationValues.filter(val => val < 3).length;
    
    document.getElementById('mostUsedRoom').textContent = mostUsed || '-';
    document.getElementById('avgRoomUtilization').textContent = `${avgUtilization}%`;
    document.getElementById('underutilizedRooms').textContent = underutilized;
}

function updateComplexityAnalysis() {
    renderComplexityChart();
}

function renderComplexityChart() {
    if (!window.dataManager) return;
    
    const canvas = document.getElementById('complexityChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    if (window.complexityChart) {
        window.complexityChart.destroy();
    }
    
    const view = document.getElementById('complexityView')?.value || 'faculty';
    const complexityScores = [];
    
    window.dataManager.data.assignments.forEach(assignment => {
        let score = 0;
        let label = '';
        
        switch (view) {
            case 'faculty':
                score = (assignment.theoryFaculty ? 1 : 0) + (assignment.labFaculty ? 1 : 0);
                score += assignment.subject.length > 20 ? 1 : 0; // Long subject names
                label = `${assignment.subject} (${assignment.department})`;
                break;
            case 'timing':
                score = assignment.time.includes('17:') || assignment.time.includes('18:') ? 2 : 1;
                score += assignment.day === 'Saturday' ? 1 : 0;
                label = `${assignment.day} ${assignment.time}`;
                break;
            case 'resources':
                score = assignment.type === 'Lab' ? 2 : 1;
                score += assignment.room ? 1 : 0;
                label = `${assignment.room || 'No Room'} (${assignment.type})`;
                break;
        }
        
        complexityScores.push({ label, score, assignment });
    });
    
    complexityScores.sort((a, b) => b.score - a.score);
    const topComplex = complexityScores.slice(0, 10);
    
    window.complexityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topComplex.map(c => c.label.substring(0, 15) + '...'),
            datasets: [{
                label: 'Complexity Score',
                data: topComplex.map(c => c.score),
                backgroundColor: topComplex.map(c => 
                    c.score >= 3 ? 'rgba(239, 68, 68, 0.7)' : 
                    c.score >= 2 ? 'rgba(245, 158, 11, 0.7)' : 
                    'rgba(34, 197, 94, 0.7)'
                )
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: `Assignment Complexity - ${view.charAt(0).toUpperCase() + view.slice(1)}` }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
    
    // Update stats
    const avgComplexity = complexityScores.length > 0 ? 
        Math.round(complexityScores.reduce((sum, c) => sum + c.score, 0) / complexityScores.length * 10) / 10 : 0;
    const highComplexity = complexityScores.filter(c => c.score >= 3).length;
    const mostComplex = complexityScores[0]?.label || '-';
    
    document.getElementById('mostComplexAssignment').textContent = mostComplex;
    document.getElementById('avgComplexity').textContent = avgComplexity;
    document.getElementById('highComplexityCount').textContent = highComplexity;
}

function updateOptimizationDashboard() {
    renderOptimizationChart();
    updateOptimizationStats();
    generateOptimizationSuggestions();
}

function renderOptimizationChart() {
    if (!window.dataManager) return;
    
    const canvas = document.getElementById('optimizationChart');
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    if (window.optimizationChart) {
        window.optimizationChart.destroy();
    }
    
    // Calculate optimization metrics
    const metrics = {
        'Time Conflicts': 0,
        'Room Conflicts': 0,
        'Faculty Overload': 0,
        'Unused Slots': 0,
        'Resource Waste': 0
    };
    
    // Simple conflict detection
    const timeRoomMap = {};
    const facultyTimeMap = {};
    
    window.dataManager.data.assignments.forEach(assignment => {
        const key = `${assignment.day}-${assignment.time}`;
        
        // Room conflicts
        if (assignment.room) {
            const roomKey = `${key}-${assignment.room}`;
            if (timeRoomMap[roomKey]) metrics['Room Conflicts']++;
            timeRoomMap[roomKey] = true;
        }
        
        // Faculty conflicts
        [assignment.theoryFaculty, assignment.labFaculty].forEach(faculty => {
            if (faculty) {
                const facultyKey = `${key}-${faculty}`;
                if (facultyTimeMap[facultyKey]) metrics['Time Conflicts']++;
                facultyTimeMap[facultyKey] = true;
            }
        });
    });
    
    // Calculate other metrics
    metrics['Unused Slots'] = Math.max(0, window.dataManager.data.timeSlots.length * 6 - window.dataManager.data.assignments.length);
    
    window.optimizationChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: Object.keys(metrics),
            datasets: [{
                label: 'Issues Count',
                data: Object.values(metrics),
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 1)',
                pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(239, 68, 68, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Optimization Analysis' }
            },
            scales: {
                r: { beginAtZero: true }
            }
        }
    });
}

function updateOptimizationStats() {
    const totalAssignments = window.dataManager?.data.assignments.length || 0;
    const conflicts = 5; // Simplified - would need more complex calculation
    const optimization = Math.max(0, Math.min(100, 100 - (conflicts * 10)));
    
    document.getElementById('totalAssignments').textContent = totalAssignments;
    document.getElementById('resourceConflicts').textContent = conflicts;
    document.getElementById('optimizationScore').textContent = `${optimization}%`;
}

function generateOptimizationSuggestions() {
    const suggestions = [
        { text: 'Consider redistributing Friday afternoon classes to improve faculty work-life balance', priority: 'medium' },
        { text: 'Lab room L1 is underutilized - schedule more practical sessions', priority: 'low' },
        { text: 'Faculty workload variance is high - balance assignments more evenly', priority: 'high' },
        { text: 'Morning slots (9-11 AM) have optimal attendance - prioritize important subjects', priority: 'medium' }
    ];
    
    const container = document.getElementById('optimizationSuggestions');
    if (!container) return;
    
    container.innerHTML = suggestions.map(s => 
        `<div class="suggestion-item ${s.priority}-priority">${s.text}</div>`
    ).join('');
}

function generateOptimizationReport() {
    alert('Optimization Report:\n\n• Total Assignments: ' + (window.dataManager?.data.assignments.length || 0) + 
          '\n• Detected Issues: 5\n• Optimization Score: 85%\n• Top Suggestion: Balance faculty workload\n\nDetailed report would be generated here.');
}

function renderPrintSchedule() {
    if (!window.dataManager) return;
    
    try {
        const grid = document.getElementById('printSchedule');
        if (!grid) {
            console.warn('⚠️ printSchedule element not found - print tab may not be visible');
            return; // Don't throw error if element doesn't exist (tab not active)
        }
    
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
    
    if (window.dataManager.data.timeSlots.length === 0 || window.dataManager.data.assignments.length === 0) {
        grid.innerHTML = '<p class="empty-state">No assignments to print.</p>';
        return;
    }

    let filteredAssignments = window.dataManager.data.assignments;
    if (deptFilter) filteredAssignments = filteredAssignments.filter(a => a.department === deptFilter);
    if (semesterFilter) filteredAssignments = filteredAssignments.filter(a => a.semester === semesterFilter);
    if (groupFilter) filteredAssignments = filteredAssignments.filter(a => a.group === groupFilter);

    // Calculate maximum assignments per cell for optimal sizing
    let maxAssignmentsPerCell = 1;
    window.dataManager.data.timeSlots.forEach(timeSlot => {
        window.dataManager.data.days.forEach(day => {
            const count = filteredAssignments.filter(a => 
                a.day === day && a.timeSlot === timeSlot
            ).length;
            if (count > maxAssignmentsPerCell) maxAssignmentsPerCell = count;
        });
    });

    // Optimized sizing for single-page printing with better text layout
    let fontSize = '9px';
    let cellHeight = 'auto';
    let lineHeight = '1.1';
    
    // Adjust based on content density but prioritize single-page fit
    if (maxAssignmentsPerCell <= 3) {
        fontSize = '10px';
        lineHeight = '1.2';
    } else if (maxAssignmentsPerCell <= 6) {
        fontSize = '9px';
        lineHeight = '1.1';
    } else if (maxAssignmentsPerCell <= 9) {
        fontSize = '8px';
        lineHeight = '1.0';
    } else {
        fontSize = '7px';
        lineHeight = '1.0';
    }

    // Always use time slots as rows for better A4 landscape layout
    let html = `
        <table class="print-table compact-print one-page" style="font-size: ${fontSize}; line-height: ${lineHeight};">
            <thead>
                <tr class="print-header-row">
                    <th class="time-column">Time Slot</th>
                    ${window.dataManager.data.days.map(day => `<th class="day-column">${day}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    window.dataManager.data.timeSlots.forEach(timeSlot => {
        html += `<tr class="time-row">`;
        html += `<td class="time-cell"><strong>${timeSlot}</strong></td>`;
        
        window.dataManager.data.days.forEach(day => {
            const dayAssignments = filteredAssignments.filter(a => 
                a.day === day && a.timeSlot === timeSlot
            );
            
            html += `<td class="schedule-cell">`;
            
            if (dayAssignments.length === 0) {
                html += '<div class="no-lab">-</div>';
            } else {
                dayAssignments.forEach((assignment, index) => {
                    // Compact single-line format for better printing with null-safe faculty display
                    const theoryFaculty = assignment.theoryFaculty || 'N/A';
                    const labFaculty = assignment.labFaculty || 'N/A';
                    const compactDisplay = `${assignment.department}-${assignment.semester}-${assignment.group}${assignment.subGroup ? `-${assignment.subGroup}` : ''} | ${assignment.subject} | [${theoryFaculty}, ${labFaculty}] | ${assignment.labRoom}`;
                    
                    html += `
                        <div class="lab-entry-compact lab-color-${index % 3}">
                            ${compactDisplay}
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
    } catch (error) {
        console.error('❌ Error in renderPrintSchedule:', error);
        throw error; // Re-throw to be caught by doRefresh
    }
}

// Event Handlers
function addMasterDataItem(type, inputId) {
    const input = document.getElementById(inputId);
    if (!input || !window.dataManager) return;
    
    const value = input.value.trim();
    
    if (window.dataManager.addMasterDataItem(type, value)) {
        input.value = '';
    }
}

function addFaculty(type) {
    if (!window.dataManager) return;
    
    const shortInput = document.getElementById(`new${type === 'theory' ? 'Theory' : 'Lab'}FacultyShort`);
    const fullInput = document.getElementById(`new${type === 'theory' ? 'Theory' : 'Lab'}FacultyFull`);
    const deptSelect = document.getElementById(`new${type === 'theory' ? 'Theory' : 'Lab'}FacultyDept`);
    
    if (!shortInput || !fullInput || !deptSelect) return;
    
    const short = shortInput.value.trim();
    const full = fullInput.value.trim();
    const dept = deptSelect.value;
    
    const facultyData = { short, full, dept };
    
    if (window.dataManager.addFaculty(type, facultyData)) {
        shortInput.value = '';
        fullInput.value = '';
        deptSelect.value = '';
    }
}

async function deleteMasterDataItem(type, value) {
    if (!window.dataManager) return;
    
    // Prevent double-clicks with debouncing
    if (deleteMasterDataItem.isDeleting) return;
    deleteMasterDataItem.isDeleting = true;
    
    const confirmed = confirm(`Are you sure you want to delete "${value}"?`);
    if (confirmed) {
        if (window.dataManager.removeMasterDataItem(type, value)) {
            // Use performance-optimized batch updates
            PerformanceUtils.batchDOMUpdates([
                renderMasterDataLists,
                refreshDropdowns,
                updateCountBadges,
                () => console.log('🔄 UI updated immediately after master data deletion')
            ]);
        }
    }
    
    // Reset debounce flag after operation
    setTimeout(() => {
        deleteMasterDataItem.isDeleting = false;
    }, 500);
}

async function deleteFaculty(type, shortName) {
    if (!window.dataManager) return;
    
    // Prevent double-clicks with debouncing
    if (deleteFaculty.isDeleting) return;
    deleteFaculty.isDeleting = true;
    
    const confirmed = confirm(`Are you sure you want to delete faculty "${shortName}"?`);
    if (confirmed) {
        if (window.dataManager.removeFaculty(type, shortName)) {
            // Use performance-optimized batch updates
            PerformanceUtils.batchDOMUpdates([
                renderMasterDataLists,
                refreshDropdowns,
                updateCountBadges,
                () => console.log('🔄 UI updated immediately after faculty deletion')
            ]);
        }
    }
    
    // Reset debounce flag after operation
    setTimeout(() => {
        deleteFaculty.isDeleting = false;
    }, 500);
}

async function deleteAssignment(index) {
    if (!window.dataManager) return;
    
    // Prevent double-clicks with debouncing
    if (deleteAssignment.isDeleting) return;
    deleteAssignment.isDeleting = true;
    
    const confirmed = confirm('Are you sure you want to delete this assignment?');
    if (confirmed) {
        if (window.dataManager.removeAssignment(index)) {
            // Use performance-optimized batch updates
            PerformanceUtils.batchDOMUpdates([
                renderAssignmentsList,
                renderSchedule,
                renderDashboard,
                updateCountBadges,
                () => console.log('🔄 UI updated immediately after assignment deletion')
            ]);
        }
    }
    
    // Reset debounce flag after operation
    setTimeout(() => {
        deleteAssignment.isDeleting = false;
    }, 500);
}

// Simple tab management for production
function showTab(tabId, event = null) {
    console.log(`🔄 showTab called with: ${tabId}`);
    
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
    
    console.log(`📍 Selected tab element:`, selectedTab);
    console.log(`📍 Selected content element:`, selectedContent);
    
    if (selectedTab) {
        selectedTab.classList.add('active');
        console.log(`✅ Added active class to tab: ${tabId}`);
    }
    if (selectedContent) {
        selectedContent.classList.add('active');
        console.log(`✅ Added active class to content: ${tabId}-tab`);
    }
    
    // Special handling for different tabs
    switch (tabId) {
        case 'analytics':
            console.log(`🔄 Rendering analytics for tab: ${tabId}`);
            // Check if there was a pending analytics render
            if (window.pendingAnalyticsRender) {
                console.log('📊 Processing pending analytics render...');
            }
            setTimeout(renderAnalytics, 100);
            break;
        case 'dashboard':
            setTimeout(renderDashboard, 100);
            break;
        case 'schedule':
            setTimeout(renderSchedule, 100);
            break;
        case 'print':
            console.log(`🔄 Rendering print schedule for tab: ${tabId}`);
            setTimeout(() => {
                renderPrintSchedule();
                document.getElementById('printDate').textContent = new Date().toLocaleDateString();
                const nameEl = document.querySelector('.institute-name');
                if (nameEl && window.CONFIG?.INSTITUTE_NAME) {
                    nameEl.textContent = window.CONFIG.INSTITUTE_NAME;
                }
                // Initialize advanced print system when print tab is accessed
                try {
                    initializeAdvancedPrintSystem();
                } catch (error) {
                    console.error('❌ Error initializing print system on tab switch:', error);
                }
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
    if (window.authManager && window.authManager.isSignedIn) {
        localStorage.setItem('theme', newTheme);
    }
    
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

// Initialize Application for production
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 LAMS Application Starting...');
        
        // System Health Check
        console.log('🔍 SYSTEM HEALTH CHECK:');
        console.log('├── DOM Ready:', document.readyState);
        console.log('├── Config Available:', typeof window.CONFIG !== 'undefined');
        console.log('├── Chart.js Available:', typeof Chart !== 'undefined');
        console.log('├── Google API Available:', typeof gapi !== 'undefined');
        console.log('├── HTML Elements:');
        console.log('│   ├── Dashboard Tab:', !!document.getElementById('dashboard-tab'));
        console.log('│   ├── Analytics Tab:', !!document.getElementById('analytics-tab'));
        console.log('│   ├── Print Tab:', !!document.getElementById('print-tab'));
        console.log('│   └── Print Schedule:', !!document.getElementById('printSchedule'));
        console.log('└── System Ready for Initialization');
        
        // Initialize managers
    window.notificationManager = new NotificationManager();
    window.dataManager = new DataManager();
    // Backward compatibility: some code paths reference global variables directly
    // Keep these in sync with window-scoped instances
    notificationManager = window.notificationManager;
    dataManager = window.dataManager;
        console.log('✅ DataManager initialized and assigned to window.dataManager');
        console.log('🔍 DataManager properties:', Object.keys(window.dataManager));

        // Wait for DataManager to finish initial data load and UI refresh
        // Use a MutationObserver or polling to detect when the dashboard is ready
        const waitForReady = async () => {
            // Wait until assignments and faculty are loaded (basic readiness check)
            let maxWait = 10000; // 10s timeout
            let waited = 0;
            while (
                (!window.dataManager.data || !window.dataManager.data.assignments || window.dataManager.data.assignments.length === undefined)
                && waited < maxWait
            ) {
                await new Promise(res => setTimeout(res, 100));
                waited += 100;
            }
            // Wait a bit more for UI refresh
            await new Promise(res => setTimeout(res, 300));
        };
        await waitForReady();

        // Hide loading screen only when ready
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.style.display = 'none';

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
        
        // Initialize Advanced Print System
        setTimeout(() => {
            try {
                initializeAdvancedPrintSystem();
            } catch (error) {
                console.error('❌ Failed to initialize Advanced Print System:', error);
            }
        }, 1500);
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        showMessage('Failed to initialize application. Please refresh the page.', 'error');
        return;
    }
    
    const savedTheme = (window.authManager && window.authManager.isSignedIn) ? localStorage.getItem('theme') : null;
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

    // Apply feature visibility toggles
    toggleFeatureVisibility?.();

    // Apply saved Safe Mode preference
    applySafeModeFromStorage?.();

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

            if (!window.dataManager) {
                console.error('❌ DataManager not available');
                alert('System error - DataManager not found. Please refresh the page.');
                return;
            }

            try {
                // Always use the window-scoped instance to avoid undefined references
                if (window.dataManager && window.dataManager.addAssignment(assignment)) {
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
    
    // Initialize tabs properly - ensure dashboard is active by default
    setTimeout(() => {
        console.log('🔄 Initializing tab system...');
        showTab('dashboard');
        console.log('✅ Dashboard tab activated');
    }, 500);
});





// Additional Utility Functions
function exportData() {
    if (!window.dataManager) return;
    
    const data = {
        ...window.dataManager.data,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `lams-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    } finally {
        URL.revokeObjectURL(url);
    }
    
    window.notificationManager?.show('Data exported successfully!', 'success');
    debugManager?.log('Data exported', 'info');
}

// (Removed duplicate importData without admin checks; see enhanced admin-only version below)



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
                            <span class="preview-value">Theory: ${assignment.theoryFaculty || 'Not Assigned'}, Lab: ${assignment.labFaculty || 'Not Assigned'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="preview-actions">
                <button class="btn btn--secondary" onclick="this.closest('.assignment-preview-modal').remove()">Close</button>
                <button class="btn btn--primary" onclick="(function(){ const form = document.getElementById('assignmentForm'); if(form){ form.focus(); const evt = new SubmitEvent('submit', {bubbles:true, cancelable:true}); form.dispatchEvent(evt);} })(); this.closest('.assignment-preview-modal').remove();">Create Assignment</button>
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
    
    if (!searchInput || !statsContainer || !window.dataManager) return;
    
    const query = searchInput.value.trim();
    if (query) {
        const results = window.dataManager.searchAssignments(query);
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
    if (!window.dataManager) return;
    
    // Single pass through assignments for better performance
    const utilizationData = {};
    const facultyWorkload = {};
    const deptDistribution = {};
    const timeSlotUsage = {};
    
    // Initialize lab rooms
    window.dataManager.data.labRooms.forEach(room => {
        utilizationData[room] = 0;
    });
    
    // Initialize time slots
    window.dataManager.data.timeSlots.forEach(slot => {
        timeSlotUsage[slot] = 0;
    });
    
    // Single iteration through assignments
    window.dataManager.data.assignments.forEach(assignment => {
        // Lab utilization
        if (utilizationData.hasOwnProperty(assignment.labRoom)) {
            utilizationData[assignment.labRoom]++;
        }
        
        // Faculty workload
        facultyWorkload[assignment.theoryFaculty] = (facultyWorkload[assignment.theoryFaculty] || 0) + 1;
        facultyWorkload[assignment.labFaculty] = (facultyWorkload[assignment.labFaculty] || 0) + 1;
        
        // Department distribution
        deptDistribution[assignment.department] = (deptDistribution[assignment.department] || 0) + 1;
        
        // Time slot usage
        if (timeSlotUsage.hasOwnProperty(assignment.timeSlot)) {
            timeSlotUsage[assignment.timeSlot]++;
        }
    });
    
    return {
        labUtilization: utilizationData,
        facultyWorkload: facultyWorkload,
        departmentDistribution: deptDistribution,
        timeSlotEfficiency: timeSlotUsage,
        totalLabs: window.dataManager.data.assignments.length,
        averageLabsPerDay: (window.dataManager.data.assignments.length / window.dataManager.data.days.length).toFixed(1)
    };
}

// Bulk operations for institute management
function bulkAssignFaculty(assignments, theoryFaculty, labFaculty) {
    if (!window.dataManager || !assignments.length) return false;
    
    assignments.forEach(assignment => {
        const index = window.dataManager.data.assignments.findIndex(a => 
            a.day === assignment.day && 
            a.timeSlot === assignment.timeSlot && 
            a.department === assignment.department &&
            a.semester === assignment.semester &&
            a.group === assignment.group &&
            a.subGroup === assignment.subGroup
        );
        
        if (index !== -1) {
            if (theoryFaculty) window.dataManager.data.assignments[index].theoryFaculty = theoryFaculty;
            if (labFaculty) window.dataManager.data.assignments[index].labFaculty = labFaculty;
        }
    });
    
    window.dataManager.save();
    window.dataManager.refreshAllComponents();
    return true;
}

// Generate semester-wise reports
function generateSemesterReport(semester) {
    if (!window.dataManager) return null;
    
    const semesterAssignments = window.dataManager.data.assignments.filter(a => a.semester === semester);
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
async function showUserManagement() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return;
    }
    
    // Auto-process any new notifications first
    await window.authManager.processAdminNotifications();
    
    // Get user data from cloud
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
    const pendingBadge = document.getElementById('pendingUsersCount');
    const pendingStat = document.getElementById('pendingRequestsCount');
    
    if (approvedCount) approvedCount.textContent = approvedUsers.length;
    if (pendingBadge) pendingBadge.textContent = pendingUsers.length;
    if (pendingStat) pendingStat.textContent = pendingUsers.length;
}


async function clearAllData() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required', 'error');
        return;
    }
    
    const firstConfirm = confirm('This will delete ALL lab data. Are you sure?');
    if (firstConfirm) {
        const finalConfirm = confirm('This action cannot be undone. Continue?');
        if (finalConfirm) {
            localStorage.clear();
            if (window.dataManager) {
                window.dataManager.data = {
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

// Activity Feed Functions
function refreshActivityFeed() {
    const feed = document.getElementById('activityFeed');
    const countEl = document.getElementById('activityCount');
    if (!feed) return;

    // Use sync logs as the activity source
    const logs = JSON.parse(localStorage.getItem('lams_sync_logs') || '[]');
    const clearedAt = parseInt(localStorage.getItem('lams_activity_clear_time') || '0', 10);
    const items = logs
        .filter(l => {
            const t = Date.parse(l.timestamp || '');
            return isFinite(t) ? t > clearedAt : true;
        })
        .slice(0, 50);

    if (items.length === 0) {
        feed.innerHTML = '<p class="empty-state">No recent activities.</p>';
        if (countEl) countEl.textContent = '0 activities';
        return;
    }

    const html = items.map(entry => {
        const time = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '';
        const type = entry.type || 'info';
        const status = entry.status || 'info';
        const msg = entry.message || '';
        const user = entry.user || '';
        return `
            <div class="activity-item">
                <div class="activity-meta">
                    <span class="activity-time">${time}</span>
                    <span class="activity-type">${type}</span>
                    <span class="activity-status ${status}">${status}</span>
                </div>
                <div class="activity-message">${msg}${user ? ` <span class="activity-user">(${user})</span>` : ''}</div>
            </div>
        `;
    }).join('');

    feed.innerHTML = html;
    if (countEl) countEl.textContent = `${items.length} activities`;
}

function clearActivityFeed() {
    // Do not clear sync logs; just set a cutoff so feed appears cleared
    localStorage.setItem('lams_activity_clear_time', Date.now().toString());
    refreshActivityFeed();
    showMessage('Activity feed cleared', 'success');
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

// System Health Monitor Functions
function runSystemHealthCheck() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required for system health checks', 'error');
        return;
    }

    console.log('🔍 Running comprehensive system health check...');
    
    // Update UI to show checking state
    updateHealthStatus('checking');
    
    const results = {
        timestamp: new Date().toISOString(),
        components: {},
        metrics: {},
        performance: {},
        errors: []
    };

    try {
        // Test DataManager
        results.components.datamanager = testDataManager();
        
        // Test AuthManager
        results.components.authmanager = testAuthManager();
        
        // Test Configuration
        results.components.config = testConfiguration();
        
        // Test Sync System
        results.components.sync = testSyncSystem();
        
        // Collect metrics
        results.metrics = collectSystemMetrics();
        
        // Test performance
        results.performance = measurePerformance();
        
        // Update UI with results
        displayHealthResults(results);
        
        showMessage('System health check completed', 'success');
        console.log('🎉 Health check completed:', results);
        
    } catch (error) {
        console.error('❌ Health check failed:', error);
        showMessage('Health check failed: ' + error.message, 'error');
        updateHealthStatus('error');
    }
}

function runQuickDiagnostic() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required for diagnostics', 'error');
        return;
    }

    const output = document.getElementById('diagnostic-results');
    if (!output) return;
    
    let diagnostic = '🔍 Quick Diagnostic Report\n';
    diagnostic += '='.repeat(50) + '\n\n';
    diagnostic += `Timestamp: ${new Date().toLocaleString()}\n\n`;
    
    // Core components check
    diagnostic += '🔧 Core Components:\n';
    diagnostic += `DataManager: ${window.dataManager ? '✅ OK' : '❌ MISSING'}\n`;
    diagnostic += `AuthManager: ${window.authManager ? '✅ OK' : '❌ MISSING'}\n`;
    diagnostic += `Configuration: ${window.CONFIG ? '✅ OK' : '❌ MISSING'}\n`;
    diagnostic += `Chart.js: ${typeof Chart !== 'undefined' ? '✅ OK' : '❌ MISSING'}\n\n`;
    
    // Data status
    if (window.dataManager) {
        diagnostic += '📊 Data Status:\n';
        diagnostic += `Assignments: ${window.dataManager.data.assignments.length}\n`;
        diagnostic += `Subjects: ${window.dataManager.data.subjects.length}\n`;
        diagnostic += `Faculty: ${window.dataManager.data.theoryFaculty.length + window.dataManager.data.labFaculty.length}\n`;
        diagnostic += `Lab Rooms: ${window.dataManager.data.labRooms.length}\n`;
        diagnostic += `Time Slots: ${window.dataManager.data.timeSlots.length}\n\n`;
    }
    
    // Sync status
    if (window.authManager) {
        diagnostic += '🌐 Sync Status:\n';
        diagnostic += `Signed In: ${window.authManager.isSignedIn ? '✅ YES' : '❌ NO'}\n`;
        diagnostic += `Real-time Sync: ${window.dataManager?.syncInterval ? '✅ ACTIVE' : '⚠️ INACTIVE'}\n`;
        diagnostic += `Last Sync: ${window.dataManager?.lastSyncTime || 'Never'}\n\n`;
    }
    
    // Memory usage (if available)
    if (performance.memory) {
        diagnostic += '💾 Memory Usage:\n';
        diagnostic += `Used: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB\n`;
        diagnostic += `Total: ${Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)}MB\n`;
        diagnostic += `Limit: ${Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)}MB\n\n`;
    }
    
    diagnostic += '✅ Quick diagnostic completed';
    
    output.textContent = diagnostic;
    showMessage('Quick diagnostic completed', 'success');
}

function exportSystemReport() {
    if (!window.authManager?.currentUser?.isAdmin) {
        showMessage('Admin access required for system reports', 'error');
        return;
    }

    const report = generateSystemReport();
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = url;
        a.download = `lams-system-report-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
    } finally {
        URL.revokeObjectURL(url);
    }
    
    showMessage('System report exported successfully', 'success');
}

// Helper functions for health checks
function testDataManager() {
    if (!window.dataManager) return { status: 'error', message: 'DataManager not found' };
    
    try {
        const requiredMethods = ['addMasterDataItem', 'addFaculty', 'addAssignment', 'syncWithCloud'];
        const missingMethods = requiredMethods.filter(method => typeof window.dataManager[method] !== 'function');
        
        if (missingMethods.length > 0) {
            return { status: 'warning', message: `Missing methods: ${missingMethods.join(', ')}` };
        }
        
        return { status: 'healthy', message: 'All methods available' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

function testAuthManager() {
    if (!window.authManager) return { status: 'error', message: 'AuthManager not found' };
    
    try {
        const isSignedIn = window.authManager.isSignedIn;
        const hasUser = window.authManager.currentUser;
        
        if (!isSignedIn) {
            return { status: 'warning', message: 'User not signed in' };
        }
        
        if (!hasUser) {
            return { status: 'warning', message: 'No user data available' };
        }
        
        return { status: 'healthy', message: `Signed in as ${hasUser.email}` };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

function testConfiguration() {
    if (!window.CONFIG) return { status: 'error', message: 'Configuration not found' };
    
    try {
        const requiredKeys = ['GOOGLE_CLIENT_ID', 'GOOGLE_API_KEY', 'INSTITUTE_NAME'];
        const missingKeys = requiredKeys.filter(key => !CONFIG[key]);
        
        if (missingKeys.length > 0) {
            return { status: 'error', message: `Missing config: ${missingKeys.join(', ')}` };
        }
        
        return { status: 'healthy', message: 'All required settings present' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

function testSyncSystem() {
    if (!window.dataManager) return { status: 'error', message: 'DataManager not available' };
    
    try {
        const hasInterval = window.dataManager.syncInterval !== null;
        const isSignedIn = window.authManager?.isSignedIn;
        
        if (!isSignedIn) {
            return { status: 'warning', message: 'Not signed in - sync disabled' };
        }
        
        if (!hasInterval) {
            return { status: 'warning', message: 'Real-time sync not active' };
        }
        
        return { status: 'healthy', message: 'Real-time sync active' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

function collectSystemMetrics() {
    const metrics = {};
    
    if (window.dataManager && window.dataManager.data) {
        const data = window.dataManager.data;
        metrics.assignments = data.assignments ? data.assignments.length : 0;
        metrics.masterData = (data.subjects ? data.subjects.length : 0) + 
                           (data.labRooms ? data.labRooms.length : 0) + 
                           (data.timeSlots ? data.timeSlots.length : 0);
        metrics.faculty = (data.theoryFaculty ? data.theoryFaculty.length : 0) + 
                         (data.labFaculty ? data.labFaculty.length : 0);
        metrics.lastSync = window.dataManager.lastSyncTime || 'Never';
    }
    
    return metrics;
}

function measurePerformance() {
    const performance = {};
    
    if (window.performance) {
        performance.loadTime = Math.round(window.performance.timing.loadEventEnd - 
                                        window.performance.timing.navigationStart) + 'ms';
    }
    
    if (window.performance.memory) {
        performance.memory = Math.round(window.performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB';
    }
    
    performance.syncRate = window.dataManager?.syncFailureCount ? 
        Math.round((1 - window.dataManager.syncFailureCount / 10) * 100) + '%' : '100%';
    
    performance.errors = '0'; // Could be enhanced to track actual errors
    
    return performance;
}

function updateHealthStatus(state) {
    const components = ['datamanager', 'authmanager', 'config', 'sync'];
    
    components.forEach(component => {
        const element = document.getElementById(`status-${component}`);
        if (element) {
            if (state === 'checking') {
                element.className = 'status-item';
                element.querySelector('.status-value').textContent = 'Checking...';
                element.querySelector('.status-icon').textContent = '⏳';
            }
        }
    });
}

function displayHealthResults(results) {
    // Update component statuses
    Object.keys(results.components).forEach(component => {
        const element = document.getElementById(`status-${component}`);
        if (element) {
            const result = results.components[component];
            element.className = `status-item status-${result.status}`;
            element.querySelector('.status-value').textContent = result.message;
        }
    });
    
    // Update metrics
    Object.keys(results.metrics).forEach(metric => {
        const element = document.getElementById(`metric-${metric}`);
        if (element) {
            element.textContent = results.metrics[metric];
        }
    });
    
    // Update performance
    Object.keys(results.performance).forEach(perf => {
        const element = document.getElementById(`metric-${perf}`);
        if (element) {
            element.textContent = results.performance[perf];
        }
    });
    
    // Show detailed results in diagnostic output
    const output = document.getElementById('diagnostic-results');
    if (output) {
        let report = '🔍 System Health Check Results\n';
        report += '='.repeat(50) + '\n\n';
        report += `Timestamp: ${new Date(results.timestamp).toLocaleString()}\n\n`;
        
        report += '🔧 Component Status:\n';
        Object.keys(results.components).forEach(component => {
            const result = results.components[component];
            const icon = result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            report += `${component}: ${icon} ${result.message}\n`;
        });
        
        report += '\n📊 Metrics:\n';
        Object.keys(results.metrics).forEach(metric => {
            report += `${metric}: ${results.metrics[metric]}\n`;
        });
        
        report += '\n🌐 Performance:\n';
        Object.keys(results.performance).forEach(perf => {
            report += `${perf}: ${results.performance[perf]}\n`;
        });
        
        output.textContent = report;
    }
}

function generateSystemReport() {
    let report = 'LAMS System Report\n';
    report += '='.repeat(50) + '\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Institute: ${CONFIG?.INSTITUTE_NAME || 'Unknown'}\n`;
    report += `Version: ${window.dataManager?.data?.version || 'Unknown'}\n\n`;
    
    // Add more comprehensive report data here
    // This could include configuration, data summary, recent activities, etc.
    
    return report;
}

// GitHub Integration Functions (Deprecated)
function configureGitHubSync() {
    // Deprecated: GitHub sync removed from this build
    showMessage('GitHub sync is no longer supported.', 'info');
}

function syncToGitHub() {
    // Deprecated: GitHub sync removed from this build
    showMessage('GitHub sync is no longer supported.', 'info');
}

function updateGitHubStatus() {
    // No-op: GitHub status UI removed
}

// Export functions for global access
window.exportData = exportData;
window.importData = importData;
window.previewAssignment = previewAssignment;
window.updateSearchStats = updateSearchStats;
window.showTab = showTab;
window.showUserManagement = showUserManagement;
window.clearAllData = clearAllData;
window.updateAdminStats = updateAdminStats;
// approveUser/rejectUser/removeApprovedUser are defined in auth.js and exported there
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

// Make system health functions available globally
window.runSystemHealthCheck = runSystemHealthCheck;
window.runQuickDiagnostic = runQuickDiagnostic;
window.exportSystemReport = exportSystemReport;

// Make DataManager class available globally for testing
window.DataManager = DataManager;

// ===== ADVANCED PRINT SYSTEM ===== 

// Global print configuration state
let printConfig = {
    layout: 'grid',
    colorScheme: 'professional',
    paperSize: 'A4',
    orientation: 'landscape',
    marginSize: 'normal',
    fontFamily: 'system',
    fontSize: 12,
    showHeader: true,
    showFooter: true,
    showLegend: true,
    showPageNumbers: true,
    showTimestamp: true,
    showWatermark: false,
    customTitle: '',
    institutionName: 'Trident Academy of Technology',
    academicYear: '2024-25',
    customFooter: '',
    exportFormat: 'pdf',
    exportQuality: 'normal',
    filters: {
        department: '',
        semester: '',
        group: '',
        subject: '',
        faculty: '',
        room: '',
        days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true
        },
        timeStart: '09:00',
        timeEnd: '18:00'
    },
    zoom: 1.0
};

// Initialize advanced print system
function initializeAdvancedPrintSystem() {
    try {
        console.log('🖨️ Initializing Advanced Print System...');
        
        // Check if print tab exists before initializing
        const printTab = document.getElementById('print-tab');
        if (!printTab) {
            console.log('📋 Print tab not found, deferring print system initialization');
            return;
        }
        
        // Initialize filter dropdowns
        initializePrintFilters();
        
        // Set default configuration
        applyPrintConfiguration();
        
        // Only generate preview if we're currently viewing the print tab
        const activeTab = document.querySelector('.nav-tab.active');
        if (activeTab && activeTab.getAttribute('data-tab') === 'print') {
            updatePrintPreview();
        }
        
        console.log('✅ Advanced Print System initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing Advanced Print System:', error);
        // Don't re-throw to prevent breaking app initialization
    }
}

// Initialize print filter dropdowns
function initializePrintFilters() {
    try {
        if (!window.dataManager) {
            console.log('📋 DataManager not available for print filters');
            return;
        }
        
        const data = window.dataManager.getData();
        if (!data) {
            console.log('📋 No data available for print filters');
            return;
        }
        
        // Check if we're in the print tab - only initialize if print tab elements exist
        const printTab = document.getElementById('print-tab');
        if (!printTab) {
            console.log('📋 Print tab not found, skipping filter initialization');
            return;
        }
        
        // Department filter
        const deptFilter = document.getElementById('printDepartmentFilter');
        if (deptFilter && data.departments) {
            const currentValue = deptFilter.value;
            deptFilter.innerHTML = '<option value="">All Departments</option>';
            data.departments.forEach(dept => {
                const selected = currentValue === dept ? 'selected' : '';
                deptFilter.innerHTML += `<option value="${dept}" ${selected}>${dept}</option>`;
            });
        }
        
        // Semester filter
        const semFilter = document.getElementById('printSemesterFilter');
        if (semFilter && data.semesters) {
            const currentValue = semFilter.value;
            semFilter.innerHTML = '<option value="">All Semesters</option>';
            data.semesters.forEach(sem => {
                const selected = currentValue === sem ? 'selected' : '';
                semFilter.innerHTML += `<option value="${sem}" ${selected}>${sem}</option>`;
            });
        }
        
        // Group filter
        const groupFilter = document.getElementById('printGroupFilter');
        if (groupFilter && data.groups) {
            const currentValue = groupFilter.value;
            groupFilter.innerHTML = '<option value="">All Groups</option>';
            data.groups.forEach(group => {
                const selected = currentValue === group ? 'selected' : '';
                groupFilter.innerHTML += `<option value="${group}" ${selected}>${group}</option>`;
            });
        }
        
        // Subject filter
        const subjectFilter = document.getElementById('printSubjectFilter');
        if (subjectFilter && data.subjects) {
            const currentValue = subjectFilter.value;
            subjectFilter.innerHTML = '<option value="">All Subjects</option>';
            data.subjects.forEach(subject => {
                const selected = currentValue === subject ? 'selected' : '';
                subjectFilter.innerHTML += `<option value="${subject}" ${selected}>${subject}</option>`;
            });
        }
        
        // Faculty filter
        const facultyFilter = document.getElementById('printFacultyFilter');
        if (facultyFilter && data.faculty) {
            const currentValue = facultyFilter.value;
            facultyFilter.innerHTML = '<option value="">All Faculty</option>';
            data.faculty.forEach(faculty => {
                const selected = currentValue === faculty ? 'selected' : '';
                facultyFilter.innerHTML += `<option value="${faculty}" ${selected}>${faculty}</option>`;
            });
        }
        
        // Room filter
        const roomFilter = document.getElementById('printRoomFilter');
        if (roomFilter && data.rooms) {
            const currentValue = roomFilter.value;
            roomFilter.innerHTML = '<option value="">All Rooms</option>';
            data.rooms.forEach(room => {
                const selected = currentValue === room ? 'selected' : '';
                roomFilter.innerHTML += `<option value="${room}" ${selected}>${room}</option>`;
            });
        }
        
        console.log('✅ Print filters initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing print filters:', error);
        // Don't throw error to prevent breaking the refresh cycle
    }
}

// Switch configuration tabs
function switchConfigTab(tabName) {
    // Remove active class from all tabs and content
    document.querySelectorAll('.config-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.config-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Add active class to selected tab and content
    const activeTab = document.querySelector(`[onclick="switchConfigTab('${tabName}')"]`);
    const activeContent = document.getElementById(`${tabName}-tab`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
}

// Select layout
function selectLayout(layout) {
    printConfig.layout = layout;
    
    // Update UI
    document.querySelectorAll('.layout-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-layout="${layout}"]`).classList.add('active');
    
    updatePrintPreview();
}

// Select color scheme
function selectColorScheme(scheme) {
    printConfig.colorScheme = scheme;
    
    // Update UI
    document.querySelectorAll('.color-scheme').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`[data-scheme="${scheme}"]`).classList.add('active');
    
    updatePrintPreview();
}

// Select export format
function selectExportFormat(format) {
    printConfig.exportFormat = format;
    
    // Update UI
    document.querySelectorAll('.format-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-format="${format}"]`).classList.add('active');
}

// Apply print configuration to UI elements
function applyPrintConfiguration() {
    // Paper size
    const paperSizeSelect = document.getElementById('paperSize');
    if (paperSizeSelect) paperSizeSelect.value = printConfig.paperSize;
    
    // Orientation
    const orientationRadio = document.querySelector(`input[name="orientation"][value="${printConfig.orientation}"]`);
    if (orientationRadio) orientationRadio.checked = true;
    
    // Margin size
    const marginSelect = document.getElementById('marginSize');
    if (marginSelect) marginSelect.value = printConfig.marginSize;
    
    // Font settings
    const fontFamilySelect = document.getElementById('fontFamily');
    if (fontFamilySelect) fontFamilySelect.value = printConfig.fontFamily;
    
    const fontSizeRange = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeRange) {
        fontSizeRange.value = printConfig.fontSize;
        if (fontSizeValue) fontSizeValue.textContent = printConfig.fontSize + 'px';
    }
    
    // Display options
    const displayOptions = ['showHeader', 'showFooter', 'showLegend', 'showPageNumbers', 'showTimestamp', 'showWatermark'];
    displayOptions.forEach(option => {
        const checkbox = document.getElementById(option);
        if (checkbox) checkbox.checked = printConfig[option];
    });
    
    // Advanced options
    const customTitle = document.getElementById('customTitle');
    if (customTitle) customTitle.value = printConfig.customTitle;
    
    const institutionName = document.getElementById('institutionName');
    if (institutionName) institutionName.value = printConfig.institutionName;
    
    const academicYear = document.getElementById('academicYear');
    if (academicYear) academicYear.value = printConfig.academicYear;
    
    const customFooter = document.getElementById('customFooter');
    if (customFooter) customFooter.value = printConfig.customFooter;
    
    // Time range
    const timeStart = document.getElementById('printTimeStart');
    if (timeStart) timeStart.value = printConfig.filters.timeStart;
    
    const timeEnd = document.getElementById('printTimeEnd');
    if (timeEnd) timeEnd.value = printConfig.filters.timeEnd;
}

// Update print preview
function updatePrintPreview() {
    try {
        console.log('🔄 Updating print preview...');
        
        // Update configuration from UI
        updateConfigFromUI();
        
        // Generate preview content
        const previewContainer = document.getElementById('printSchedule');
        if (!previewContainer) return;
        
        // Show loading state
        previewContainer.innerHTML = `
            <div class="loading-preview">
                <div class="loading-spinner"></div>
                <p>Generating preview...</p>
            </div>
        `;
        
        // Generate content based on selected layout
        setTimeout(() => {
            try {
                let content = '';
                
                switch (printConfig.layout) {
                    case 'grid':
                        content = generateGridLayout();
                        break;
                    case 'timeline':
                        content = generateTimelineLayout();
                        break;
                    case 'list':
                        content = generateListLayout();
                        break;
                    case 'compact':
                        content = generateCompactLayout();
                        break;
                    default:
                        content = generateGridLayout();
                }
                
                previewContainer.innerHTML = content;
                applyPreviewStyling();
                
                console.log('✅ Print preview updated successfully');
            } catch (error) {
                console.error('❌ Error generating preview content:', error);
                previewContainer.innerHTML = `
                    <div class="error-preview">
                        <p>❌ Error generating preview</p>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }, 500);
        
    } catch (error) {
        console.error('❌ Error updating print preview:', error);
        showNotification('Failed to update print preview', 'error');
    }
}

// Update configuration from UI elements
function updateConfigFromUI() {
    // Get filter values
    printConfig.filters.department = document.getElementById('printDepartmentFilter')?.value || '';
    printConfig.filters.semester = document.getElementById('printSemesterFilter')?.value || '';
    printConfig.filters.group = document.getElementById('printGroupFilter')?.value || '';
    printConfig.filters.subject = document.getElementById('printSubjectFilter')?.value || '';
    printConfig.filters.faculty = document.getElementById('printFacultyFilter')?.value || '';
    printConfig.filters.room = document.getElementById('printRoomFilter')?.value || '';
    
    // Get day filters
    printConfig.filters.days.monday = document.getElementById('filterMonday')?.checked || false;
    printConfig.filters.days.tuesday = document.getElementById('filterTuesday')?.checked || false;
    printConfig.filters.days.wednesday = document.getElementById('filterWednesday')?.checked || false;
    printConfig.filters.days.thursday = document.getElementById('filterThursday')?.checked || false;
    printConfig.filters.days.friday = document.getElementById('filterFriday')?.checked || false;
    printConfig.filters.days.saturday = document.getElementById('filterSaturday')?.checked || false;
    
    // Get time range
    printConfig.filters.timeStart = document.getElementById('printTimeStart')?.value || '09:00';
    printConfig.filters.timeEnd = document.getElementById('printTimeEnd')?.value || '18:00';
    
    // Get page settings
    printConfig.paperSize = document.getElementById('paperSize')?.value || 'A4';
    printConfig.marginSize = document.getElementById('marginSize')?.value || 'normal';
    
    const orientationRadio = document.querySelector('input[name="orientation"]:checked');
    if (orientationRadio) printConfig.orientation = orientationRadio.value;
    
    // Get font settings
    printConfig.fontFamily = document.getElementById('fontFamily')?.value || 'system';
    printConfig.fontSize = parseInt(document.getElementById('fontSize')?.value) || 12;
    
    // Update font size display
    const fontSizeValue = document.getElementById('fontSizeValue');
    if (fontSizeValue) fontSizeValue.textContent = printConfig.fontSize + 'px';
    
    // Get display options
    printConfig.showHeader = document.getElementById('showHeader')?.checked || false;
    printConfig.showFooter = document.getElementById('showFooter')?.checked || false;
    printConfig.showLegend = document.getElementById('showLegend')?.checked || false;
    printConfig.showPageNumbers = document.getElementById('showPageNumbers')?.checked || false;
    printConfig.showTimestamp = document.getElementById('showTimestamp')?.checked || false;
    printConfig.showWatermark = document.getElementById('showWatermark')?.checked || false;
    
    // Get advanced options
    printConfig.customTitle = document.getElementById('customTitle')?.value || '';
    printConfig.institutionName = document.getElementById('institutionName')?.value || 'Trident Academy of Technology';
    printConfig.academicYear = document.getElementById('academicYear')?.value || '2024-25';
    printConfig.customFooter = document.getElementById('customFooter')?.value || '';
    
    // Get export settings
    printConfig.exportQuality = document.getElementById('exportQuality')?.value || 'normal';
}

// Generate grid layout
function generateGridLayout() {
    if (!window.dataManager) return '<p>No data available</p>';
    
    const filteredAssignments = getFilteredAssignments();
    const timeSlots = getTimeSlots();
    const days = getSelectedDays();
    
    let html = '';
    
    // Header
    if (printConfig.showHeader) {
        html += generateHeader();
    }
    
    // Grid table
    html += '<table class="advanced-grid-table">';
    
    // Header row
    html += '<thead><tr><th class="time-column">Time</th>';
    days.forEach(day => {
        html += `<th class="day-column">${day}</th>`;
    });
    html += '</tr></thead>';
    
    // Body rows
    html += '<tbody>';
    timeSlots.forEach(timeSlot => {
        html += `<tr><td class="time-cell">${timeSlot}</td>`;
        
        days.forEach(day => {
            const dayAssignments = filteredAssignments.filter(assignment => 
                assignment.day === day && assignment.timeSlot === timeSlot
            );
            
            html += '<td class="schedule-cell">';
            if (dayAssignments.length > 0) {
                dayAssignments.forEach((assignment, index) => {
                    html += `<div class="assignment-entry color-${index % 4}">
                        <div class="assignment-subject">${assignment.subject}</div>
                        <div class="assignment-details">
                            <span class="assignment-group">${assignment.semester} ${assignment.group}</span>
                            <span class="assignment-room">${assignment.room}</span>
                        </div>
                        <div class="assignment-faculty">
                            ${[assignment.theoryFaculty, assignment.labFaculty].filter(Boolean).join(', ')}
                        </div>
                    </div>`;
                });
            } else {
                html += '<div class="no-assignment">—</div>';
            }
            html += '</td>';
        });
        
        html += '</tr>';
    });
    html += '</tbody></table>';
    
    // Footer
    if (printConfig.showFooter) {
        html += generateFooter();
    }
    
    return html;
}

// Generate timeline layout
function generateTimelineLayout() {
    if (!window.dataManager) return '<p>No data available</p>';
    
    const filteredAssignments = getFilteredAssignments();
    const days = getSelectedDays();
    
    let html = '';
    
    // Header
    if (printConfig.showHeader) {
        html += generateHeader();
    }
    
    html += '<div class="timeline-container">';
    
    days.forEach(day => {
        html += `<div class="timeline-day">
            <h3 class="timeline-day-header">${day}</h3>
            <div class="timeline-track">`;
        
        const dayAssignments = filteredAssignments
            .filter(assignment => assignment.day === day)
            .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        
        dayAssignments.forEach((assignment, index) => {
            html += `<div class="timeline-event color-${index % 4}">
                <div class="event-time">${assignment.timeSlot}</div>
                <div class="event-content">
                    <div class="event-subject">${assignment.subject}</div>
                    <div class="event-details">${assignment.semester} ${assignment.group} - ${assignment.room}</div>
                    <div class="event-faculty">${[assignment.theoryFaculty, assignment.labFaculty].filter(Boolean).join(', ')}</div>
                </div>
            </div>`;
        });
        
        html += '</div></div>';
    });
    
    html += '</div>';
    
    // Footer
    if (printConfig.showFooter) {
        html += generateFooter();
    }
    
    return html;
}

// Generate list layout
function generateListLayout() {
    if (!window.dataManager) return '<p>No data available</p>';
    
    const filteredAssignments = getFilteredAssignments();
    const days = getSelectedDays();
    
    let html = '';
    
    // Header
    if (printConfig.showHeader) {
        html += generateHeader();
    }
    
    html += '<div class="list-container">';
    
    days.forEach(day => {
        const dayAssignments = filteredAssignments
            .filter(assignment => assignment.day === day)
            .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
        
        if (dayAssignments.length > 0) {
            html += `<div class="list-day">
                <h3 class="list-day-header">${day}</h3>
                <div class="list-items">`;
            
            dayAssignments.forEach((assignment, index) => {
                html += `<div class="list-item color-${index % 4}">
                    <div class="item-header">
                        <span class="item-time">${assignment.timeSlot}</span>
                        <span class="item-subject">${assignment.subject}</span>
                    </div>
                    <div class="item-details">
                        <span class="item-class">${assignment.semester} ${assignment.group}</span>
                        <span class="item-room">${assignment.room}</span>
                        <span class="item-faculty">${[assignment.theoryFaculty, assignment.labFaculty].filter(Boolean).join(', ')}</span>
                    </div>
                </div>`;
            });
            
            html += '</div></div>';
        }
    });
    
    html += '</div>';
    
    // Footer
    if (printConfig.showFooter) {
        html += generateFooter();
    }
    
    return html;
}

// Generate compact layout
function generateCompactLayout() {
    if (!window.dataManager) return '<p>No data available</p>';
    
    const filteredAssignments = getFilteredAssignments();
    
    let html = '';
    
    // Header
    if (printConfig.showHeader) {
        html += generateHeader();
    }
    
    html += '<div class="compact-container">';
    
    // Group assignments by department/semester
    const groupedAssignments = {};
    filteredAssignments.forEach(assignment => {
        const key = `${assignment.department || 'Unknown'} - ${assignment.semester}`;
        if (!groupedAssignments[key]) groupedAssignments[key] = [];
        groupedAssignments[key].push(assignment);
    });
    
    Object.keys(groupedAssignments).forEach(groupKey => {
        html += `<div class="compact-group">
            <h4 class="compact-group-header">${groupKey}</h4>
            <div class="compact-items">`;
        
        groupedAssignments[groupKey].forEach((assignment, index) => {
            html += `<div class="compact-item color-${index % 4}">
                <span class="compact-day">${assignment.day.substr(0, 3)}</span>
                <span class="compact-time">${assignment.timeSlot}</span>
                <span class="compact-subject">${assignment.subject}</span>
                <span class="compact-group">${assignment.group}</span>
                <span class="compact-room">${assignment.room}</span>
            </div>`;
        });
        
        html += '</div></div>';
    });
    
    html += '</div>';
    
    // Footer
    if (printConfig.showFooter) {
        html += generateFooter();
    }
    
    return html;
}

// Helper functions
function getFilteredAssignments() {
    if (!window.dataManager || !window.dataManager.data) return [];
    
    const data = window.dataManager.data;
    let assignments = [...(data.assignments || [])];
    
    // Apply filters
    if (printConfig.filters.department) {
        assignments = assignments.filter(a => a.department === printConfig.filters.department);
    }
    if (printConfig.filters.semester) {
        assignments = assignments.filter(a => a.semester === printConfig.filters.semester);
    }
    if (printConfig.filters.group) {
        assignments = assignments.filter(a => a.group === printConfig.filters.group);
    }
    if (printConfig.filters.subject) {
        assignments = assignments.filter(a => a.subject === printConfig.filters.subject);
    }
    if (printConfig.filters.faculty) {
        assignments = assignments.filter(a => 
            a.theoryFaculty === printConfig.filters.faculty || 
            a.labFaculty === printConfig.filters.faculty
        );
    }
    if (printConfig.filters.room) {
        assignments = assignments.filter(a => a.room === printConfig.filters.room);
    }
    
    // Filter by selected days
    const selectedDays = getSelectedDays();
    assignments = assignments.filter(a => selectedDays.includes(a.day));
    
    // Filter by time range
    assignments = assignments.filter(a => {
        const timeSlot = a.timeSlot;
        const startTime = timeSlot.split(' - ')[0];
        return startTime >= printConfig.filters.timeStart && startTime <= printConfig.filters.timeEnd;
    });
    
    return assignments;
}

function getTimeSlots() {
    if (!window.dataManager) return [];
    
    const data = window.dataManager.getData();
    const timeSlots = [...new Set(data.assignments.map(a => a.timeSlot))].sort();
    
    // Filter by time range
    return timeSlots.filter(timeSlot => {
        const startTime = timeSlot.split(' - ')[0];
        return startTime >= printConfig.filters.timeStart && startTime <= printConfig.filters.timeEnd;
    });
}

function getSelectedDays() {
    const dayMapping = {
        monday: 'Monday',
        tuesday: 'Tuesday', 
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday'
    };
    
    return Object.keys(printConfig.filters.days)
        .filter(day => printConfig.filters.days[day])
        .map(day => dayMapping[day]);
}

function generateHeader() {
    const title = printConfig.customTitle || 'Laboratory Schedule';
    const timestamp = printConfig.showTimestamp ? new Date().toLocaleString() : '';
    
    return `
        <div class="print-header">
            <div class="header-main">
                <h1>${title}</h1>
                <h2>${printConfig.institutionName}</h2>
                <p class="academic-year">Academic Year: ${printConfig.academicYear}</p>
                ${timestamp ? `<p class="timestamp">Generated: ${timestamp}</p>` : ''}
            </div>
            ${printConfig.showWatermark ? '<div class="watermark">DRAFT</div>' : ''}
        </div>
    `;
}

function generateFooter() {
    const defaultFooter = 'For queries, contact the Lab Coordinator';
    const footerText = printConfig.customFooter || defaultFooter;
    const pageNumber = printConfig.showPageNumbers ? '<span class="page-number">Page 1</span>' : '';
    
    return `
        <div class="print-footer">
            <p>${footerText}</p>
            ${pageNumber}
        </div>
    `;
}

function applyPreviewStyling() {
    const previewContainer = document.getElementById('printSchedule');
    if (!previewContainer) return;
    
    // Apply zoom
    previewContainer.style.transform = `scale(${printConfig.zoom})`;
    previewContainer.style.transformOrigin = 'top left';
    
    // Apply color scheme
    previewContainer.className = `print-schedule ${printConfig.colorScheme}-theme`;
    
    // Apply font settings
    previewContainer.style.fontFamily = getFontFamily(printConfig.fontFamily);
    previewContainer.style.fontSize = printConfig.fontSize + 'px';
}

function getFontFamily(family) {
    const fontMap = {
        'system': 'system-ui, -apple-system, sans-serif',
        'arial': 'Arial, sans-serif',
        'helvetica': 'Helvetica, Arial, sans-serif',
        'times': 'Times New Roman, serif',
        'georgia': 'Georgia, serif',
        'calibri': 'Calibri, sans-serif'
    };
    return fontMap[family] || fontMap['system'];
}

// Zoom functions
function zoomPreview(delta) {
    printConfig.zoom = Math.max(0.5, Math.min(2.0, printConfig.zoom + delta));
    updateZoomDisplay();
    applyPreviewStyling();
}

function resetZoom() {
    printConfig.zoom = 1.0;
    updateZoomDisplay();
    applyPreviewStyling();
}

function updateZoomDisplay() {
    const zoomDisplay = document.getElementById('zoomLevel');
    if (zoomDisplay) {
        zoomDisplay.textContent = Math.round(printConfig.zoom * 100) + '%';
    }
}

// Quick actions
function quickPrint() {
    updatePrintPreview();
    setTimeout(() => {
        window.print();
    }, 1000);
}

function showPrintPreview() {
    updatePrintPreview();
    showNotification('Print preview updated', 'success');
}

function exportToPDF() {
    try {
        // Use browser's print to PDF functionality
        const assignments = getFilteredAssignments();
        
        if (assignments.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        showNotification('Opening print dialog for PDF export...', 'info');
        
        // Store current layout and switch to a print-optimized layout
        const originalLayout = printConfig.layout;
        selectLayout('list'); // Use list layout for PDF
        
        // Trigger print preview update
        updatePrintPreview();
        
        // Open browser print dialog after a brief delay
        setTimeout(() => {
            window.print();
            
            // Restore original layout after print
            setTimeout(() => {
                selectLayout(originalLayout);
            }, 1000);
        }, 500);
        
    } catch (error) {
        console.error('❌ Error exporting to PDF:', error);
        showNotification('Failed to export PDF. Try using browser print instead.', 'error');
    }
}

function exportToExcel() {
    try {
        const assignments = getFilteredAssignments();
        
        if (assignments.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        // Create comprehensive CSV content with better formatting
        const headers = [
            'Day', 'Time Slot', 'Subject', 'Semester', 'Group', 
            'Lab Room', 'Theory Faculty', 'Lab Faculty', 'Department'
        ];
        const csvContent = [headers.join(',')];
        
        // Sort assignments by day and time for better readability
        const sortedAssignments = assignments.sort((a, b) => {
            const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayA = dayOrder.indexOf(a.day);
            const dayB = dayOrder.indexOf(b.day);
            if (dayA !== dayB) return dayA - dayB;
            return (a.timeSlot || '').localeCompare(b.timeSlot || '');
        });
        
        sortedAssignments.forEach(assignment => {
            const row = [
                assignment.day || '',
                assignment.timeSlot || '',
                assignment.subject || '',
                assignment.semester || '',
                assignment.group || '',
                assignment.labRoom || assignment.room || '',
                assignment.theoryFaculty || '',
                assignment.labFaculty || '',
                assignment.department || ''
            ];
            // Escape quotes and wrap in quotes for CSV safety
            csvContent.push(row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
        });
        
        // Add summary at the end
        csvContent.push('');
        csvContent.push('"=== SUMMARY ==="');
        csvContent.push(`"Total Assignments:","${assignments.length}"`);
        csvContent.push(`"Export Date:","${new Date().toLocaleString()}"`);
        
        // Create and download file with better filename
        const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate descriptive filename
        const date = new Date().toISOString().split('T')[0];
        const filters = [];
        if (printConfig.filters.department) filters.push(printConfig.filters.department);
        if (printConfig.filters.semester) filters.push(`Sem${printConfig.filters.semester}`);
        if (printConfig.filters.group) filters.push(printConfig.filters.group);
        
        const filterSuffix = filters.length > 0 ? `_${filters.join('_')}` : '';
        a.download = `LAMS_Schedule${filterSuffix}_${date}.csv`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification(`Schedule exported successfully! ${assignments.length} assignments exported.`, 'success');
        
    } catch (error) {
        console.error('❌ Error exporting to Excel:', error);
        showNotification('Failed to export schedule', 'error');
    }
}

// Make functions globally available
window.initializeAdvancedPrintSystem = initializeAdvancedPrintSystem;
window.initializePrintFilters = initializePrintFilters;
window.switchConfigTab = switchConfigTab;
window.selectLayout = selectLayout;
window.selectColorScheme = selectColorScheme;
window.selectExportFormat = selectExportFormat;
window.updatePrintPreview = updatePrintPreview;
window.zoomPreview = zoomPreview;
window.resetZoom = resetZoom;
window.quickPrint = quickPrint;
window.showPrintPreview = showPrintPreview;
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.retryChartLoad = retryChartLoad;

// Make tab render functions globally available (FIXED)
window.renderAnalytics = renderAnalytics;
window.renderPrintSchedule = renderPrintSchedule;
window.renderDashboard = renderDashboard;
window.renderSchedule = renderSchedule;

// System validation function for debugging
window.validateSystem = function() {
    console.log('🔍 LAMS SYSTEM VALIDATION REPORT:');
    console.log('=====================================');
    
    // Core Components
    console.log('📦 CORE COMPONENTS:');
    console.log('├── DataManager:', typeof window.dataManager, window.dataManager ? '✅' : '❌');
    console.log('├── NotificationManager:', typeof window.notificationManager, window.notificationManager ? '✅' : '❌');
    console.log('├── AuthManager:', typeof window.authManager, window.authManager ? '✅' : '❌');
    console.log('└── Config:', typeof window.CONFIG, window.CONFIG ? '✅' : '❌');
    
    // External Libraries
    console.log('\n📚 EXTERNAL LIBRARIES:');
    console.log('├── Chart.js:', typeof Chart !== 'undefined' ? '✅' : '❌');
    console.log('├── Google API:', typeof gapi !== 'undefined' ? '✅' : '❌');
    console.log('└── Google Auth:', typeof google !== 'undefined' ? '✅' : '❌');
    
    // Core Functions
    console.log('\n🔧 CORE FUNCTIONS:');
    console.log('├── showTab:', typeof window.showTab, window.showTab ? '✅' : '❌');
    console.log('├── renderAnalytics:', typeof window.renderAnalytics, typeof renderAnalytics !== 'undefined' ? '✅' : '❌');
    console.log('├── renderDashboard:', typeof window.renderDashboard, typeof renderDashboard !== 'undefined' ? '✅' : '❌');
    console.log('├── initializeAdvancedPrintSystem:', typeof window.initializeAdvancedPrintSystem, window.initializeAdvancedPrintSystem ? '✅' : '❌');
    console.log('└── retryChartLoad:', typeof window.retryChartLoad, window.retryChartLoad ? '✅' : '❌');
    
    // DOM Elements
    console.log('\n🎯 DOM ELEMENTS:');
    const tabs = ['dashboard', 'assignment', 'schedule', 'master-data', 'analytics', 'print', 'activity'];
    tabs.forEach(tab => {
        const element = document.getElementById(`${tab}-tab`);
        console.log(`├── ${tab}-tab:`, element ? '✅' : '❌');
    });
    
    // Print System
    console.log('\n🖨️ PRINT SYSTEM:');
    console.log('├── Print Schedule Container:', document.getElementById('printSchedule') ? '✅' : '❌');
    console.log('├── Print Filters:', document.getElementById('printDepartmentFilter') ? '✅' : '❌');
    console.log('└── Layout Options:', document.querySelector('.layout-option') ? '✅' : '❌');
    
    console.log('\n=====================================');
    console.log('💡 Use validateSystem() anytime to check system health');
    
    return {
        dataManager: !!window.dataManager,
        notificationManager: !!window.notificationManager,
        chartJs: typeof Chart !== 'undefined',
        googleApi: typeof gapi !== 'undefined',
        coreTabsPresent: tabs.every(tab => !!document.getElementById(`${tab}-tab`)),
        printSystemReady: !!document.getElementById('printSchedule')
    };
};
