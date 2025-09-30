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

    const getStatusColor = (status: Task['status']) => {
        const colors = {
            TODO: '#e5e7eb',
            IN_PROGRESS: '#dbeafe',
            DONE: '#d1fae5',
            CANCELLED: '#fee2e2',
            OVERDUE: '#ffedd5'
        };
        return colors[status];
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

    const getPriorityColor = (priority: Task['priority']) => {
        const colors = {
            LOW: '#10b981',
            MEDIUM: '#f59e0b',
            HIGH: '#ef4444',
            URGENT: '#dc2626'
        };
        return colors[priority];
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
        return new Date(dateString).toLocaleString('ru-RU');
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
            <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '50px auto' }}>
                <h1>🎯 Менеджер задач</h1>
                <div style={{ border: '1px solid #e5e7eb', padding: '20px', borderRadius: '8px', backgroundColor: 'white' }}>
                    <h2>{isLogin ? 'Вход в систему' : 'Регистрация'}</h2>
                    {registrationSuccess && (
                        <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                            ✅ Регистрация успешна! Теперь войдите в систему.
                        </div>
                    )}
                    {authError && (
                        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                            {authError}
                        </div>
                    )}
                    <form onSubmit={handleAuth}>
                        {!isLogin && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Имя пользователя</label>
                                <input
                                    type="text"
                                    value={authForm.username}
                                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    required
                                />
                            </div>
                        )}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                            <input
                                type="email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Пароль</label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                marginBottom: '15px'
                            }}
                        >
                            {isLogin ? 'Войти' : 'Зарегистрироваться'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setAuthError('');
                                setRegistrationSuccess(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: 'transparent',
                                color: '#3b82f6',
                                border: '1px solid #3b82f6',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1>🎯 Менеджер задач</h1>
                    <p>Добро пожаловать, <strong>{currentUser.username}</strong>! ({currentUser.email})</p>
                    <small style={{ color: '#6b7280' }}>JWT токен: {token.substring(0, 20)}...</small>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    Выйти
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                    {error}
                </div>
            )}

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setShowTaskForm(true)}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }}
                >
                    + Создать задачу
                </button>

                <button
                    onClick={fetchTasks}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Загрузка...' : 'Все задачи'}
                </button>

                <button
                    onClick={handleSyncTasks}
                    disabled={loading}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    🔄 Синхронизировать
                </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
                <h4 style={{ margin: '0 0 15px 0' }}>🔍 Поиск задач</h4>
                <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setSearchType('ALL')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: searchType === 'ALL' ? '#3b82f6' : '#e5e7eb',
                            color: searchType === 'ALL' ? 'white' : '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Все задачи
                    </button>
                    <button
                        onClick={() => setSearchType('STATUS')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: searchType === 'STATUS' ? '#8b5cf6' : '#e5e7eb',
                            color: searchType === 'STATUS' ? 'white' : '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        По статусу
                    </button>
                    <button
                        onClick={() => setSearchType('PRIORITY')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: searchType === 'PRIORITY' ? '#f59e0b' : '#e5e7eb',
                            color: searchType === 'PRIORITY' ? 'white' : '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        По приоритету
                    </button>
                    <button
                        onClick={() => setSearchType('KEYWORD')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: searchType === 'KEYWORD' ? '#10b981' : '#e5e7eb',
                            color: searchType === 'KEYWORD' ? 'white' : '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        По ключевому слову
                    </button>
                    <button
                        onClick={() => setSearchType('ADVANCED')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: searchType === 'ADVANCED' ? '#ec4899' : '#e5e7eb',
                            color: searchType === 'ADVANCED' ? 'white' : '#374151',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Расширенный поиск
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'end' }}>
                    {searchType === 'STATUS' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Статус</label>
                            <select
                                value={searchStatus}
                                onChange={(e) => setSearchStatus(e.target.value)}
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '150px' }}
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
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Приоритет</label>
                            <select
                                value={searchPriority}
                                onChange={(e) => setSearchPriority(e.target.value)}
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '150px' }}
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
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Ключевое слово</label>
                            <input
                                type="text"
                                placeholder="Введите ключевое слово..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '250px' }}
                            />
                        </div>
                    )}

                    {searchType === 'ADVANCED' && (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Ключевое слово</label>
                                <input
                                    type="text"
                                    placeholder="Название или описание..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '200px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Статус</label>
                                <select
                                    value={searchStatus}
                                    onChange={(e) => setSearchStatus(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
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
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Приоритет</label>
                                <select
                                    value={searchPriority}
                                    onChange={(e) => setSearchPriority(e.target.value)}
                                    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
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
                            disabled={loading ||
                                (searchType === 'STATUS' && !searchStatus) ||
                                (searchType === 'PRIORITY' && !searchPriority) ||
                                (searchType === 'KEYWORD' && !searchKeyword.trim())
                            }
                            style={{
                                padding: '8px 16px',
                                backgroundColor: loading ? '#9ca3af' : '#8b5cf6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: loading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {loading ? 'Поиск...' : 'Найти'}
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
                                padding: '8px 16px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Сбросить
                        </button>
                    )}
                </div>
            </div>

            {showTaskForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px'
                    }}>
                        <h3>Создать новую задачу</h3>
                        <form onSubmit={handleCreateTask}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Название *</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Описание</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Статус</label>
                                <select
                                    value={taskForm.status}
                                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="TODO">К выполнению</option>
                                    <option value="IN_PROGRESS">В процессе</option>
                                    <option value="DONE">Завершено</option>
                                    <option value="CANCELLED">Отменено</option>
                                    <option value="OVERDUE">Просрочено</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Приоритет</label>
                                <select
                                    value={taskForm.priority}
                                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                >
                                    <option value="LOW">Низкий</option>
                                    <option value="MEDIUM">Средний</option>
                                    <option value="HIGH">Высокий</option>
                                    <option value="URGENT">Срочный</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Дедлайн</label>
                                <input
                                    type="datetime-local"
                                    value={taskForm.deadline}
                                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={creatingTask}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: creatingTask ? '#9ca3af' : '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: creatingTask ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {creatingTask ? 'Создание...' : 'Создать'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTaskForm(false)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingTask && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px'
                    }}>
                        <h3>Редактировать задачу</h3>
                        <form onSubmit={handleUpdateTask}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Название *</label>
                                <input
                                    type="text"
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    required
                                    disabled={updatingTask}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Описание</label>
                                <textarea
                                    value={editingTask.description}
                                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px' }}
                                    disabled={updatingTask}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Статус</label>
                                <select
                                    value={editingTask.status}
                                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    disabled={updatingTask}
                                >
                                    <option value="TODO">К выполнению</option>
                                    <option value="IN_PROGRESS">В процессе</option>
                                    <option value="DONE">Завершено</option>
                                    <option value="CANCELLED">Отменено</option>
                                    <option value="OVERDUE">Просрочено</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Приоритет</label>
                                <select
                                    value={editingTask.priority}
                                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    disabled={updatingTask}
                                >
                                    <option value="LOW">Низкий</option>
                                    <option value="MEDIUM">Средний</option>
                                    <option value="HIGH">Высокий</option>
                                    <option value="URGENT">Срочный</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Дедлайн</label>
                                <input
                                    type="datetime-local"
                                    value={editingTask.deadline}
                                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                                    disabled={updatingTask}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="submit"
                                    disabled={updatingTask}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: updatingTask ? '#9ca3af' : '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: updatingTask ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {updatingTask ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingTask(null)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div>
                <h3>Задачи ({filteredTasks.length})</h3>
                {loading ? (
                    <p>Загрузка задач...</p>
                ) : filteredTasks.length === 0 ? (
                    <p>Задачи не найдены</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredTasks.map(task => (
                            <div
                                key={task.id}
                                style={{
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '15px',
                                    backgroundColor: getStatusColor(task.status)
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 5px 0' }}>{task.title}</h4>
                                        {task.description && (
                                            <p style={{ margin: '0 0 10px 0', color: '#6b7280' }}>{task.description}</p>
                                        )}
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '14px' }}>
                                            <span style={{
                                                backgroundColor: getStatusColor(task.status),
                                                color: '#374151',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #9ca3af'
                                            }}>
                                                {getStatusText(task.status)}
                                            </span>
                                            <span style={{
                                                backgroundColor: 'white',
                                                color: getPriorityColor(task.priority),
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: `1px solid ${getPriorityColor(task.priority)}`
                                            }}>
                                                {getPriorityText(task.priority)}
                                            </span>
                                            {task.deadline && (
                                                <span style={{ color: '#6b7280' }}>
                                                    📅 {formatDate(task.deadline)}
                                                </span>
                                            )}
                                            <span style={{ color: '#6b7280' }}>
                                                Создано: {formatDate(task.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                        <select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                            style={{ padding: '5px', fontSize: '12px' }}
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
                                            style={{ padding: '5px', fontSize: '12px' }}
                                        >
                                            <option value="LOW">Низкий</option>
                                            <option value="MEDIUM">Средний</option>
                                            <option value="HIGH">Высокий</option>
                                            <option value="URGENT">Срочный</option>
                                        </select>
                                        <button
                                            onClick={() => startEditTask(task)}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#f59e0b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(task.id)}
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;