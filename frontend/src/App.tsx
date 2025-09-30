import React, { useState, useEffect, FormEvent } from 'react';

const API_BASE_URL = 'http://localhost:8099';

interface User {
    id: number;
    username: string;
    email: string;
    password?: string;
}

interface AuthResponse {
    user: User;
    token: string;
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'OVERDUE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    userId: number;
    deadline: string | null;
    createdAt: string;
    updatedAt: string;
}

interface TaskFormData {
    title: string;
    description: string;
    status: Task['status'];
    priority: Task['priority'];
    deadline: string;
    userId: number;
}

interface EditTaskFormData {
    id: number;
    title: string;
    description: string;
    status: Task['status'];
    priority: Task['priority'];
    deadline: string;
}

interface SearchCriteria {
    userId: number;
    keyword?: string;
    status?: Task['status'];
    priority?: Task['priority'];
    deadlineFrom?: string;
    deadlineTo?: string;
    page?: number;
    size?: number;
}

// CSS-in-JS стили
const styles = {
    // Layout
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    authContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
    },
    mainContainer: {
        minHeight: '100vh',
        background: '#f8fafc',
    },
    content: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
    },

    // Cards
    card: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
    },
    authCard: {
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
    },
    taskCard: {
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        border: '1px solid #e2e8f0',
        padding: '20px',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
    },

    // Typography
    heading: {
        fontSize: '2.5rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        marginBottom: '8px',
    },
    subheading: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: '#374151',
        marginBottom: '4px',
    },
    body: {
        color: '#6b7280',
        lineHeight: '1.6',
    },

    // Buttons
    button: {
        base: {
            padding: '12px 24px',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
        },
        primary: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            ':hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(102, 126, 234, 0.4)',
            },
        },
        secondary: {
            background: '#f1f5f9',
            color: '#475569',
            border: '1px solid #e2e8f0',
            ':hover': {
                background: '#e2e8f0',
            },
        },
        success: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            ':hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
            },
        },
        danger: {
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            ':hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4)',
            },
        },
        warning: {
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            ':hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.4)',
            },
        },
        ghost: {
            background: 'transparent',
            color: '#667eea',
            border: '1px solid #667eea',
            ':hover': {
                background: '#667eea',
                color: 'white',
            },
        },
    },

    // Inputs
    input: {
        base: {
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            transition: 'all 0.2s ease-in-out',
            ':focus': {
                outline: 'none',
                borderColor: '#667eea',
                boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
            },
        },
    },

    // Badges
    badge: {
        base: {
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        status: {
            TODO: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
            IN_PROGRESS: { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
            DONE: { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
            CANCELLED: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
            OVERDUE: { background: '#ffedd5', color: '#9a3412', border: '1px solid #fdba74' },
        },
        priority: {
            LOW: { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
            MEDIUM: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
            HIGH: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
            URGENT: { background: '#fecaca', color: '#7f1d1d', border: '1px solid #f87171' },
        },
    },

    // Grid & Flex
    grid: {
        container: {
            display: 'grid',
            gap: '16px',
        },
        cols1: { gridTemplateColumns: '1fr' },
        cols2: { gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' },
    },
    flex: {
        center: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        between: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        start: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
        },
    },
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string>('');
    const [isLogin, setIsLogin] = useState(true);
    const [authForm, setAuthForm] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [authError, setAuthError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState<EditTaskFormData | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const [updatingTask, setUpdatingTask] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchStatus, setSearchStatus] = useState('');
    const [searchPriority, setSearchPriority] = useState('');
    const [searchType, setSearchType] = useState<'ALL' | 'STATUS' | 'PRIORITY' | 'KEYWORD' | 'ADVANCED'>('ALL');

    const [taskForm, setTaskForm] = useState<TaskFormData>({
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        deadline: '',
        userId: 0
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('currentUser');
        const savedToken = localStorage.getItem('token');
        if (savedUser && savedToken) {
            setCurrentUser(JSON.parse(savedUser));
            setToken(savedToken);
        }
    }, []);

    useEffect(() => {
        if (currentUser && token) {
            fetchTasks();
        }
    }, [currentUser, token]);

    useEffect(() => {
        applyFilters();
    }, [tasks, statusFilter, priorityFilter]);

    const applyFilters = () => {
        let filtered = tasks;
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(task => task.status === statusFilter);
        }
        if (priorityFilter !== 'ALL') {
            filtered = filtered.filter(task => task.priority === priorityFilter);
        }
        setFilteredTasks(filtered);
    };

    const getAuthHeaders = () => {
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const handleAuth = async (e: FormEvent) => {
        e.preventDefault();
        setAuthError('');
        setRegistrationSuccess(false);
        try {
            const url = isLogin ? `${API_BASE_URL}/auth/login` : `${API_BASE_URL}/auth/register`;
            const body = isLogin
                ? { email: authForm.email, password: authForm.password }
                : { username: authForm.username, email: authForm.email, password: authForm.password };
            const response = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body)
            });
            if (response.ok) {
                const authData: AuthResponse = await response.json();
                if (isLogin) {
                    setCurrentUser(authData.user);
                    setToken(authData.token);
                    localStorage.setItem('currentUser', JSON.stringify(authData.user));
                    localStorage.setItem('token', authData.token);
                    setAuthForm({ username: '', email: '', password: '' });
                    setAuthError('');
                } else {
                    setRegistrationSuccess(true);
                    setAuthError('');
                    setIsLogin(true);
                    setAuthForm({ ...authForm, password: '' });
                }
            } else {
                const errorData = await response.json();
                setAuthError(errorData.message || 'Ошибка авторизации');
                setRegistrationSuccess(false);
            }
        } catch (err) {
            setAuthError('Ошибка подключения к серверу');
            setRegistrationSuccess(false);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setToken('');
        setTasks([]);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
    };

    const fetchTasks = async () => {
        if (!currentUser || !token) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/api/search/user/${currentUser.id}`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            if (response.ok) {
                const data = await response.json();
                const tasksArray = Array.isArray(data) ? data : [];
                setTasks(tasksArray);
                setError('');
            } else if (response.status === 401) {
                setError('Ошибка авторизации. Пожалуйста, войдите снова.');
                handleLogout();
            } else {
                const errorText = await response.text();
                setError(`Ошибка загрузки задач: ${errorText}`);
            }
        } catch (err) {
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusSearch = async () => {
        if (!currentUser || !token || !searchStatus) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/search/user/${currentUser.id}/status?status=${searchStatus}`,
                { method: 'GET', headers: getAuthHeaders() }
            );
            if (response.ok) {
                const data = await response.json();
                setTasks(Array.isArray(data) ? data : []);
                setError('');
            } else {
                const errorText = await response.text();
                setError(`Ошибка поиска по статусу: ${errorText}`);
            }
        } catch (err) {
            setError('Ошибка подключения при поиске по статусу');
        } finally {
            setLoading(false);
        }
    };

    const handlePrioritySearch = async () => {
        if (!currentUser || !token || !searchPriority) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/search/user/${currentUser.id}/priority?priority=${searchPriority}`,
                { method: 'GET', headers: getAuthHeaders() }
            );
            if (response.ok) {
                const data = await response.json();
                setTasks(Array.isArray(data) ? data : []);
                setError('');
            } else {
                const errorText = await response.text();
                setError(`Ошибка поиска по приоритету: ${errorText}`);
            }
        } catch (err) {
            setError('Ошибка подключения при поиске по приоритету');
        } finally {
            setLoading(false);
        }
    };

    const handleKeywordSearch = async () => {
        if (!currentUser || !token || !searchKeyword.trim()) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/search/user/${currentUser.id}/keyword?keyword=${encodeURIComponent(searchKeyword)}`,
                { method: 'GET', headers: getAuthHeaders() }
            );
            if (response.ok) {
                const data = await response.json();
                setTasks(Array.isArray(data) ? data : []);
                setError('');
            } else {
                const errorText = await response.text();
                setError(`Ошибка поиска по ключевому слову: ${errorText}`);
            }
        } catch (err) {
            setError('Ошибка подключения при поиске по ключевому слову');
        } finally {
            setLoading(false);
        }
    };

    const handleAdvancedSearch = async () => {
        if (!currentUser || !token) return;
        setLoading(true);
        setError('');
        try {
            const searchCriteria: SearchCriteria = {
                userId: currentUser.id,
                keyword: searchKeyword || undefined,
                status: searchStatus as Task['status'],
                priority: searchPriority as Task['priority'],
                page: 0,
                size: 50
            };
            const response = await fetch(`${API_BASE_URL}/api/search/advanced`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(searchCriteria)
            });
            if (response.ok) {
                const result = await response.json();
                setTasks(result.content || []);
                setError('');
            } else {
                const errorText = await response.text();
                setError(`Ошибка расширенного поиска: ${errorText}`);
            }
        } catch (err) {
            setError('Ошибка подключения при расширенном поиске');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncTasks = async () => {
        if (!currentUser || !token) return;
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/search/sync/${currentUser.id}`,
                { method: 'POST', headers: getAuthHeaders() }
            );
            if (response.ok) {
                await fetchTasks();
            }
        } catch (err) {
            setError('Ошибка синхронизации');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentUser || !token) return;
        if (!taskForm.title.trim()) {
            setError('Название задачи обязательно');
            return;
        }
        setCreatingTask(true);
        setError('');
        try {
            const taskData = {
                title: taskForm.title,
                description: taskForm.description,
                status: taskForm.status,
                priority: taskForm.priority,
                deadline: taskForm.deadline ? taskForm.deadline + ':00' : null,
                userId: currentUser.id
            };
            const response = await fetch(`${API_BASE_URL}/api/tasks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData)
            });
            if (response.ok) {
                await handleSyncTasks();
                setTaskForm({
                    title: '',
                    description: '',
                    status: 'TODO',
                    priority: 'MEDIUM',
                    deadline: '',
                    userId: currentUser.id
                });
                setShowTaskForm(false);
                setError('');
            } else if (response.status === 401) {
                setError('Ошибка авторизации. Пожалуйста, войдите снова.');
                handleLogout();
            } else {
                const errorText = await response.text();
                setError(`Ошибка создания задачи: ${errorText}`);
            }
        } catch (err) {
            setError('Ошибка подключения при создании задачи');
        } finally {
            setCreatingTask(false);
        }
    };

    const handleUpdateTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingTask || !currentUser || !token) return;
        if (!editingTask.title.trim()) {
            setError('Название задачи обязательно');
            return;
        }
        setUpdatingTask(true);
        setError('');
        try {
            const taskData = {
                title: editingTask.title,
                description: editingTask.description,
                status: editingTask.status,
                priority: editingTask.priority,
                deadline: editingTask.deadline ? editingTask.deadline + ':00' : null,
                userId: currentUser.id
            };
            const response = await fetch(`${API_BASE_URL}/api/tasks/${editingTask.id}?userId=${currentUser.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData)
            });
            if (response.ok) {
                await handleSyncTasks();
                setEditingTask(null);
                setError('');
            } else if (response.status === 401) {
                setError('Ошибка авторизации. Пожалуйста, войдите снова.');
                handleLogout();
            } else {
                const errorText = await response.text();
                setError(`Ошибка обновления задачи: ${errorText}`);
            }
        } catch (err) {
            setError('Ошибка подключения при обновлении задачи');
        } finally {
            setUpdatingTask(false);
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        if (!currentUser || !token) return;
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/tasks/${taskId}/status?userId=${currentUser.id}&status=${newStatus}`,
                { method: 'PATCH', headers: getAuthHeaders() }
            );
            if (response.ok) {
                await handleSyncTasks();
            } else if (response.status === 401) {
                setError('Ошибка авторизации. Пожалуйста, войдите снова.');
                handleLogout();
            } else {
                setError('Ошибка изменения статуса');
            }
        } catch (err) {
            setError('Ошибка изменения статуса');
        }
    };

    const handlePriorityChange = async (taskId: number, newPriority: string) => {
        if (!currentUser || !token) return;
        try {
            const taskToUpdate = tasks.find(task => task.id === taskId);
            if (!taskToUpdate) return;
            const updatedTaskData = {
                ...taskToUpdate,
                priority: newPriority as Task['priority']
            };
            const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}?userId=${currentUser.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(updatedTaskData)
            });
            if (response.ok) {
                await handleSyncTasks();
            } else if (response.status === 401) {
                setError('Ошибка авторизации. Пожалуйста, войдите снова.');
                handleLogout();
            } else {
                setError('Ошибка изменения приоритета');
            }
        } catch (err) {
            setError('Ошибка изменения приоритета');
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!currentUser || !token || !window.confirm('Удалить задачу?')) return;
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/tasks/${taskId}?userId=${currentUser.id}`,
                { method: 'DELETE', headers: getAuthHeaders() }
            );
            if (response.ok) {
                await handleSyncTasks();
            } else if (response.status === 401) {
                setError('Ошибка авторизации. Пожалуйста, войдите снова.');
                handleLogout();
            } else {
                setError('Ошибка удаления задачи');
            }
        } catch (err) {
            setError('Ошибка удаления задачи');
        }
    };

    const startEditTask = (task: Task) => {
        setEditingTask({
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            deadline: task.deadline ? task.deadline.slice(0, 16) : ''
        });
    };

    const getStatusText = (status: Task['status']) => {
        const texts = {
            TODO: 'К выполнению',
            IN_PROGRESS: 'В процессе',
            DONE: 'Завершено',
            CANCELLED: 'Отменено',
            OVERDUE: 'Просрочено'
        };
        return texts[status];
    };

    const getPriorityText = (priority: Task['priority']) => {
        const texts = {
            LOW: 'Низкий',
            MEDIUM: 'Средний',
            HIGH: 'Высокий',
            URGENT: 'Срочный'
        };
        return texts[priority];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSearch = () => {
        switch (searchType) {
            case 'STATUS':
                handleStatusSearch();
                break;
            case 'PRIORITY':
                handlePrioritySearch();
                break;
            case 'KEYWORD':
                handleKeywordSearch();
                break;
            case 'ADVANCED':
                handleAdvancedSearch();
                break;
            default:
                fetchTasks();
                break;
        }
    };

    if (!currentUser) {
        return (
            <div style={styles.authContainer}>
                <div style={styles.authCard}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            ...styles.heading,
                            fontSize: '2rem',
                            marginBottom: '8px'
                        }}>
                            🎯 TaskFlow
                        </div>
                        <p style={{ ...styles.body, color: '#6b7280' }}>
                            {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
                        </p>
                    </div>

                    {registrationSuccess && (
                        <div style={{
                            background: '#d1fae5',
                            color: '#065f46',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            border: '1px solid #a7f3d0'
                        }}>
                            ✅ Регистрация успешна! Теперь войдите в систему.
                        </div>
                    )}

                    {authError && (
                        <div style={{
                            background: '#fee2e2',
                            color: '#dc2626',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            border: '1px solid #fecaca'
                        }}>
                            {authError}
                        </div>
                    )}

                    <form onSubmit={handleAuth}>
                        {!isLogin && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Имя пользователя
                                </label>
                                <input
                                    type="text"
                                    value={authForm.username}
                                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                                    style={styles.input.base}
                                    required
                                />
                            </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                Email
                            </label>
                            <input
                                type="email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                style={styles.input.base}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                Пароль
                            </label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                style={styles.input.base}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                ...styles.button.base,
                                ...styles.button.primary,
                                width: '100%',
                                marginBottom: '16px'
                            }}
                        >
                            {isLogin ? '🔐 Войти' : '🚀 Зарегистрироваться'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setAuthError('');
                                setRegistrationSuccess(false);
                            }}
                            style={{
                                ...styles.button.base,
                                ...styles.button.ghost,
                                width: '100%'
                            }}
                        >
                            {isLogin ? '📝 Нет аккаунта? Зарегистрироваться' : '🔐 Уже есть аккаунт? Войти'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.mainContainer}>
            {/* Header */}
            <header style={{
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                padding: '16px 0'
            }}>
                <div style={styles.content}>
                    <div style={styles.flex.between}>
                        <div>
                            <h1 style={{ ...styles.heading, margin: 0 }}>🎯 TaskFlow</h1>
                            <p style={{ ...styles.body, margin: 0 }}>
                                Добро пожаловать, <strong>{currentUser.username}</strong>! 👋
                            </p>
                        </div>
                        <div style={{ ...styles.flex.start, gap: '12px' }}>
                            <span style={{
                                background: '#f1f5f9',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                color: '#64748b'
                            }}>
                                {currentUser.email}
                            </span>
                            <button
                                onClick={handleLogout}
                                style={{
                                    ...styles.button.base,
                                    ...styles.button.danger,
                                    padding: '8px 16px'
                                }}
                            >
                                🚪 Выйти
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div style={styles.content}>
                {/* Alerts */}
                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        border: '1px solid #fecaca'
                    }}>
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ ...styles.card, padding: '24px', marginBottom: '24px' }}>
                    <div style={{ ...styles.flex.start, gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setShowTaskForm(true)}
                            style={{
                                ...styles.button.base,
                                ...styles.button.success
                            }}
                        >
                            ➕ Создать задачу
                        </button>

                        <button
                            onClick={fetchTasks}
                            disabled={loading}
                            style={{
                                ...styles.button.base,
                                ...styles.button.primary,
                                opacity: loading ? 0.6 : 1
                            }}
                        >
                            {loading ? '⏳ Загрузка...' : '📋 Все задачи'}
                        </button>

                        <button
                            onClick={handleSyncTasks}
                            disabled={loading}
                            style={{
                                ...styles.button.base,
                                ...styles.button.secondary
                            }}
                        >
                            🔄 Синхронизировать
                        </button>
                    </div>
                </div>

                {/* Search Panel */}
                <div style={{ ...styles.card, padding: '24px', marginBottom: '24px' }}>
                    <h3 style={{ ...styles.subheading, marginBottom: '20px' }}>🔍 Поиск задач</h3>

                    {/* Search Type Tabs */}
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {([
                            { key: 'ALL', label: 'Все задачи', emoji: '📋' },
                            { key: 'STATUS', label: 'По статусу', emoji: '🏷️' },
                            { key: 'PRIORITY', label: 'По приоритету', emoji: '⚡' },
                            { key: 'KEYWORD', label: 'По ключевому слову', emoji: '🔤' },
                            { key: 'ADVANCED', label: 'Расширенный поиск', emoji: '🎯' }
                        ] as const).map(({ key, label, emoji }) => (
                            <button
                                key={key}
                                onClick={() => setSearchType(key)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: searchType === key ?
                                        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8fafc',
                                    color: searchType === key ? 'white' : '#64748b',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontWeight: '500',
                                    fontSize: '14px'
                                }}
                            >
                                {emoji} {label}
                            </button>
                        ))}
                    </div>

                    {/* Search Inputs */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end' }}>
                        {searchType === 'STATUS' && (
                            <div style={{ minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                                    Статус
                                </label>
                                <select
                                    value={searchStatus}
                                    onChange={(e) => setSearchStatus(e.target.value)}
                                    style={styles.input.base}
                                >
                                    <option value="">Выберите статус</option>
                                    <option value="TODO">К выполнению</option>
                                    <option value="IN_PROGRESS">В процессе</option>
                                    <option value="DONE">Завершено</option>
                                    <option value="CANCELLED">Отменено</option>
                                    <option value="OVERDUE">Просрочено</option>
                                </select>
                            </div>
                        )}

                        {searchType === 'PRIORITY' && (
                            <div style={{ minWidth: '200px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                                    Приоритет
                                </label>
                                <select
                                    value={searchPriority}
                                    onChange={(e) => setSearchPriority(e.target.value)}
                                    style={styles.input.base}
                                >
                                    <option value="">Выберите приоритет</option>
                                    <option value="LOW">Низкий</option>
                                    <option value="MEDIUM">Средний</option>
                                    <option value="HIGH">Высокий</option>
                                    <option value="URGENT">Срочный</option>
                                </select>
                            </div>
                        )}

                        {searchType === 'KEYWORD' && (
                            <div style={{ minWidth: '300px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                                    Ключевое слово
                                </label>
                                <input
                                    type="text"
                                    placeholder="Введите ключевое слово..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    style={styles.input.base}
                                />
                            </div>
                        )}

                        {searchType === 'ADVANCED' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                                        Ключевое слово
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Название или описание..."
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                        style={styles.input.base}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                                        Статус
                                    </label>
                                    <select
                                        value={searchStatus}
                                        onChange={(e) => setSearchStatus(e.target.value)}
                                        style={styles.input.base}
                                    >
                                        <option value="">Любой статус</option>
                                        <option value="TODO">К выполнению</option>
                                        <option value="IN_PROGRESS">В процессе</option>
                                        <option value="DONE">Завершено</option>
                                        <option value="CANCELLED">Отменено</option>
                                        <option value="OVERDUE">Просрочено</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151' }}>
                                        Приоритет
                                    </label>
                                    <select
                                        value={searchPriority}
                                        onChange={(e) => setSearchPriority(e.target.value)}
                                        style={styles.input.base}
                                    >
                                        <option value="">Любой приоритет</option>
                                        <option value="LOW">Низкий</option>
                                        <option value="MEDIUM">Средний</option>
                                        <option value="HIGH">Высокий</option>
                                        <option value="URGENT">Срочный</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {(searchType === 'STATUS' || searchType === 'PRIORITY' || searchType === 'KEYWORD' || searchType === 'ADVANCED') && (
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                style={{
                                    ...styles.button.base,
                                    ...styles.button.primary,
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? '⏳ Поиск...' : '🔍 Найти'}
                            </button>
                        )}

                        {searchType !== 'ALL' && (
                            <button
                                onClick={() => {
                                    setSearchKeyword('');
                                    setSearchStatus('');
                                    setSearchPriority('');
                                    setSearchType('ALL');
                                    fetchTasks();
                                }}
                                style={{
                                    ...styles.button.base,
                                    ...styles.button.secondary
                                }}
                            >
                                🗑️ Сбросить
                            </button>
                        )}
                    </div>
                </div>

                {/* Tasks Section */}
                <div>
                    <div style={{ ...styles.flex.between, marginBottom: '20px' }}>
                        <h3 style={{ ...styles.subheading, margin: 0 }}>
                            Задачи ({filteredTasks.length})
                        </h3>

                        {/* Quick Filters */}
                        <div style={{ ...styles.flex.start, gap: '12px' }}>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                style={{ ...styles.input.base, width: 'auto' }}
                            >
                                <option value="ALL">Все статусы</option>
                                <option value="TODO">К выполнению</option>
                                <option value="IN_PROGRESS">В процессе</option>
                                <option value="DONE">Завершено</option>
                                <option value="CANCELLED">Отменено</option>
                                <option value="OVERDUE">Просрочено</option>
                            </select>

                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                style={{ ...styles.input.base, width: 'auto' }}
                            >
                                <option value="ALL">Все приоритеты</option>
                                <option value="LOW">Низкий</option>
                                <option value="MEDIUM">Средний</option>
                                <option value="HIGH">Высокий</option>
                                <option value="URGENT">Срочный</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ ...styles.flex.center, padding: '60px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                                <p style={styles.body}>Загрузка задач...</p>
                            </div>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div style={{ ...styles.flex.center, padding: '60px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                                <h4 style={{ ...styles.subheading, marginBottom: '8px' }}>Задачи не найдены</h4>
                                <p style={styles.body}>Создайте первую задачу или измените параметры поиска</p>
                            </div>
                        </div>
                    ) : (
                        <div style={{ ...styles.grid.container, ...styles.grid.cols2 }}>
                            {filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    style={styles.taskCard}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
                                    }}
                                >
                                    <div style={{ marginBottom: '16px' }}>
                                        <h4 style={{
                                            margin: '0 0 8px 0',
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#1f2937'
                                        }}>
                                            {task.title}
                                        </h4>
                                        {task.description && (
                                            <p style={{
                                                margin: 0,
                                                color: '#6b7280',
                                                fontSize: '14px',
                                                lineHeight: '1.5'
                                            }}>
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        flexWrap: 'wrap',
                                        marginBottom: '16px'
                                    }}>
                                        <span>
                                            {getStatusText(task.status)}
                                        </span>
                                        <span>
                                            {getPriorityText(task.priority)}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        color: '#6b7280',
                                        fontSize: '12px',
                                        marginBottom: '16px'
                                    }}>
                                        {task.deadline && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                📅 {formatDate(task.deadline)}
                                            </span>
                                        )}
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            🕐 {formatDate(task.createdAt)}
                                        </span>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        gap: '8px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            style={{
                                                ...styles.input.base,
                                                padding: '6px 8px',
                                                fontSize: '12px',
                                                flex: '1'
                                            }}
                                        >
                                            <option value="TODO">К выполнению</option>
                                            <option value="IN_PROGRESS">В процессе</option>
                                            <option value="DONE">Завершено</option>
                                            <option value="CANCELLED">Отменено</option>
                                            <option value="OVERDUE">Просрочено</option>
                                        </select>

                                        <select
                                            value={task.priority}
                                            onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                                            style={{
                                                ...styles.input.base,
                                                padding: '6px 8px',
                                                fontSize: '12px',
                                                flex: '1'
                                            }}
                                        >
                                            <option value="LOW">Низкий</option>
                                            <option value="MEDIUM">Средний</option>
                                            <option value="HIGH">Высокий</option>
                                            <option value="URGENT">Срочный</option>
                                        </select>

                                        <button
                                            onClick={() => startEditTask(task)}
                                            style={{
                                                ...styles.button.base,
                                                ...styles.button.warning,
                                                padding: '6px 12px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            ✏️
                                        </button>

                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            style={{
                                                ...styles.button.base,
                                                ...styles.button.danger,
                                                padding: '6px 12px',
                                                fontSize: '12px'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            {showTaskForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        ...styles.card,
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ ...styles.flex.between, marginBottom: '24px' }}>
                            <h3 style={{ ...styles.subheading, margin: 0 }}>Создать задачу</h3>
                            <button
                                onClick={() => setShowTaskForm(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Название *
                                </label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    style={styles.input.base}
                                    required
                                    placeholder="Введите название задачи"
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Описание
                                </label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    style={{ ...styles.input.base, minHeight: '100px', resize: 'vertical' }}
                                    placeholder="Опишите детали задачи"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                        Статус
                                    </label>
                                    <select
                                        value={taskForm.status}
                                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}
                                        style={styles.input.base}
                                    >
                                        <option value="TODO">К выполнению</option>
                                        <option value="IN_PROGRESS">В процессе</option>
                                        <option value="DONE">Завершено</option>
                                        <option value="CANCELLED">Отменено</option>
                                        <option value="OVERDUE">Просрочено</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                        Приоритет
                                    </label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                                        style={styles.input.base}
                                    >
                                        <option value="LOW">Низкий</option>
                                        <option value="MEDIUM">Средний</option>
                                        <option value="HIGH">Высокий</option>
                                        <option value="URGENT">Срочный</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Дедлайн
                                </label>
                                <input
                                    type="datetime-local"
                                    value={taskForm.deadline}
                                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                    style={styles.input.base}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskForm(false)}
                                    style={{
                                        ...styles.button.base,
                                        ...styles.button.secondary
                                    }}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingTask}
                                    style={{
                                        ...styles.button.base,
                                        ...styles.button.success,
                                        opacity: creatingTask ? 0.6 : 1
                                    }}
                                >
                                    {creatingTask ? '⏳ Создание...' : '✅ Создать'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        ...styles.card,
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ ...styles.flex.between, marginBottom: '24px' }}>
                            <h3 style={{ ...styles.subheading, margin: 0 }}>Редактировать задачу</h3>
                            <button
                                onClick={() => setEditingTask(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTask}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Название *
                                </label>
                                <input
                                    type="text"
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                    style={styles.input.base}
                                    required
                                    disabled={updatingTask}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Описание
                                </label>
                                <textarea
                                    value={editingTask.description}
                                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                    style={{ ...styles.input.base, minHeight: '100px', resize: 'vertical' }}
                                    disabled={updatingTask}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                        Статус
                                    </label>
                                    <select
                                        value={editingTask.status}
                                        onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                                        style={styles.input.base}
                                        disabled={updatingTask}
                                    >
                                        <option value="TODO">К выполнению</option>
                                        <option value="IN_PROGRESS">В процессе</option>
                                        <option value="DONE">Завершено</option>
                                        <option value="CANCELLED">Отменено</option>
                                        <option value="OVERDUE">Просрочено</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                        Приоритет
                                    </label>
                                    <select
                                        value={editingTask.priority}
                                        onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                                        style={styles.input.base}
                                        disabled={updatingTask}
                                    >
                                        <option value="LOW">Низкий</option>
                                        <option value="MEDIUM">Средний</option>
                                        <option value="HIGH">Высокий</option>
                                        <option value="URGENT">Срочный</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                                    Дедлайн
                                </label>
                                <input
                                    type="datetime-local"
                                    value={editingTask.deadline}
                                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                                    style={styles.input.base}
                                    disabled={updatingTask}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditingTask(null)}
                                    style={{
                                        ...styles.button.base,
                                        ...styles.button.secondary
                                    }}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    disabled={updatingTask}
                                    style={{
                                        ...styles.button.base,
                                        ...styles.button.primary,
                                        opacity: updatingTask ? 0.6 : 1
                                    }}
                                >
                                    {updatingTask ? '⏳ Сохранение...' : '💾 Сохранить'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;