       let workspaces = [];
        let currentWorkspaceId = null;
        let editingTaskId = null;
        let sidebarVisible = true;
        let clockInterval = null;
        let dueDateCheckInterval = null;
        let confirmCallback = null;
        let deleteItemId = null;

        function init() {
            loadFromLocalStorage();
            renderWorkspaces();
            
            if (workspaces.length > 0) {
                selectWorkspace(workspaces[0].id);
            }
            
            updateOwnerFilter();
            checkMobile();
            startClock();
            startDueDateChecker();
        }

        function saveToLocalStorage() {
            localStorage.setItem('todoWorkspaces', JSON.stringify(workspaces));
        }

        function loadFromLocalStorage() {
            const stored = localStorage.getItem('todoWorkspaces');
            if (stored) {
                workspaces = JSON.parse(stored);
            }
        }

        function showConfirmModal(options) {
            const modal = document.getElementById('confirmModal');
            const title = document.getElementById('confirmTitle');
            const message = document.getElementById('confirmMessage');
            const itemName = document.getElementById('confirmItemName');
            const warning = document.getElementById('confirmWarning');
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            
            title.textContent = options.title || 'Confirm Delete';
            message.textContent = options.message || 'Are you sure you want to delete this item?';
            itemName.textContent = options.itemName || '';
            warning.textContent = options.warning || 'This action cannot be undone.';
            
            confirmCallback = options.onConfirm;
            
            const newBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
            
            document.getElementById('confirmDeleteBtn').onclick = function() {
                if (confirmCallback) {
                    confirmCallback();
                }
                closeConfirmModal();
            };
            
            modal.classList.add('active');
        }

        function closeConfirmModal() {
            const modal = document.getElementById('confirmModal');
            modal.classList.remove('active');
            confirmCallback = null;
            deleteItemId = null;
        }

        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const toggleIcon = document.getElementById('toggleIcon');
            
            sidebar.classList.toggle('hidden');
            sidebarVisible = !sidebarVisible;
            
            toggleIcon.textContent = sidebarVisible ? '◀' : '▶';
            
            if (window.innerWidth <= 480) {
                overlay.classList.toggle('active');
            }
        }

        function checkMobile() {
            if (window.innerWidth <= 480) {
                document.getElementById('sidebar').classList.add('hidden');
                sidebarVisible = false;
                document.getElementById('toggleIcon').textContent = '▶';
            }
        }

        window.addEventListener('resize', function() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            if (window.innerWidth > 480) {
                overlay.classList.remove('active');
            } else if (!sidebar.classList.contains('hidden')) {
                overlay.classList.add('active');
            }
        });

        function openWorkspaceModal() {
            const modal = document.getElementById('workspaceModal');
            const form = document.getElementById('workspaceForm');
            
            form.reset();
            modal.classList.add('active');
            
            setTimeout(() => {
                document.getElementById('workspaceName').focus();
            }, 100);
        }

        function closeWorkspaceModal() {
            const modal = document.getElementById('workspaceModal');
            modal.classList.remove('active');
            document.getElementById('workspaceForm').reset();
        }

        document.getElementById('workspaceForm').onsubmit = function(e) {
            e.preventDefault();
            
            const name = document.getElementById('workspaceName').value;
            const description = document.getElementById('workspaceDescription').value;
            
            if (!name || !name.trim()) {
                alert('Workspace name is required!');
                return;
            }
            
            const isDuplicate = workspaces.some(ws => 
                ws.name.toLowerCase() === name.trim().toLowerCase()
            );
            
            if (isDuplicate) {
                alert('Workspace with this name already exists!');
                return;
            }
            
            const workspace = {
                id: Date.now(),
                name: name.trim(),
                description: description.trim(),
                tasks: [],
                createdAt: new Date().toISOString()
            };
            
            workspaces.push(workspace);
            saveToLocalStorage();
            renderWorkspaces();
            selectWorkspace(workspace.id);
            closeWorkspaceModal();
        };

        function deleteWorkspace(id, event) {
            event.stopPropagation();
            
            const workspace = workspaces.find(w => w.id === id);
            
            if (!workspace) return;
            
            const taskCount = workspace.tasks.length;
            
            showConfirmModal({
                title: 'Delete Workspace?',
                message: 'Are you sure you want to delete this workspace?',
                itemName: workspace.name,
                warning: taskCount > 0 
                    ? `This workspace contains ${taskCount} task${taskCount > 1 ? 's' : ''}. All tasks will be permanently deleted.`
                    : 'This action cannot be undone.',
                onConfirm: () => {
                    workspaces = workspaces.filter(w => w.id !== id);
                    saveToLocalStorage();
                    renderWorkspaces();
                    
                    if (currentWorkspaceId === id) {
                        currentWorkspaceId = null;
                        
                        if (workspaces.length > 0) {
                            selectWorkspace(workspaces[0].id);
                        } else {
                            renderTasks();
                        }
                    }
                    
                    console.log(`Workspace "${workspace.name}" deleted successfully`);
                }
            });
        }

        function selectWorkspace(id) {
            currentWorkspaceId = id;
            renderWorkspaces();
            renderTasks();
            
            document.getElementById('searchInput').value = '';
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterOwner').value = '';
            
            if (window.innerWidth <= 480 && sidebarVisible) {
                toggleSidebar();
            }
        }

        function renderWorkspaces() {
            const list = document.getElementById('workspaceList');
            list.innerHTML = '';
            
            workspaces.forEach(ws => {
                const li = document.createElement('li');
                li.className = 'workspace-item' + (ws.id === currentWorkspaceId ? ' active' : '');
                li.onclick = () => selectWorkspace(ws.id);
                li.innerHTML = `
                    <span>${ws.name}</span>
                    <span class="delete-ws" onclick="deleteWorkspace(${ws.id}, event)">×</span>
                `;
                list.appendChild(li);
            });
        }

        function startClock() {
            updateClock();
            clockInterval = setInterval(updateClock, 1000);
        }

        function startDueDateChecker() {
            checkAndUpdateOverdueTasks();
            dueDateCheckInterval = setInterval(checkAndUpdateOverdueTasks, 60000);
            scheduleMidnightCheck();
        }

        function checkAndUpdateOverdueTasks() {
            if (currentWorkspaceId) {
                const now = new Date();
                const hours = now.getHours();
                const minutes = now.getMinutes();
                
                if (hours === 0 && minutes === 0) {
                    console.log('Midnight - updating task statuses...');
                    renderTasks();
                }
            }
        }

        function scheduleMidnightCheck() {
            const now = new Date();
            const midnight = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0, 0, 0
            );
            
            const timeUntilMidnight = midnight - now;
            
            setTimeout(() => {
                console.log('Midnight check - refreshing tasks...');
                renderTasks();
                scheduleMidnightCheck();
            }, timeUntilMidnight);
        }

        function stopDueDateChecker() {
            if (dueDateCheckInterval) {
                clearInterval(dueDateCheckInterval);
                dueDateCheckInterval = null;
            }
        }

        function updateClock() {
            const now = new Date();
            
            let hours = now.getHours();
            let minutes = now.getMinutes();
            let seconds = now.getSeconds();
            
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours || 12;
            
            hours = hours.toString().padStart(2, '0');
            minutes = minutes.toString().padStart(2, '0');
            seconds = seconds.toString().padStart(2, '0');
            
            const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
            
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            
            const dayName = days[now.getDay()];
            const day = now.getDate();
            const monthName = months[now.getMonth()];
            const year = now.getFullYear();
            
            const dateString = `${dayName}, ${day} ${monthName} ${year}`;
            
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
            
            const dateElement = document.getElementById('currentDate');
            if (dateElement) {
                dateElement.textContent = dateString;
            }
        }

        function stopClock() {
            if (clockInterval) {
                clearInterval(clockInterval);
                clockInterval = null;
            }
        }

        function getDueDateStatus(dueDate, isCompleted = false) {
            if (isCompleted) {
                return {
                    status: 'completed',
                    label: 'Completed',
                    class: 'due-status-future',
                    icon: '✓',
                    overdue: false
                };
            }
            
            const due = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            due.setHours(0, 0, 0, 0);
            
            const diffTime = due - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                const daysLate = Math.abs(diffDays);
                return {
                    status: 'overdue',
                    label: `${daysLate} day${daysLate > 1 ? 's' : ''} overdue`,
                    class: 'due-status-overdue',
                    icon: '⚠️',
                    overdue: true,
                    daysLate: daysLate
                };
            }
            
            if (diffDays === 0) {
                return {
                    status: 'today',
                    label: 'Due today',
                    class: 'due-status-today',
                    icon: '📅',
                    overdue: false
                };
            }
            
            if (diffDays <= 3) {
                return {
                    status: 'soon',
                    label: `${diffDays} day${diffDays > 1 ? 's' : ''} left`,
                    class: 'due-status-soon',
                    icon: '⏰',
                    overdue: false,
                    daysLeft: diffDays
                };
            }
            
            return {
                status: 'future',
                label: `${diffDays} days left`,
                class: 'due-status-future',
                icon: '📆',
                overdue: false,
                daysLeft: diffDays
            };
        }

        function formatDueDateDisplay(dateStr) {
            const date = new Date(dateStr);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const due = new Date(dateStr);
            due.setHours(0, 0, 0, 0);
            
            if (due.getTime() === today.getTime()) {
                return 'Today';
            }
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (due.getTime() === tomorrow.getTime()) {
                return 'Tomorrow';
            }
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (due.getTime() === yesterday.getTime()) {
                return 'Yesterday';
            }
            
            return formatDate(dateStr);
        }

        function openTaskModal(taskId = null) {
            const modal = document.getElementById('taskModal');
            const title = document.getElementById('modalTitle');
            const form = document.getElementById('taskForm');
            
            form.reset();
            editingTaskId = taskId;
            
            if (taskId) {
                title.textContent = 'Edit Task';
                const workspace = workspaces.find(w => w.id === currentWorkspaceId);
                const task = workspace.tasks.find(t => t.id === taskId);
                
                document.getElementById('taskName').value = task.name;
                document.getElementById('taskOwner').value = task.owner;
                document.getElementById('taskStatus').value = task.status;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskDueDate').value = task.dueDate;
                document.getElementById('taskNotes').value = task.notes;
            } else {
                title.textContent = 'Add New Task';
            }
            
            modal.classList.add('active');
        }

        function closeTaskModal() {
            document.getElementById('taskModal').classList.remove('active');
            editingTaskId = null;
        }

        document.getElementById('taskForm').onsubmit = function(e) {
            e.preventDefault();
            
            if (!currentWorkspaceId) {
                alert('Please select a workspace first');
                return;
            }
            
            const task = {
                id: editingTaskId || Date.now(),
                name: document.getElementById('taskName').value,
                owner: document.getElementById('taskOwner').value,
                status: document.getElementById('taskStatus').value,
                priority: document.getElementById('taskPriority').value,
                dueDate: document.getElementById('taskDueDate').value,
                notes: document.getElementById('taskNotes').value
            };
            
            const workspace = workspaces.find(w => w.id === currentWorkspaceId);
            
            if (editingTaskId) {
                const index = workspace.tasks.findIndex(t => t.id === editingTaskId);
                workspace.tasks[index] = task;
            } else {
                workspace.tasks.push(task);
            }
            
            saveToLocalStorage();
            closeTaskModal();
            renderTasks();
            updateOwnerFilter();
        };

        function deleteTask(taskId) {
            const workspace = workspaces.find(w => w.id === currentWorkspaceId);
            const task = workspace.tasks.find(t => t.id === taskId);
            
            if (!task) return;
            
            showConfirmModal({
                title: 'Delete Task?',
                message: 'Are you sure you want to delete this task?',
                itemName: task.name,
                warning: 'This action cannot be undone.',
                onConfirm: () => {
                    workspace.tasks = workspace.tasks.filter(t => t.id !== taskId);
                    saveToLocalStorage();
                    renderTasks();
                    
                    console.log(`Task "${task.name}" deleted successfully`);
                }
            });
        }

        function renderTasks() {
            if (!currentWorkspaceId) {
                document.getElementById('currentWorkspaceName').textContent = 'Select a workspace';
                document.getElementById('activeTasksBody').innerHTML = '<tr><td colspan="7" class="empty-state">Please select a workspace</td></tr>';
                document.getElementById('completedTasksBody').innerHTML = '<tr><td colspan="6" class="empty-state">Please select a workspace</td></tr>';
                return;
            }

            const workspace = workspaces.find(w => w.id === currentWorkspaceId);
            document.getElementById('currentWorkspaceName').textContent = workspace.name;

            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const statusFilter = document.getElementById('filterStatus').value;
            const ownerFilter = document.getElementById('filterOwner').value;

            let filteredTasks = workspace.tasks.filter(task => {
                const matchesSearch = task.name.toLowerCase().includes(searchTerm) || 
                                    task.owner.toLowerCase().includes(searchTerm) ||
                                    task.notes.toLowerCase().includes(searchTerm);
                const matchesStatus = !statusFilter || task.status === statusFilter;
                const matchesOwner = !ownerFilter || task.owner === ownerFilter;
                return matchesSearch && matchesStatus && matchesOwner;
            });

            const activeTasks = filteredTasks.filter(t => t.status !== 'Complete');
            const completedTasks = filteredTasks.filter(t => t.status === 'Complete');

            activeTasks.sort((a, b) => {
                const statusA = getDueDateStatus(a.dueDate, false);
                const statusB = getDueDateStatus(b.dueDate, false);
                
                const priorityOrder = {
                    'overdue': 1,
                    'today': 2,
                    'soon': 3,
                    'future': 4
                };
                
                const priorityA = priorityOrder[statusA.status] || 5;
                const priorityB = priorityOrder[statusB.status] || 5;
                
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }
                
                return new Date(a.dueDate) - new Date(b.dueDate);
            });

            const overdueCount = activeTasks.filter(task => {
                const status = getDueDateStatus(task.dueDate, false);
                return status.overdue;
            }).length;

            const activeCountEl = document.getElementById('activeCount');
            activeCountEl.textContent = activeTasks.length;
            
            if (overdueCount > 0) {
                activeCountEl.innerHTML = `${activeTasks.length} <span style="color: #c30; margin-left: 5px;">(${overdueCount} overdue)</span>`;
            }
            
            document.getElementById('completedCount').textContent = completedTasks.length;

            renderTaskList('activeTasksBody', activeTasks, true);
            renderTaskList('completedTasksBody', completedTasks, false);
        }

        function renderTaskList(tableId, tasks, showStatus) {
            const tbody = document.getElementById(tableId);
            tbody.innerHTML = '';

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${showStatus ? 7 : 6}" class="empty-state">No tasks found</td></tr>`;
                return;
            }

            tasks.forEach(task => {
                const tr = document.createElement('tr');
                
                const isCompleted = task.status === 'Complete';
                const dueStatus = getDueDateStatus(task.dueDate, isCompleted);
                
                if (dueStatus.overdue && !isCompleted) {
                    tr.className = 'task-row-overdue';
                }
                
                const dueDateDisplay = formatDueDateDisplay(task.dueDate);
                
                const dueDateHTML = `
                    <div class="due-date-cell">
                        <span class="due-date-text">${dueDateDisplay}</span>
                        <span class="due-status ${dueStatus.class}">
                            <span>${dueStatus.icon}</span>
                            <span>${dueStatus.label}</span>
                        </span>
                    </div>
                `;
                
                tr.innerHTML = `
                    <td class="task-name">${task.name}</td>
                    <td>${task.owner}</td>
                    ${showStatus ? `<td><span class="status-badge status-${task.status.toLowerCase().replace(' ', '')}">${task.status}</span></td>` : ''}
                    <td><span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                    <td>${dueDateHTML}</td>
                    <td>${task.notes || '-'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn edit-btn" onclick="openTaskModal(${task.id})">Edit</button>
                            <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">Delete</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }

        function filterTasks() {
            renderTasks();
        }

        function updateOwnerFilter() {
            const select = document.getElementById('filterOwner');
            const currentValue = select.value;
            const owners = new Set();

            workspaces.forEach(ws => {
                ws.tasks.forEach(task => {
                    if (task.owner) owners.add(task.owner);
                });
            });

            select.innerHTML = '<option value="">All Owners</option>';
            Array.from(owners).sort().forEach(owner => {
                const option = document.createElement('option');
                option.value = owner;
                option.textContent = owner;
                select.appendChild(option);
            });

            select.value = currentValue;
        }

        function formatDate(dateStr) {
            const date = new Date(dateStr);
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('id-ID', options);
        }

        document.getElementById('taskModal').onclick = function(e) {
            if (e.target === this) {
                closeTaskModal();
            }
        };

        document.getElementById('workspaceModal').onclick = function(e) {
            if (e.target === this) {
                closeWorkspaceModal();
            }
        };

        document.getElementById('confirmModal').onclick = function(e) {
            if (e.target === this) {
                closeConfirmModal();
            }
        };

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeTaskModal();
                closeWorkspaceModal();
                closeConfirmModal();
            }
        });

        window.addEventListener('beforeunload', function() {
            stopClock();
            stopDueDateChecker();
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }