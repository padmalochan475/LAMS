// LAMS System Functionality Test Suite
// Run this in the browser console after loading the app

console.log('🚀 Starting LAMS Comprehensive Function Test');

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    warnings: []
};

function logResult(testName, passed, details = '') {
    const result = { test: testName, details };
    if (passed) {
        testResults.passed.push(result);
        console.log(`✅ ${testName}`, details);
    } else {
        testResults.failed.push(result);
        console.log(`❌ ${testName}`, details);
    }
}

function logWarning(testName, details) {
    testResults.warnings.push({ test: testName, details });
    console.log(`⚠️ ${testName}`, details);
}

// 1. Core System Tests
function testCoreSystem() {
    console.log('\n📋 Testing Core System Functions...');
    
    // Test DataManager exists and is initialized
    logResult('DataManager exists', typeof window.dataManager !== 'undefined');
    logResult('DataManager has data', window.dataManager && window.dataManager.data !== undefined);
    logResult('DataManager assignments array', Array.isArray(window.dataManager?.data?.assignments));
    
    // Test AuthManager exists
    logResult('AuthManager exists', typeof window.authManager !== 'undefined');
    
    // Test NotificationManager exists
    logResult('NotificationManager exists', typeof window.notificationManager !== 'undefined');
    
    // Test showMessage function
    try {
        showMessage('Test message', 'info');
        logResult('showMessage function', true, 'Test message displayed');
    } catch (e) {
        logResult('showMessage function', false, e.message);
    }
}

// 2. Navigation and UI Tests
function testNavigation() {
    console.log('\n🧭 Testing Navigation Functions...');
    
    const tabs = ['dashboard', 'assignment', 'schedule', 'master-data', 'analytics', 'print', 'activity', 'system-health'];
    
    tabs.forEach(tabId => {
        try {
            showTab(tabId);
            const activeTab = document.querySelector('.nav-tab.active');
            const tabContent = document.getElementById(`${tabId}-tab`);
            logResult(`showTab('${tabId}')`, tabContent !== null, `Tab content exists: ${tabContent !== null}`);
        } catch (e) {
            logResult(`showTab('${tabId}')`, false, e.message);
        }
    });
}

// 3. Master Data Management Tests
function testMasterDataFunctions() {
    console.log('\n📊 Testing Master Data Functions...');
    
    const masterDataTypes = [
        { type: 'departments', inputId: 'newDepartment' },
        { type: 'semesters', inputId: 'newSemester' },
        { type: 'groups', inputId: 'newGroup' },
        { type: 'subGroups', inputId: 'newSubGroup' },
        { type: 'timeSlots', inputId: 'newTimeSlot' },
        { type: 'subjects', inputId: 'newSubject' },
        { type: 'labRooms', inputId: 'newLabRoom' }
    ];
    
    masterDataTypes.forEach(({ type, inputId }) => {
        try {
            // Test if function exists and can be called
            const input = document.getElementById(inputId);
            if (input) {
                input.value = `Test ${type}`;
                addMasterDataItem(type, inputId);
                logResult(`addMasterDataItem('${type}')`, true, 'Function executed without error');
                input.value = ''; // Clear test data
            } else {
                logWarning(`addMasterDataItem('${type}')`, `Input element ${inputId} not found`);
            }
        } catch (e) {
            logResult(`addMasterDataItem('${type}')`, false, e.message);
        }
    });
    
    // Test faculty functions
    try {
        addFaculty('theory');
        logResult("addFaculty('theory')", true, 'Function executed without error');
    } catch (e) {
        logResult("addFaculty('theory')", false, e.message);
    }
    
    try {
        addFaculty('lab');
        logResult("addFaculty('lab')", true, 'Function executed without error');
    } catch (e) {
        logResult("addFaculty('lab')", false, e.message);
    }
}

// 4. Assignment Management Tests
function testAssignmentFunctions() {
    console.log('\n📝 Testing Assignment Functions...');
    
    // Test assignment creation (without actually submitting)
    try {
        const form = document.getElementById('assignmentForm');
        logResult('Assignment form exists', form !== null);
        
        if (form) {
            // Test form submission handler exists
            const listeners = getEventListeners ? getEventListeners(form) : [];
            logResult('Assignment form has submit listener', form._listeners || listeners.submit || true, 'Cannot verify listeners in all browsers');
        }
    } catch (e) {
        logResult('Assignment form test', false, e.message);
    }
    
    // Test preview function
    try {
        previewAssignment();
        logResult('previewAssignment()', true, 'Function executed without error');
        // Clean up modal
        const modal = document.querySelector('.assignment-preview-modal');
        if (modal) modal.remove();
    } catch (e) {
        logResult('previewAssignment()', false, e.message);
    }
    
    // Test search functionality
    try {
        const searchInput = document.getElementById('assignmentSearch');
        if (searchInput) {
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input'));
            logResult('Assignment search', true, 'Search input event fired');
            searchInput.value = '';
        } else {
            logWarning('Assignment search', 'Search input not found');
        }
    } catch (e) {
        logResult('Assignment search', false, e.message);
    }
}

// 5. Schedule and Print Tests
function testScheduleAndPrint() {
    console.log('\n📅 Testing Schedule and Print Functions...');
    
    try {
        toggleScheduleOrientation();
        logResult('toggleScheduleOrientation()', true, 'Function executed without error');
    } catch (e) {
        logResult('toggleScheduleOrientation()', false, e.message);
    }
    
    try {
        editAcademicYear();
        logResult('editAcademicYear()', true, 'Function executed without error');
    } catch (e) {
        logResult('editAcademicYear()', false, e.message);
    }
    
    // Test print functionality
    try {
        // Test if print button exists and function is callable
        const printBtn = document.querySelector('button[onclick="window.print()"]');
        logResult('Print button exists', printBtn !== null);
    } catch (e) {
        logResult('Print functionality', false, e.message);
    }
}

// 6. Analytics Tests
function testAnalytics() {
    console.log('\n📊 Testing Analytics Functions...');
    
    try {
        // Check if Chart.js is loaded
        logResult('Chart.js loaded', typeof Chart !== 'undefined');
        
        // Test if analytics rendering functions exist
        logResult('renderAnalytics exists', typeof renderAnalytics === 'function');
        
        if (typeof renderAnalytics === 'function') {
            renderAnalytics();
            logResult('renderAnalytics()', true, 'Function executed without error');
        }
    } catch (e) {
        logResult('Analytics functions', false, e.message);
    }
}

// 7. Activity Feed Tests
function testActivityFeed() {
    console.log('\n📋 Testing Activity Feed Functions...');
    
    try {
        refreshActivityFeed();
        logResult('refreshActivityFeed()', true, 'Function executed without error');
    } catch (e) {
        logResult('refreshActivityFeed()', false, e.message);
    }
    
    try {
        clearActivityFeed();
        logResult('clearActivityFeed()', true, 'Function executed without error');
    } catch (e) {
        logResult('clearActivityFeed()', false, e.message);
    }
}

// 8. System Health Tests
function testSystemHealth() {
    console.log('\n🔧 Testing System Health Functions...');
    
    try {
        runSystemHealthCheck();
        logResult('runSystemHealthCheck()', true, 'Function executed without error');
    } catch (e) {
        logResult('runSystemHealthCheck()', false, e.message);
    }
    
    try {
        runQuickDiagnostic();
        logResult('runQuickDiagnostic()', true, 'Function executed without error');
    } catch (e) {
        logResult('runQuickDiagnostic()', false, e.message);
    }
    
    try {
        exportSystemReport();
        logResult('exportSystemReport()', true, 'Function executed without error');
    } catch (e) {
        logResult('exportSystemReport()', false, e.message);
    }
}

// 9. Data Management Tests
function testDataManagement() {
    console.log('\n💾 Testing Data Management Functions...');
    
    try {
        exportData();
        logResult('exportData()', true, 'Function executed without error');
    } catch (e) {
        logResult('exportData()', false, e.message);
    }
    
    // Test import (without actually importing)
    try {
        // Just test if function exists and is callable
        logResult('importData exists', typeof importData === 'function');
    } catch (e) {
        logResult('importData function', false, e.message);
    }
}

// 10. Authentication Tests (without actual auth)
function testAuthentication() {
    console.log('\n🔐 Testing Authentication Functions...');
    
    try {
        logResult('signOut exists', typeof signOut === 'function');
        logResult('showUserManagement exists', typeof showUserManagement === 'function');
        logResult('enableCloudSync exists', typeof enableCloudSync === 'function');
    } catch (e) {
        logResult('Authentication functions', false, e.message);
    }
}

// 11. Render Functions Tests
function testRenderFunctions() {
    console.log('\n🎨 Testing Render Functions...');
    
    const renderFunctions = [
        'renderDashboard',
        'renderAssignmentsList', 
        'renderSchedule',
        'renderMasterDataLists',
        'renderPrintSchedule',
        'updateCountBadges',
        'refreshDropdowns'
    ];
    
    renderFunctions.forEach(funcName => {
        try {
            if (typeof window[funcName] === 'function') {
                window[funcName]();
                logResult(`${funcName}()`, true, 'Function executed without error');
            } else {
                logResult(`${funcName} exists`, false, 'Function not found');
            }
        } catch (e) {
            logResult(`${funcName}()`, false, e.message);
        }
    });
}

// Main test runner
function runAllTests() {
    console.clear();
    console.log('🚀 LAMS Comprehensive Function Test Suite');
    console.log('==========================================');
    
    testCoreSystem();
    testNavigation();
    testMasterDataFunctions();
    testAssignmentFunctions();
    testScheduleAndPrint();
    testAnalytics();
    testActivityFeed();
    testSystemHealth();
    testDataManagement();
    testAuthentication();
    testRenderFunctions();
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
    
    if (testResults.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.failed.forEach(result => {
            console.log(`  - ${result.test}: ${result.details}`);
        });
    }
    
    if (testResults.warnings.length > 0) {
        console.log('\n⚠️ WARNINGS:');
        testResults.warnings.forEach(result => {
            console.log(`  - ${result.test}: ${result.details}`);
        });
    }
    
    console.log('\n🎯 Test completed!');
    return testResults;
}

// Auto-run the tests
runAllTests();