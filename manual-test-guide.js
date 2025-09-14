// LAMS Manual Function Test Guide
// Copy and paste sections into browser console for targeted testing

console.log('🎯 LAMS Manual Testing Guide - Copy sections below into console');

// ==============================================
// SECTION 1: Test Assignment Creation (Main Issue)
// ==============================================
console.log(`
📝 TEST ASSIGNMENT CREATION:
Copy and run this code block:

// Test 1: Check if form and handler are properly set up
const assignmentForm = document.getElementById('assignmentForm');
console.log('Form exists:', !!assignmentForm);
console.log('Form has submit listener:', assignmentForm && assignmentForm.onsubmit !== null);

// Test 2: Fill form programmatically and test submission
if (assignmentForm && window.dataManager) {
    // Fill form with test data
    document.getElementById('assignmentDay').value = 'Monday';
    document.getElementById('assignmentTimeSlot').value = '9:00-10:00';
    document.getElementById('assignmentDepartment').value = 'Computer Science';
    document.getElementById('assignmentSemester').value = '1st Semester';
    document.getElementById('assignmentGroup').value = 'Group A';
    document.getElementById('assignmentSubGroup').value = 'Sub Group 1';
    document.getElementById('assignmentSubject').value = 'Data Structures';
    document.getElementById('assignmentLabRoom').value = 'Lab 1';
    document.getElementById('assignmentTheoryFaculty').value = 'Dr. Smith';
    document.getElementById('assignmentLabFaculty').value = 'Prof. Davis';
    
    console.log('✅ Form filled with test data');
    
    // Test manual submission
    console.log('Testing form submission...');
    const submitEvent = new SubmitEvent('submit', { cancelable: true, bubbles: true });
    assignmentForm.dispatchEvent(submitEvent);
} else {
    console.error('❌ Form or DataManager not available');
}
`);

// ==============================================
// SECTION 2: Test Navigation Functions
// ==============================================
console.log(`
🧭 TEST NAVIGATION:
Copy and run this code block:

// Test all tab navigation
const tabs = ['dashboard', 'assignment', 'schedule', 'master-data', 'analytics', 'print', 'activity'];
tabs.forEach(tab => {
    try {
        showTab(tab);
        console.log('✅ showTab(\\''+tab+'\\') works');
    } catch(e) {
        console.error('❌ showTab(\\''+tab+'\\') failed:', e.message);
    }
});

// Return to dashboard
showTab('dashboard');
`);

// ==============================================
// SECTION 3: Test Master Data Functions
// ==============================================
console.log(`
📊 TEST MASTER DATA:
Copy and run this code block:

// Test adding departments
try {
    const deptInput = document.getElementById('newDepartment');
    if (deptInput) {
        deptInput.value = 'Test Department';
        addMasterDataItem('departments', 'newDepartment');
        console.log('✅ Add department works');
    }
} catch(e) {
    console.error('❌ Add department failed:', e.message);
}

// Test adding time slots
try {
    const timeInput = document.getElementById('newTimeSlot');
    if (timeInput) {
        timeInput.value = '8:00-9:00';
        addMasterDataItem('timeSlots', 'newTimeSlot');
        console.log('✅ Add time slot works');
    }
} catch(e) {
    console.error('❌ Add time slot failed:', e.message);
}

// Test adding subjects
try {
    const subjectInput = document.getElementById('newSubject');
    if (subjectInput) {
        subjectInput.value = 'Test Subject';
        addMasterDataItem('subjects', 'newSubject');
        console.log('✅ Add subject works');
    }
} catch(e) {
    console.error('❌ Add subject failed:', e.message);
}
`);

// ==============================================
// SECTION 4: Test Schedule Functions
// ==============================================
console.log(`
📅 TEST SCHEDULE FUNCTIONS:
Copy and run this code block:

// Test schedule orientation toggle
try {
    const oldOrientation = window.dataManager.data.scheduleOrientation;
    toggleScheduleOrientation();
    const newOrientation = window.dataManager.data.scheduleOrientation;
    console.log('✅ Schedule orientation changed from', oldOrientation, 'to', newOrientation);
} catch(e) {
    console.error('❌ Toggle schedule orientation failed:', e.message);
}

// Test academic year edit
try {
    editAcademicYear();
    console.log('✅ Edit academic year dialog opened');
} catch(e) {
    console.error('❌ Edit academic year failed:', e.message);
}

// Test render schedule
try {
    renderSchedule();
    console.log('✅ Render schedule works');
} catch(e) {
    console.error('❌ Render schedule failed:', e.message);
}
`);

// ==============================================
// SECTION 5: Test Data Export/Import
// ==============================================
console.log(`
💾 TEST DATA FUNCTIONS:
Copy and run this code block:

// Test export data
try {
    exportData();
    console.log('✅ Export data works');
} catch(e) {
    console.error('❌ Export data failed:', e.message);
}

// Test system health
try {
    runSystemHealthCheck();
    console.log('✅ System health check works');
} catch(e) {
    console.error('❌ System health check failed:', e.message);
}

// Test activity feed
try {
    refreshActivityFeed();
    console.log('✅ Refresh activity feed works');
} catch(e) {
    console.error('❌ Refresh activity feed failed:', e.message);
}
`);

// ==============================================
// SECTION 6: Test Core Render Functions
// ==============================================
console.log(`
🎨 TEST RENDER FUNCTIONS:
Copy and run this code block:

// Test all render functions
const renderTests = [
    'renderDashboard',
    'renderAssignmentsList',
    'renderSchedule', 
    'updateCountBadges',
    'refreshDropdowns'
];

renderTests.forEach(funcName => {
    try {
        if (typeof window[funcName] === 'function') {
            window[funcName]();
            console.log('✅', funcName, 'works');
        } else {
            console.error('❌', funcName, 'not found');
        }
    } catch(e) {
        console.error('❌', funcName, 'failed:', e.message);
    }
});
`);

// ==============================================
// SECTION 7: Test Assignment Search and Validation
// ==============================================
console.log(`
🔍 TEST ASSIGNMENT FEATURES:
Copy and run this code block:

// Test assignment search
try {
    const searchInput = document.getElementById('assignmentSearch');
    if (searchInput) {
        searchInput.value = 'Computer';
        searchInput.dispatchEvent(new Event('input'));
        console.log('✅ Assignment search works');
        searchInput.value = ''; // clear
    }
} catch(e) {
    console.error('❌ Assignment search failed:', e.message);
}

// Test assignment preview
try {
    // Fill form first
    document.getElementById('assignmentDay').value = 'Tuesday';
    document.getElementById('assignmentTimeSlot').value = '10:00-11:00';
    document.getElementById('assignmentDepartment').value = 'Mathematics';
    document.getElementById('assignmentSemester').value = '2nd Semester';
    
    previewAssignment();
    console.log('✅ Assignment preview works');
    
    // Clean up modal
    setTimeout(() => {
        const modal = document.querySelector('.assignment-preview-modal');
        if (modal) modal.remove();
    }, 1000);
} catch(e) {
    console.error('❌ Assignment preview failed:', e.message);
}
`);

// ==============================================
// SECTION 8: Complete System Test
// ==============================================
console.log(`
🚀 COMPLETE SYSTEM TEST:
Copy and run this code block:

// Complete workflow test
async function completeSystemTest() {
    console.log('🚀 Running complete system test...');
    
    // 1. Test DataManager
    console.log('1. Testing DataManager...');
    if (window.dataManager) {
        console.log('✅ DataManager exists');
        console.log('   - Assignments:', window.dataManager.data.assignments.length);
        console.log('   - Departments:', window.dataManager.data.departments.length);
        console.log('   - Time slots:', window.dataManager.data.timeSlots.length);
    } else {
        console.error('❌ DataManager missing');
        return;
    }
    
    // 2. Test UI Components
    console.log('2. Testing UI components...');
    const criticalElements = [
        'assignmentForm',
        'assignmentsList', 
        'scheduleGrid',
        'totalAssignments',
        'syncStatus'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log('✅', id, 'exists');
        } else {
            console.error('❌', id, 'missing');
        }
    });
    
    // 3. Test Core Functions
    console.log('3. Testing core functions...');
    const coreFunctions = [
        'showTab',
        'addMasterDataItem', 
        'toggleScheduleOrientation',
        'exportData',
        'renderDashboard'
    ];
    
    coreFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log('✅', funcName, 'exists');
        } else {
            console.error('❌', funcName, 'missing');
        }
    });
    
    console.log('🎯 System test complete!');
}

completeSystemTest();
`);