// ========== Data Management ==========
const storage = {
    getTasks: () => JSON.parse(localStorage.getItem('tasks')) || [],
    setTasks: (tasks) => localStorage.setItem('tasks', JSON.stringify(tasks)),
    
    getSchedules: () => JSON.parse(localStorage.getItem('schedules')) || [],
    setSchedules: (schedules) => localStorage.setItem('schedules', JSON.stringify(schedules)),
    
    getNotes: () => JSON.parse(localStorage.getItem('notes')) || [],
    setNotes: (notes) => localStorage.setItem('notes', JSON.stringify(notes)),
    
    getFiles: () => JSON.parse(localStorage.getItem('files')) || [],
    setFiles: (files) => localStorage.setItem('files', JSON.stringify(files)),
    
    getExams: () => JSON.parse(localStorage.getItem('exams')) || [],
    setExams: (exams) => localStorage.setItem('exams', JSON.stringify(exams)),
    
    getPoints: () => parseInt(localStorage.getItem('points')) || 0,
    setPoints: (points) => localStorage.setItem('points', points),
    
    getDarkMode: () => localStorage.getItem('darkMode') === 'true',
    setDarkMode: (value) => localStorage.setItem('darkMode', value)
};

// ========== Initialization ==========
window.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initEventListeners();
    renderAllSections();
    setReminderInterval();
    setDailyQuote();
    initFileUpload();
});

// ========== Dark Mode ==========
function initDarkMode() {
    if (storage.getDarkMode()) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeBtn').textContent = '☀️';
    }
}

document.getElementById('darkModeBtn').addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    storage.setDarkMode(isDark);
    document.getElementById('darkModeBtn').textContent = isDark ? '☀️' : '🌙';
});

// ========== Navigation ==========
function initEventListeners() {
    // Navigation Links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.dataset.section;
            switchSection(section);
            const nav = document.getElementById('nav');
            const hamburger = document.getElementById('hamburger');
            nav.classList.remove('active');
            hamburger.classList.remove('active');
            document.removeEventListener('click', closeMenuOnOutside);
        });
    });

    // Hamburger Menu
    document.getElementById('hamburger').addEventListener('click', (e) => {
        e.stopPropagation();
        const nav = document.getElementById('nav');
        const hamburger = document.getElementById('hamburger');
        const isActive = hamburger.classList.toggle('active');
        nav.classList.toggle('active');
        
        // Close menu when clicking outside
        if (isActive) {
            document.addEventListener('click', closeMenuOnOutside);
        } else {
            document.removeEventListener('click', closeMenuOnOutside);
        }
    });

    function closeMenuOnOutside(e) {
        const nav = document.getElementById('nav');
        const hamburger = document.getElementById('hamburger');
        if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
            nav.classList.remove('active');
            hamburger.classList.remove('active');
            document.removeEventListener('click', closeMenuOnOutside);
        }
    }

    // Share Button
    document.getElementById('shareBtn').addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'Study Hub',
                text: 'منصة إدارة الدراسة والمهام',
                url: window.location.href
            });
        } else {
            const url = window.location.href;
            navigator.clipboard.writeText(url);
            showToast('✅ تم نسخ الرابط');
        }
    });

    // Task Inputs
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Note Inputs
    document.getElementById('noteTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('noteContent').focus();
    });
}

function switchSection(sectionName) {
    // Remove active class from all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('section-active'));
    
    // Add active class to selected section
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('section-active');
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

// ========== Tasks Management ==========
function addTask() {
    const input = document.getElementById('taskInput');
    const dateInput = document.getElementById('taskDate');
    const timeInput = document.getElementById('taskTime');
    const priorityInput = document.getElementById('taskPriority');
    
    if (!input.value.trim()) {
        showToast('⚠️ أضف عنوان المهمة');
        return;
    }

    const task = {
        id: Date.now(),
        title: input.value,
        date: dateInput.value || new Date().toISOString().split('T')[0],
        time: timeInput.value || '00:00',
        priority: priorityInput.value,
        completed: false,
        createdAt: new Date().toISOString()
    };

    const tasks = storage.getTasks();
    tasks.push(task);
    storage.setTasks(tasks);

    input.value = '';
    dateInput.value = '';
    timeInput.value = '';
    priorityInput.value = 'low';
    
    renderTasks();
    updateStats();
    showToast('✅ تمت إضافة المهمة');
}

function deleteTask(id) {
    const tasks = storage.getTasks();
    const newTasks = tasks.filter(t => t.id !== id);
    storage.setTasks(newTasks);
    renderTasks();
    updateStats();
    showToast('🗑️ تم حذف المهمة');
}

function completeTask(id) {
    const tasks = storage.getTasks();
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            const points = storage.getPoints();
            const pointValue = task.priority === 'high' ? 10 : task.priority === 'medium' ? 5 : 3;
            storage.setPoints(points + pointValue);
            showToast(`🎉 +${pointValue} نقاط!`);
        }
    }
    storage.setTasks(tasks);
    renderTasks();
    updateStats();
}

function filterTasks(filter) {
    const tasksList = document.getElementById('tasksList');
    const tasks = storage.getTasks();
    let filtered = tasks;

    if (filter === 'pending') {
        filtered = tasks.filter(t => !t.completed);
    } else if (filter === 'completed') {
        filtered = tasks.filter(t => t.completed);
    } else if (filter === 'high') {
        filtered = tasks.filter(t => t.priority === 'high');
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    renderTasksList(filtered);

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function renderTasks(tasks = storage.getTasks()) {
    renderTasksList(tasks);
}

function renderTasksList(tasks) {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';

    if (tasks.length === 0) {
        tasksList.innerHTML = '<p style="text-align: center; color: var(--text-light);">لا توجد مهام</p>';
        return;
    }

    tasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item ${task.priority} ${task.completed ? 'completed' : ''}`;
        
        const priorityLabel = {
            high: '🔴 عالية',
            medium: '🟡 متوسطة',
            low: '🟢 منخفضة'
        }[task.priority];

        taskEl.innerHTML = `
            <div class="task-info">
                <div class="task-title">${task.title}</div>
                <div class="task-details">
                    <span>📅 ${task.date}</span>
                    <span>⏰ ${task.time}</span>
                    <span>${priorityLabel}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn task-btn-check" onclick="completeTask(${task.id})">
                    ${task.completed ? '✓ مكتملة' : '✓ إكمال'}
                </button>
                <button class="task-btn task-btn-delete" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        `;

        tasksList.appendChild(taskEl);
    });
}

// ========== Schedule Management ==========
function addSchedule() {
    const subject = document.getElementById('scheduleSubject').value.trim();
    const day = document.getElementById('scheduleDay').value;
    const time = document.getElementById('scheduleTime').value;

    if (!subject || !time) {
        showToast('⚠️ أملأ جميع الحقول');
        return;
    }

    const schedule = {
        id: Date.now(),
        subject,
        day,
        time
    };

    const schedules = storage.getSchedules();
    schedules.push(schedule);
    storage.setSchedules(schedules);

    document.getElementById('scheduleSubject').value = '';
    document.getElementById('scheduleDay').value = 'الأحد';
    document.getElementById('scheduleTime').value = '';

    renderSchedules();
    showToast('✅ تمت إضافة الجدول');
}

function deleteSchedule(id) {
    const schedules = storage.getSchedules();
    const newSchedules = schedules.filter(s => s.id !== id);
    storage.setSchedules(newSchedules);
    renderSchedules();
    showToast('🗑️ تم حذف الجدول');
}

function renderSchedules() {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const schedules = storage.getSchedules();
    const grid = document.getElementById('scheduleGrid');
    grid.innerHTML = '';

    days.forEach(day => {
        const daySchedules = schedules.filter(s => s.day === day);
        
        const dayEl = document.createElement('div');
        dayEl.className = 'schedule-day';
        dayEl.innerHTML = `
            <div class="schedule-day-header">${day}</div>
            <div class="schedule-items">
                ${daySchedules.length === 0 
                    ? '<p style="text-align: center; color: var(--text-light);">لا توجد فعاليات</p>'
                    : daySchedules.map(s => `
                        <div class="schedule-item">
                            <div class="schedule-item-time">${s.time}</div>
                            <div class="schedule-item-subject">${s.subject}</div>
                            <button style="margin-top: 0.5rem; padding: 0.3rem 0.6rem; background: var(--danger-color); color: white; border: none; border-radius: 3px; cursor: pointer;" 
                                onclick="deleteSchedule(${s.id})">حذف</button>
                        </div>
                    `).join('')
                }
            </div>
        `;
        
        grid.appendChild(dayEl);
    });
}

// ========== Notes Management ==========
function addNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const color = document.getElementById('noteColor').value;

    if (!title || !content) {
        showToast('⚠️ أملأ عنوان والمحتوى');
        return;
    }

    const note = {
        id: Date.now(),
        title,
        content,
        color,
        pinned: false,
        createdAt: new Date().toISOString()
    };

    const notes = storage.getNotes();
    notes.push(note);
    storage.setNotes(notes);

    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteColor').value = 'yellow';

    renderNotes();
    showToast('✅ تم حفظ الملاحظة');
}

function deleteNote(id) {
    const notes = storage.getNotes();
    const newNotes = notes.filter(n => n.id !== id);
    storage.setNotes(newNotes);
    renderNotes();
    showToast('🗑️ تم حذف الملاحظة');
}

function pinNote(id) {
    const notes = storage.getNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
        note.pinned = !note.pinned;
    }
    storage.setNotes(notes);
    renderNotes();
}

function renderNotes() {
    const notes = storage.getNotes();
    const grid = document.getElementById('notesGrid');
    grid.innerHTML = '';

    if (notes.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-light);">لا توجد ملاحظات</p>';
        return;
    }

    // Sort pinned first
    const sorted = notes.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    sorted.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = `note-card ${note.color}`;
        noteEl.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-content">${note.content}</div>
            <div class="note-actions">
                <button class="note-btn note-btn-pin" onclick="pinNote(${note.id})">
                    ${note.pinned ? '📍' : '📌'}
                </button>
                <button class="note-btn note-btn-delete" onclick="deleteNote(${note.id})">🗑️</button>
            </div>
        `;
        grid.appendChild(noteEl);
    });
}

// ========== Files Management ==========
function initFileUpload() {
    const uploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'var(--light-bg)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = 'transparent';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'transparent';
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

function handleFiles(fileList) {
    const files = storage.getFiles();

    Array.from(fileList).forEach(file => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const fileObj = {
                id: Date.now(),
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type,
                data: e.target.result,
                uploadDate: new Date().toISOString()
            };

            files.push(fileObj);
            storage.setFiles(files);
            renderFiles();
            showToast('✅ تم رفع الملف');
        };

        reader.readAsDataURL(file);
    });
}

function deleteFile(id) {
    const files = storage.getFiles();
    const newFiles = files.filter(f => f.id !== id);
    storage.setFiles(newFiles);
    renderFiles();
    showToast('🗑️ تم حذف الملف');
}

function downloadFile(id) {
    const files = storage.getFiles();
    const file = files.find(f => f.id === id);
    
    if (file) {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        link.click();
        showToast('⬇️ تم تحميل الملف');
    }
}

function renderFiles() {
    const files = storage.getFiles();
    const filesList = document.getElementById('filesList');
    filesList.innerHTML = '';

    if (files.length === 0) {
        filesList.innerHTML = '<p style="text-align: center; color: var(--text-light);">لا توجد ملفات</p>';
        return;
    }

    files.forEach(file => {
        const fileEl = document.createElement('div');
        fileEl.className = 'file-item';
        
        const icon = getFileIcon(file.type);

        fileEl.innerHTML = `
            <div class="file-icon">${icon}</div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${file.size}</div>
            <div class="file-actions">
                <button class="file-btn file-btn-download" onclick="downloadFile(${file.id})">⬇️ تحميل</button>
                <button class="file-btn file-btn-delete" onclick="deleteFile(${file.id})">🗑️ حذف</button>
            </div>
        `;

        filesList.appendChild(fileEl);
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(type) {
    if (type.includes('image')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('sheet')) return '📊';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    return '📦';
}

// ========== Timer Management ==========
let timerInterval = null;
let timerSeconds = 1500; // 25 minutes
let isWorkTime = true;
let isRunning = false;

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    timerInterval = setInterval(() => {
        timerSeconds--;

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            isRunning = false;
            showReminder(isWorkTime ? 'انتهى وقت العمل! خذ راحة' : 'انتهت فترة الراحة! عودة للعمل');
            toggleTimerMode();
            updateTimerDisplay();
            return;
        }

        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        isRunning = false;
    }
}

function resetTimer() {
    pauseTimer();
    isWorkTime = true;
    timerSeconds = parseInt(document.getElementById('workTime').value) * 60;
    updateTimerDisplay();
}

function toggleTimerMode() {
    isWorkTime = !isWorkTime;
    const newSeconds = (isWorkTime ? 
        parseInt(document.getElementById('workTime').value) : 
        parseInt(document.getElementById('breakTime').value)) * 60;
    timerSeconds = newSeconds;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    document.getElementById('timerDisplay').textContent = display;
    document.getElementById('timerType').textContent = isWorkTime ? '⏱️ وقت العمل' : '☕ فترة الراحة';
}

document.getElementById('workTime').addEventListener('change', () => {
    if (!isRunning && isWorkTime) resetTimer();
});

document.getElementById('breakTime').addEventListener('change', () => {
    if (!isRunning && !isWorkTime) toggleTimerMode();
});

// ========== Reminders ==========
const reminders = [
    'اللهم صل وسلم على نبينا محمد ❤️',
    'سبحان الله 💫',
    'الحمد لله 🙏',
    'لا إله إلا الله 🕌',
    'الله أكبر ⭐'
];

const quotes = [
    '"خيركم من تعلم العلم وعلمه" - الحديث الشريف',
    '"إن الله لا يضيع أجر من أحسن عملاً" - القرآن الكريم',
    '"اطلبوا العلم من المهد إلى اللحد"',
    '"من تعلم لغة قوم أمن مكرهم"',
    '"المعرفة قوة" - فرانسيس بيكون'
];

function showReminder(text = reminders[Math.floor(Math.random() * reminders.length)]) {
    const modal = document.getElementById('reminderModal');
    document.getElementById('reminderText').textContent = text;
    modal.style.display = 'flex';
}

function closeReminder() {
    document.getElementById('reminderModal').style.display = 'none';
}

function playSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function setReminderInterval() {
    // Show reminder every 15 minutes (900000 ms)
    setInterval(() => {
        showReminder();
        playSound();
    }, 15 * 60 * 1000);
}

document.getElementById('reminderModal').addEventListener('click', (e) => {
    if (e.target.id === 'reminderModal') {
        closeReminder();
    }
});

// ========== Statistics ==========
function updateStats() {
    const tasks = storage.getTasks();
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('progressPercent').textContent = percent + '%';
    document.getElementById('userPoints').textContent = storage.getPoints();
    
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = percent + '%';
}

// ========== Daily Quote ==========
function setDailyQuote() {
    const today = new Date().toDateString();
    const lastQuoteDate = localStorage.getItem('lastQuoteDate');
    
    let quoteIndex = parseInt(localStorage.getItem('quoteIndex')) || 0;
    
    if (lastQuoteDate !== today) {
        quoteIndex = (quoteIndex + 1) % quotes.length;
        localStorage.setItem('lastQuoteDate', today);
        localStorage.setItem('quoteIndex', quoteIndex);
    }
    
    document.getElementById('dailyQuote').textContent = quotes[quoteIndex];
}

// ========== Toast Notifications ==========
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ========== Exams Management ==========
function addExam() {
    const subject = document.getElementById('examSubject').value.trim();
    const date = document.getElementById('examDate').value;
    const time = document.getElementById('examTime').value;
    const notes = document.getElementById('examNotes').value.trim();

    if (!subject || !date || !time) {
        showToast('⚠️ أملأ جميع الحقول المطلوبة');
        return;
    }

    const exam = {
        id: Date.now(),
        subject,
        date,
        time,
        notes,
        createdAt: new Date().toISOString()
    };

    const exams = storage.getExams();
    exams.push(exam);
    storage.setExams(exams);

    document.getElementById('examSubject').value = '';
    document.getElementById('examDate').value = '';
    document.getElementById('examTime').value = '';
    document.getElementById('examNotes').value = '';

    renderExams();
    showToast('✅ تمت إضافة الاختبار');
}

function deleteExam(id) {
    if (confirm('هل تريد حذف هذا الاختبار؟')) {
        const exams = storage.getExams();
        const newExams = exams.filter(e => e.id !== id);
        storage.setExams(newExams);
        renderExams();
        showToast('🗑️ تم حذف الاختبار');
    }
}

function renderExams() {
    const exams = storage.getExams();
    const examsList = document.getElementById('examsList');
    examsList.innerHTML = '';

    if (exams.length === 0) {
        examsList.innerHTML = '<p style="text-align: center; color: var(--text-light);">لا توجد اختبارات محددة</p>';
        return;
    }

    // Sort by date
    const sorted = exams.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });

    sorted.forEach(exam => {
        const examEl = document.createElement('div');
        examEl.className = 'exam-card';

        const examDate = new Date(`${exam.date}T${exam.time}`);
        const now = new Date();
        const daysLeft = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
        const status = daysLeft < 0 ? 'انتهى' : daysLeft === 0 ? 'اليوم!' : `بعد ${daysLeft} يوم`;

        examEl.innerHTML = `
            <div class="exam-countdown" style="color: ${daysLeft <= 3 ? '#ef4444' : '#f59e0b'}; margin-bottom: 0.5rem; font-weight: 600;">
                ⏳ ${status}
            </div>
            <div class="exam-subject">📚 ${exam.subject}</div>
            <div class="exam-details">
                <div class="exam-detail-item">📅 ${exam.date}</div>
                <div class="exam-detail-item">⏰ ${exam.time}</div>
            </div>
            ${exam.notes ? `<div class="exam-notes">${exam.notes}</div>` : ''}
            <div class="exam-actions">
                <button class="exam-btn exam-btn-delete" onclick="deleteExam(${exam.id})">🗑️ حذف</button>
            </div>
        `;

        examsList.appendChild(examEl);
    });
}

// ========== Contact Form (EmailJS) ==========
(function(){
    emailjs.init("Oxblyy4zqUxm6KvlA"); // حط المفتاح بتاعك هنا
})();

document.getElementById("contact-form")
.addEventListener("submit", function(e) {
    e.preventDefault();

    emailjs.sendForm(
        "service_4yzd4ns",
        "template_l473x4q",
        this
    )
    .then(() => {
        showToast("✅ تم إرسال الرسالة بنجاح");
        this.reset();
    })
    .catch((error) => {
        console.log(error);
        showToast("❌ حدث خطأ أثناء الإرسال");
    });
});

// ========== Initial Render ==========
function renderAllSections() {
    renderTasks();
    renderSchedules();
    renderNotes();
    renderFiles();
    renderExams();
    updateStats();
    resetTimer();
}
