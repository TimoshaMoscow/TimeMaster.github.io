class ScheduleApp {
    constructor() {
        this.currentUser = null;
        this.currentDate = new Date();
        this.tasks = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadTasks();
        this.updateSchedule();
    }

    // Аутентификация
    checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    setupEventListeners() {
        // Переключение между вкладками
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Формы аутентификации
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.register();
        });

        // Выход
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Добавление задачи
        document.getElementById('add-task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Навигация по датам
        document.getElementById('prev-day').addEventListener('click', () => {
            this.changeDate(-1);
        });

        document.getElementById('next-day').addEventListener('click', () => {
            this.changeDate(1);
        });
    }

    switchTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    register() {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        // Проверяем, нет ли уже пользователя с таким email
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(user => user.email === email)) {
            alert('Пользователь с таким email уже существует');
            return;
        }

        // Создаем нового пользователя
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password // В реальном приложении пароль нужно хэшировать!
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        alert('Регистрация успешна! Теперь войдите в систему.');
        this.switchTab('login');
    }

    login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showApp();
        } else {
            alert('Неверный email или пароль');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showAuth();
    }

    showAuth() {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-section').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('app-section').classList.remove('hidden');
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.updateSchedule();
    }

    // Работа с задачами
    addTask() {
        const title = document.getElementById('task-title').value;
        const description = document.getElementById('task-description').value;
        const datetime = document.getElementById('task-datetime').value;
        const duration = parseInt(document.getElementById('task-duration').value);
        const priority = document.getElementById('task-priority').value;

        const task = {
            id: Date.now().toString(),
            userId: this.currentUser.id,
            title,
            description,
            datetime: new Date(datetime),
            duration,
            priority,
            completed: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.updateSchedule();
        this.renderTasks();

        // Очищаем форму
        document.getElementById('add-task-form').reset();
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.updateSchedule();
        this.renderTasks();
    }

    saveTasks() {
        const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const otherUsersTasks = allTasks.filter(task => task.userId !== this.currentUser.id);
        const updatedTasks = [...otherUsersTasks, ...this.tasks];
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }

    loadTasks() {
        const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        this.tasks = allTasks.filter(task => 
            task.userId === this.currentUser.id && 
            new Date(task.datetime).toDateString() === this.currentDate.toDateString()
        );
    }

    // Расписание
    changeDate(days) {
        this.currentDate.setDate(this.currentDate.getDate() + days);
        this.updateSchedule();
        this.loadTasks();
        this.renderTasks();
    }

    updateSchedule() {
        const dateElement = document.getElementById('current-date');
        dateElement.textContent = this.currentDate.toLocaleDateString('ru-RU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        this.renderSchedule();
    }

    renderSchedule() {
        const container = document.getElementById('schedule-container');
        container.innerHTML = '';

        // Фильтруем задачи на выбранную дату
        const dayTasks = this.tasks.filter(task => {
            const taskDate = new Date(task.datetime);
            return taskDate.toDateString() === this.currentDate.toDateString();
        });

        // Сортируем задачи по времени
        dayTasks.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        if (dayTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>На этот день нет задач</h3>
                    <p>Добавьте задачи, чтобы увидеть их здесь</p>
                </div>
            `;
            return;
        }

        dayTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'time-slot';

        const startTime = new Date(task.datetime);
        const endTime = new Date(startTime.getTime() + task.duration * 60000);

        const priorityClass = `priority-${task.priority}`;
        const priorityText = {
            high: 'Высокий',
            medium: 'Средний',
            low: 'Низкий'
        }[task.priority];

        div.innerHTML = `
            <div class="time-slot-header">
                <div class="time-slot-title">${task.title}</div>
                <div class="time-slot-time">
                    ${startTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})} - 
                    ${endTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                </div>
            </div>
            <div class="time-slot-description">${task.description}</div>
            <div class="time-slot-priority ${priorityClass}">${priorityText} приоритет</div>
        `;

        return div;
    }

    renderTasks() {
        const container = document.getElementById('tasks-list');
        container.innerHTML = '';

        // Сортируем задачи по дате
        const sortedTasks = [...this.tasks].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        sortedTasks.forEach(task => {
            const taskElement = this.createTaskCard(task);
            container.appendChild(taskElement);
        });
    }

    createTaskCard(task) {
        const div = document.createElement('div');
        div.className = 'task-card';

        const taskDate = new Date(task.datetime);
        const priorityClass = `priority-${task.priority}`;
        const priorityText = {
            high: 'Высокий',
            medium: 'Средний',
            low: 'Низкий'
        }[task.priority];

        div.innerHTML = `
            <div class="task-header">
                <div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-time">
                        ${taskDate.toLocaleDateString('ru-RU')} • 
                        ${taskDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
                <span class="time-slot-priority ${priorityClass}">${priorityText}</span>
            </div>
            <div class="task-description">${task.description}</div>
            <div class="task-actions">
                <button class="delete-btn" onclick="app.deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `;

        return div;
    }
}

// Инициализация приложения
const app = new ScheduleApp();

// Утилиты для работы с датами
function formatDate(date) {
    return date.toLocaleDateString('ru-RU');
}

function formatTime(date) {
    return date.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
}