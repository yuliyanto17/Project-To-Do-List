
        /* ============================================
           JAVASCRIPT - PENJELASAN DETAIL
           ============================================ */

        // VARIABEL GLOBAL
        // let = variabel yang bisa diubah nilainya
        // const = variabel yang tidak bisa diubah (constant)
        
        let workspaces = []; // Array untuk menyimpan semua workspace
        let currentWorkspaceId = null; // ID workspace yang sedang aktif
        let editingTaskId = null; // ID task yang sedang diedit
        let sidebarVisible = true; // Status sidebar (visible/hidden)
        let clockInterval = null; // Variable untuk menyimpan interval ID clock

        /* ============================================
           FUNGSI INITIALIZE
           ============================================ */
        
        // Fungsi yang dipanggil pertama kali saat halaman load
        function init() {
            loadFromLocalStorage(); // Load data dari localStorage
            renderWorkspaces(); // Tampilkan daftar workspace
            
            // Jika ada workspace, pilih yang pertama
            if (workspaces.length > 0) {
                selectWorkspace(workspaces[0].id);
            }
            
            updateOwnerFilter(); // Update dropdown filter owner
            checkMobile(); // Cek apakah di mobile
            startClock(); // Mulai realtime clock
        }

        /* ============================================
           REALTIME CLOCK FUNCTIONS
           ============================================ */
        
        /**
         * Fungsi untuk memulai realtime clock
         * Menggunakan setInterval untuk update setiap detik
         */
        function startClock() {
            // Update waktu pertama kali
            updateClock();
            
            // setInterval() = menjalankan fungsi secara berulang
            // Parameter 1: fungsi yang akan dijalankan
            // Parameter 2: interval dalam milliseconds (1000ms = 1 detik)
            // Return: interval ID yang bisa digunakan untuk stop interval
            clockInterval = setInterval(updateClock, 1000);
        }

        /**
         * Fungsi untuk update tampilan waktu dan tanggal
         * Dipanggil setiap detik oleh setInterval
         */
        function updateClock() {
            // Date object = object bawaan JavaScript untuk tanggal & waktu
            // new Date() = membuat instance dengan waktu sekarang
            const now = new Date();
            
            /* ============================================
               UPDATE WAKTU (TIME)
               ============================================ */
            
            // Extract komponen waktu dari Date object
            let hours = now.getHours();     // 0-23 (24 hour format)
            let minutes = now.getMinutes(); // 0-59
            let seconds = now.getSeconds(); // 0-59
            
            // Konversi ke 12-hour format dengan AM/PM
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;           // % = modulo operator (sisa bagi)
            hours = hours || 12;          // Jika 0, ganti jadi 12
            
            // Atau jika ingin 24-hour format, komen 3 baris di atas
            // dan uncomment baris berikut:
            // const ampm = '';
            
            // padStart() = menambahkan karakter di awal string
            // Kenapa? Agar selalu 2 digit: 9 menjadi 09
            // Format: string.padStart(targetLength, padString)
            hours = hours.toString().padStart(2, '0');
            minutes = minutes.toString().padStart(2, '0');
            seconds = seconds.toString().padStart(2, '0');
            
            // Template literal untuk format waktu
            // Format: HH:MM:SS AM/PM
            const timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
            
            /* ============================================
               UPDATE TANGGAL (DATE)
               ============================================ */
            
            // Array nama hari dalam bahasa Indonesia
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            
            // Array nama bulan dalam bahasa Indonesia
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            
            // Extract komponen tanggal
            const dayName = days[now.getDay()];        // Nama hari (0-6)
            const day = now.getDate();                 // Tanggal (1-31)
            const monthName = months[now.getMonth()];  // Nama bulan (0-11)
            const year = now.getFullYear();            // Tahun (2024)
            
            // Format tanggal: "Senin, 13 Januari 2025"
            const dateString = `${dayName}, ${day} ${monthName} ${year}`;
            
            /* ============================================
               UPDATE DOM ELEMENTS
               ============================================ */
            
            // Update waktu
            const timeElement = document.getElementById('currentTime');
            if (timeElement) {
                timeElement.textContent = timeString;
            }
            
            // Update tanggal
            const dateElement = document.getElementById('currentDate');
            if (dateElement) {
                dateElement.textContent = dateString;
            }
        }

        /**
         * Fungsi untuk stop clock (cleanup)
         * Penting untuk mencegah memory leak
         */
        function stopClock() {
            // clearInterval() = stop interval yang running
            // Menerima interval ID dari setInterval
            if (clockInterval) {
                clearInterval(clockInterval);
                clockInterval = null;
            }
        }

        /**
         * Alternative: Fungsi untuk format waktu dengan opsi berbeda
         * Uncomment jika ingin gunakan format ini
         */
        function updateClockAlternative() {
            const now = new Date();
            
            // Opsi 1: Format lengkap dengan hari dan tanggal
            const options = {
                weekday: 'short', // Sen, Sel, Rab, dst
                year: 'numeric',  // 2024
                month: 'short',   // Jan, Feb, Mar, dst
                day: 'numeric',   // 1, 2, 3, dst
                hour: '2-digit',  // 00-23
                minute: '2-digit',// 00-59
                second: '2-digit' // 00-59
            };
            
            const timeString = now.toLocaleTimeString('id-ID', options);
            
            // Opsi 2: Format singkat hanya waktu
            // const timeString = now.toLocaleTimeString('id-ID');
            
            // Opsi 3: Custom format dengan Intl.DateTimeFormat
            // const formatter = new Intl.DateTimeFormat('id-ID', {
            //     hour: '2-digit',
            //     minute: '2-digit',
            //     second: '2-digit',
            //     hour12: false // true untuk 12-hour, false untuk 24-hour
            // });
            // const timeString = formatter.format(now);
            
            document.getElementById('currentTime').textContent = timeString;
        }

        /* ============================================
           LOCAL STORAGE FUNCTIONS
           Kenapa Local Storage? Untuk menyimpan data
           di browser agar tidak hilang saat refresh
           ============================================ */
        
        // Menyimpan data ke localStorage
        function saveToLocalStorage() {
            // JSON.stringify = convert object/array ke string
            // Kenapa? Karena localStorage hanya bisa simpan string
            localStorage.setItem('todoWorkspaces', JSON.stringify(workspaces));
        }

        // Mengambil data dari localStorage
        function loadFromLocalStorage() {
            const stored = localStorage.getItem('todoWorkspaces');
            
            // Jika ada data tersimpan
            if (stored) {
                // JSON.parse = convert string kembali ke object/array
                workspaces = JSON.parse(stored);
            }
        }

        /* ============================================
           SIDEBAR TOGGLE FUNCTION
           ============================================ */
        
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            const toggleIcon = document.getElementById('toggleIcon');
            
            // Toggle class 'hidden' - tambah jika tidak ada, hapus jika ada
            sidebar.classList.toggle('hidden');
            sidebarVisible = !sidebarVisible; // Balik nilai boolean
            
            // Ubah icon panah
            toggleIcon.textContent = sidebarVisible ? '◀' : '▶';
            
            // Tampilkan overlay di mobile saat sidebar terbuka
            if (window.innerWidth <= 480) {
                overlay.classList.toggle('active');
            }
        }

        // Cek ukuran layar saat pertama load
        function checkMobile() {
            // window.innerWidth = lebar window browser
            if (window.innerWidth <= 480) {
                // Auto hide sidebar di mobile saat pertama load
                document.getElementById('sidebar').classList.add('hidden');
                sidebarVisible = false;
                document.getElementById('toggleIcon').textContent = '▶';
            }
        }

        // Event listener untuk window resize
        // Dipanggil setiap kali ukuran window berubah
        window.addEventListener('resize', function() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebarOverlay');
            
            if (window.innerWidth > 480) {
                // Hapus overlay di desktop
                overlay.classList.remove('active');
            } else if (!sidebar.classList.contains('hidden')) {
                // Tampilkan overlay jika sidebar terbuka di mobile
                overlay.classList.add('active');
            }
        });

        /* ============================================
           WORKSPACE FUNCTIONS
           ============================================ */
        
        function addWorkspace() {
            // prompt() = menampilkan dialog input untuk user
            const name = prompt('Enter workspace name:');
            
            // Validasi: pastikan name tidak kosong
            // trim() = menghapus spasi di awal dan akhir string
            if (name && name.trim()) {
                const workspace = {
                    id: Date.now(), // Gunakan timestamp sebagai unique ID
                    name: name.trim(),
                    tasks: [] // Array kosong untuk tasks
                };
                
                // push() = menambahkan element ke akhir array
                workspaces.push(workspace);
                
                saveToLocalStorage();
                renderWorkspaces();
                selectWorkspace(workspace.id);
            }
        }

        function deleteWorkspace(id, event) {
            // stopPropagation() = mencegah event bubble ke parent
            // Kenapa? Agar saat klik delete, tidak trigger onClick parent
            event.stopPropagation();
            
            // confirm() = menampilkan dialog konfirmasi
            if (confirm('Are you sure you want to delete this workspace?')) {
                // filter() = membuat array baru dengan filter tertentu
                // Hasilnya: array baru tanpa workspace dengan id yang dihapus
                workspaces = workspaces.filter(w => w.id !== id);
                
                saveToLocalStorage();
                renderWorkspaces();
                
                // Jika workspace yang dihapus sedang aktif
                if (currentWorkspaceId === id) {
                    currentWorkspaceId = null;
                    
                    // Pilih workspace pertama jika masih ada
                    if (workspaces.length > 0) {
                        selectWorkspace(workspaces[0].id);
                    } else {
                        renderTasks();
                    }
                }
            }
        }

        function selectWorkspace(id) {
            currentWorkspaceId = id;
            renderWorkspaces();
            renderTasks();
            
            // Reset filter dan search
            document.getElementById('searchInput').value = '';
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterOwner').value = '';
            
            // Auto close sidebar di mobile setelah pilih workspace
            if (window.innerWidth <= 480 && sidebarVisible) {
                toggleSidebar();
            }
        }

        function renderWorkspaces() {
            const list = document.getElementById('workspaceList');
            list.innerHTML = ''; // Kosongkan list
            
            // forEach() = loop untuk setiap element dalam array
            workspaces.forEach(ws => {
                const li = document.createElement('li'); // Buat element <li>
                li.className = 'workspace-item' + (ws.id === currentWorkspaceId ? ' active' : '');
                
                // onclick = event handler saat element diklik
                li.onclick = () => selectWorkspace(ws.id);
                
                // innerHTML = set konten HTML di dalam element
                // Template literal (backtick) untuk multi-line string
                li.innerHTML = `
                    <span>${ws.name}</span>
                    <span class="delete-ws" onclick="deleteWorkspace(${ws.id}, event)">×</span>
                `;
                
                // appendChild() = menambahkan child element
                list.appendChild(li);
            });
        }

        /* ============================================
           TASK FUNCTIONS
           ============================================ */
        
        function openTaskModal(taskId = null) {
            const modal = document.getElementById('taskModal');
            const title = document.getElementById('modalTitle');
            const form = document.getElementById('taskForm');
            
            form.reset(); // Reset form (kosongkan semua input)
            editingTaskId = taskId;
            
            // Jika ada taskId, berarti mode edit
            if (taskId) {
                title.textContent = 'Edit Task';
                
                // find() = mencari element pertama yang match kondisi
                const workspace = workspaces.find(w => w.id === currentWorkspaceId);
                const task = workspace.tasks.find(t => t.id === taskId);
                
                // Isi form dengan data task yang diedit
                document.getElementById('taskName').value = task.name;
                document.getElementById('taskOwner').value = task.owner;
                document.getElementById('taskStatus').value = task.status;
                document.getElementById('taskPriority').value = task.priority;
                document.getElementById('taskDueDate').value = task.dueDate;
                document.getElementById('taskNotes').value = task.notes;
            } else {
                title.textContent = 'Add New Task';
            }
            
            // classList.add() = menambahkan class ke element
            modal.classList.add('active');
        }

        function closeTaskModal() {
            // classList.remove() = menghapus class dari element
            document.getElementById('taskModal').classList.remove('active');
            editingTaskId = null;
        }

        // Event handler untuk form submit
        // onsubmit dipanggil saat form di-submit
        document.getElementById('taskForm').onsubmit = function(e) {
            // preventDefault() = mencegah default behavior
            // Kenapa? Agar form tidak reload page
            e.preventDefault();
            
            if (!currentWorkspaceId) {
                alert('Please select a workspace first');
                return; // Keluar dari fungsi
            }
            
            // Buat object task dengan data dari form
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
                // Mode edit: update task yang ada
                // findIndex() = mencari index element yang match
                const index = workspace.tasks.findIndex(t => t.id === editingTaskId);
                workspace.tasks[index] = task; // Replace dengan data baru
            } else {
                // Mode add: tambah task baru
                workspace.tasks.push(task);
            }
            
            saveToLocalStorage();
            closeTaskModal();
            renderTasks();
            updateOwnerFilter();
        };

        function deleteTask(taskId) {
            if (confirm('Are you sure you want to delete this task?')) {
                const workspace = workspaces.find(w => w.id === currentWorkspaceId);
                workspace.tasks = workspace.tasks.filter(t => t.id !== taskId);
                
                saveToLocalStorage();
                renderTasks();
            }
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

            // Get filter values
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const statusFilter = document.getElementById('filterStatus').value;
            const ownerFilter = document.getElementById('filterOwner').value;

            // Filter tasks
            // Kombinasi multiple kondisi dengan AND (&&)
            let filteredTasks = workspace.tasks.filter(task => {
                // includes() = cek apakah string mengandung substring
                const matchesSearch = task.name.toLowerCase().includes(searchTerm) || 
                                    task.owner.toLowerCase().includes(searchTerm) ||
                                    task.notes.toLowerCase().includes(searchTerm);
                
                // Operator || (OR) = true jika salah satu true
                // ! (NOT) = membalik boolean
                const matchesStatus = !statusFilter || task.status === statusFilter;
                const matchesOwner = !ownerFilter || task.owner === ownerFilter;
                
                return matchesSearch && matchesStatus && matchesOwner;
            });

            // Pisahkan active dan completed tasks
            const activeTasks = filteredTasks.filter(t => t.status !== 'Complete');
            const completedTasks = filteredTasks.filter(t => t.status === 'Complete');

            // Update counter badge
            document.getElementById('activeCount').textContent = activeTasks.length;
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

            // Loop setiap task dan buat row table
            tasks.forEach(task => {
                const tr = document.createElement('tr');
                
                // Conditional rendering dengan ternary operator
                // condition ? valueIfTrue : valueIfFalse
                tr.innerHTML = `
                    <td class="task-name">${task.name}</td>
                    <td>${task.owner}</td>
                    ${showStatus ? `<td><span class="status-badge status-${task.status.toLowerCase().replace(' ', '')}">${task.status}</span></td>` : ''}
                    <td><span class="priority-badge priority-${task.priority.toLowerCase()}">${task.priority}</span></td>
                    <td>${formatDate(task.dueDate)}</td>
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
            renderTasks(); // Re-render dengan filter baru
        }

        function updateOwnerFilter() {
            const select = document.getElementById('filterOwner');
            const currentValue = select.value;
            
            // Set() = collection yang hanya menyimpan unique values
            const owners = new Set();

            // Kumpulkan semua owner dari semua workspace
            workspaces.forEach(ws => {
                ws.tasks.forEach(task => {
                    if (task.owner) owners.add(task.owner);
                });
            });

            select.innerHTML = '<option value="">All Owners</option>';
            
            // Array.from() = convert Set ke Array
            // sort() = mengurutkan array
            Array.from(owners).sort().forEach(owner => {
                const option = document.createElement('option');
                option.value = owner;
                option.textContent = owner;
                select.appendChild(option);
            });

            select.value = currentValue; // Restore selected value
        }

        // Fungsi helper untuk format tanggal
        function formatDate(dateStr) {
            const date = new Date(dateStr);
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            // toLocaleDateString() = format tanggal sesuai locale
            return date.toLocaleDateString('id-ID', options);
        }

        /* ============================================
           EVENT LISTENERS
           ============================================ */
        
        // Close modal saat klik di luar modal content
        document.getElementById('taskModal').onclick = function(e) {
            // e.target = element yang diklik
            // this = element yang memiliki event listener (modal)
            if (e.target === this) {
                closeTaskModal();
            }
        };

        // Cleanup saat page akan di-unload (optional, good practice)
        // Mencegah memory leak dari interval yang masih running
        window.addEventListener('beforeunload', function() {
            stopClock(); // Stop clock interval
        });

        // Jalankan init() saat DOM sudah siap
        // Kenapa tidak langsung? Agar semua element HTML sudah ter-load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }