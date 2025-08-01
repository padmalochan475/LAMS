// Lab Assignment Management System - Complete Implementation

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
            scheduleOrientation: "daysHorizontal" // or "timesHorizontal"
        };
        this.init();
    }

    init() {
        this.load();
        this.validateMasterDataIntegrity();
        setTimeout(() => {
            this.refreshAllComponents();
        }, 100);
    }

    load() {
        const saved = localStorage.getItem('labManagementData');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.keys(this.data).forEach(key => {
                    if (parsed[key]) {
                        this.data[key] = parsed[key];
                    }
                });
            } catch (e) {
                console.error('Error loading data:', e);
            }
        }
    }

    save() {
        try {
            localStorage.setItem('labManagementData', JSON.stringify(this.data));
            this.validateMasterDataIntegrity();
            this.refreshAllComponents();
        } catch (e) {
            console.error('Error saving data:', e);
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
            if (roomConflict) conflictMessage += 'Room already in use. ';
            if (facultyConflict) conflictMessage += 'Faculty already assigned. ';
            if (classConflict) conflictMessage += 'Class already has a lab.';
            
            showConflictNotification(conflictMessage);
            return false;
        }

        this.data.assignments.push(assignment);
        this.save();
        showMessage('Assignment created successfully!', 'success');
        return true;
    }

    removeAssignment(index) {
        if (index >= 0 && index < this.data.assignments.length) {
            this.data.assignments.splice(index, 1);
            this.save();
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
        return `${assignment.department}-${assignment.group}-${assignment.subGroup}-${assignment.subject}-(${assignment.theoryFaculty},${assignment.labFaculty})-${assignment.labRoom}`;
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

// Global data manager instance
let dataManager;

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
        { id: 'assignmentTheoryFaculty', data: dataManager.getFacultyShortNames('theory') },
        { id: 'assignmentLabFaculty', data: dataManager.getFacultyShortNames('lab') },
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
                option.value = item;
                option.textContent = item;
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
                        ${assignment.day} | ${assignment.timeSlot}
                    </div>
                </div>
            `).join('');
        }
    }
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

    let maxAssignmentsPerCell = 1;
    if (dataManager.data.scheduleOrientation === "timesHorizontal") {
        dataManager.data.days.forEach(day => {
            dataManager.data.timeSlots.forEach(timeSlot => {
                const count = filteredAssignments.filter(a => 
                    a.day === day && a.timeSlot === timeSlot
                ).length;
                if (count > maxAssignmentsPerCell) maxAssignmentsPerCell = count;
            });
        });
    } else {
        dataManager.data.timeSlots.forEach(timeSlot => {
            dataManager.data.days.forEach(day => {
                const count = filteredAssignments.filter(a => 
                    a.day === day && a.timeSlot === timeSlot
                ).length;
                if (count > maxAssignmentsPerCell) maxAssignmentsPerCell = count;
            });
        });
    }

    const baseFontSize = 10;
    const minFontSize = 8;
    const fontSize = Math.max(minFontSize, baseFontSize - (maxAssignmentsPerCell * 0.5));

    if (dataManager.data.scheduleOrientation === "timesHorizontal") {
        let html = `
            <table class="print-table" style="font-size: ${fontSize}px">
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
                    html += `<div class="print-entry">${dataManager.getAssignmentDisplay(assignment)}</div>`;
                });
                html += '</td>';
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        grid.innerHTML = html;
    } else {
        let html = `
            <table class="print-table" style="font-size: ${fontSize}px">
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
                    html += `<div class="print-entry">${dataManager.getAssignmentDisplay(assignment)}</div>`;
                });
                html += '</td>';
            });
            
            html += '</tr>';
        });

        html += '</tbody></table>';
        grid.innerHTML = html;
    }
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

// Tab Management
function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const selectedTab = document.querySelector(`[data-tab="${tabId}"]`);
    const selectedContent = document.getElementById(`${tabId}-tab`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedContent) selectedContent.classList.add('active');
    
    if (tabId === 'analytics') {
        setTimeout(renderAnalytics, 100);
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

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    dataManager = new DataManager();
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-color-scheme', savedTheme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = e.currentTarget.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

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
        assignmentSearch.addEventListener('input', renderAssignmentsList);
    }

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

    console.log('Lab Assignment Management System initialized successfully!');
});