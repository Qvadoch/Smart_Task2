// App.tsx
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
    const [serviceStatus, setServiceStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');

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

    const handleServiceError = (error: any, serviceName: string) => {
        console.error(`Service ${serviceName} error:`, error);
        setServiceStatus('OFFLINE');
        setError(`${serviceName} is temporarily unavailable. Please try again later.`);

        // Автоматическое восстановление через 5 секунд
        setTimeout(() => {
            setServiceStatus('ONLINE');
            setError('');
        }, 5000);
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
                // Проверяем fallback response
                if (response.status === 503) {
                    const fallbackData = await response.json();
                    setAuthError(`Service unavailable: ${fallbackData.message}`);
                    handleServiceError(fallbackData, 'Authentication Service');
                } else {
                    const errorData = await response.json();
                    setAuthError(errorData.message || 'Authentication error');
                }
                setRegistrationSuccess(false);
            }
        } catch (err) {
            setAuthError('Connection error - service may be down');
            handleServiceError(err, 'Authentication Service');
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
                setServiceStatus('ONLINE');
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Search service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Search Service');
                setTasks([]);
            } else if (response.status === 401) {
                setError('Authorization error. Please log in again.');
                handleLogout();
            } else {
                const errorText = await response.text();
                setError(`Error loading tasks: ${errorText}`);
            }
        } catch (err) {
            setError('Connection error - search service may be down');
            handleServiceError(err, 'Search Service');
            setTasks([]);
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Search service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Search Service');
            } else {
                const errorText = await response.text();
                setError(`Status search error: ${errorText}`);
            }
        } catch (err) {
            setError('Connection error during status search');
            handleServiceError(err, 'Search Service');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Search service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Search Service');
            } else {
                const errorText = await response.text();
                setError(`Priority search error: ${errorText}`);
            }
        } catch (err) {
            setError('Connection error during priority search');
            handleServiceError(err, 'Search Service');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Search service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Search Service');
            } else {
                const errorText = await response.text();
                setError(`Keyword search error: ${errorText}`);
            }
        } catch (err) {
            setError('Connection error during keyword search');
            handleServiceError(err, 'Search Service');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Search service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Search Service');
            } else {
                const errorText = await response.text();
                setError(`Advanced search error: ${errorText}`);
            }
        } catch (err) {
            setError('Connection error during advanced search');
            handleServiceError(err, 'Search Service');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Sync service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Sync Service');
            }
        } catch (err) {
            setError('Sync error - service may be down');
            handleServiceError(err, 'Sync Service');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentUser || !token) return;
        if (!taskForm.title.trim()) {
            setError('Task title is required');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Task service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Task Service');
            } else if (response.status === 401) {
                setError('Authorization error. Please log in again.');
                handleLogout();
            } else {
                const errorText = await response.text();
                setError(`Error creating task: ${errorText}`);
            }
        } catch (err) {
            setError('Connection error while creating task');
            handleServiceError(err, 'Task Service');
        } finally {
            setCreatingTask(false);
        }
    };

    const handleUpdateTask = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingTask || !currentUser || !token) return;
        if (!editingTask.title.trim()) {
            setError('Task title is required');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Task service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Task Service');
            } else if (response.status === 401) {
                setError('Authorization error. Please log in again.');
                handleLogout();
            } else {
                const errorText = await response.text();
                setError(`Error updating task: ${errorText}`);
            }
        } catch (err) {
            setError('Connection error while updating task');
            handleServiceError(err, 'Task Service');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Task service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Task Service');
            } else if (response.status === 401) {
                setError('Authorization error. Please log in again.');
                handleLogout();
            } else {
                setError('Error changing status');
            }
        } catch (err) {
            setError('Error changing status');
            handleServiceError(err, 'Task Service');
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
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Task service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Task Service');
            } else if (response.status === 401) {
                setError('Authorization error. Please log in again.');
                handleLogout();
            } else {
                setError('Error changing priority');
            }
        } catch (err) {
            setError('Error changing priority');
            handleServiceError(err, 'Task Service');
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!currentUser || !token || !window.confirm('Are you sure you want to delete this task?')) return;
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/tasks/${taskId}?userId=${currentUser.id}`,
                { method: 'DELETE', headers: getAuthHeaders() }
            );

            if (response.ok) {
                await handleSyncTasks();
            } else if (response.status === 503) {
                const fallbackData = await response.json();
                setError(`Task service unavailable: ${fallbackData.message}`);
                handleServiceError(fallbackData, 'Task Service');
            } else if (response.status === 401) {
                setError('Authorization error. Please log in again.');
                handleLogout();
            } else {
                setError('Error deleting task');
            }
        } catch (err) {
            setError('Error deleting task');
            handleServiceError(err, 'Task Service');
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
            TODO: '#667eea',
            IN_PROGRESS: '#f093fb',
            DONE: '#4facfe',
            CANCELLED: '#fd746c',
            OVERDUE: '#ff6b6b'
        };
        return colors[status];
    };

    const getStatusText = (status: Task['status']) => {
        const texts = {
            TODO: 'To Do',
            IN_PROGRESS: 'In Progress',
            DONE: 'Done',
            CANCELLED: 'Cancelled',
            OVERDUE: 'Overdue'
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
            LOW: 'Low',
            MEDIUM: 'Medium',
            HIGH: 'High',
            URGENT: 'Urgent'
        };
        return texts[priority];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const isOverdue = (deadline: string | null) => {
        if (!deadline) return false;
        return new Date(deadline) < new Date();
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

    const resetSearch = () => {
        setSearchKeyword('');
        setSearchStatus('');
        setSearchPriority('');
        setSearchType('ALL');
        fetchTasks();
    };

    // Статистика задач
    const taskStats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'TODO').length,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        done: tasks.filter(t => t.status === 'DONE').length,
        overdue: tasks.filter(t => t.status === 'OVERDUE').length,
        cancelled: tasks.filter(t => t.status === 'CANCELLED').length
    };

    if (!currentUser) {
        return (
            <div className="auth-container">
                <style>{`
                    /* Стили остаются такими же как в предыдущей версии */
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Inter', sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .auth-container {
                        width: 100%;
                        max-width: 440px;
                        padding: 20px;
                    }
                    
                    .auth-card {
                        background: rgba(255, 255, 255, 0.95);
                        backdrop-filter: blur(20px);
                        border-radius: 24px;
                        padding: 40px;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                    }
                    
                    .auth-title {
                        text-align: center;
                        font-size: 2.5rem;
                        font-weight: 700;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        margin-bottom: 10px;
                    }
                    
                    .auth-subtitle {
                        text-align: center;
                        color: #6b7280;
                        margin-bottom: 30px;
                        font-weight: 500;
                    }
                    
                    .auth-form-group {
                        margin-bottom: 20px;
                    }
                    
                    .auth-label {
                        display: block;
                        margin-bottom: 8px;
                        font-weight: 500;
                        color: #374151;
                    }
                    
                    .auth-input {
                        width: 100%;
                        padding: 14px 16px;
                        border: 2px solid #e5e7eb;
                        border-radius: 12px;
                        font-size: 16px;
                        transition: all 0.3s ease;
                        background: white;
                    }
                    
                    .auth-input:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                        transform: translateY(-2px);
                    }
                    
                    .auth-button {
                        width: 100%;
                        padding: 16px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        margin-bottom: 15px;
                    }
                    
                    .auth-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                    }
                    
                    .auth-switch-button {
                        width: 100%;
                        padding: 14px;
                        background: transparent;
                        color: #667eea;
                        border: 2px solid #667eea;
                        border-radius: 12px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }
                    
                    .auth-switch-button:hover {
                        background: #667eea;
                        color: white;
                        transform: translateY(-2px);
                    }
                    
                    .alert-success {
                        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                        color: white;
                        padding: 16px;
                        border-radius: 12px;
                        margin-bottom: 20px;
                        text-align: center;
                        font-weight: 500;
                    }
                    
                    .alert-error {
                        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                        color: white;
                        padding: 16px;
                        border-radius: 12px;
                        margin-bottom: 20px;
                        text-align: center;
                        font-weight: 500;
                    }
                `}</style>

                <div className="auth-card">
                    <h1 className="auth-title">TaskFlow</h1>
                    <p className="auth-subtitle">{isLogin ? 'Sign in to your account' : 'Create new account'}</p>

                    {registrationSuccess && (
                        <div className="alert-success">
                            Registration successful! Please sign in.
                        </div>
                    )}
                    {authError && (
                        <div className="alert-error">
                            {authError}
                        </div>
                    )}

                    <form onSubmit={handleAuth}>
                        {!isLogin && (
                            <div className="auth-form-group">
                                <label className="auth-label">Username</label>
                                <input
                                    type="text"
                                    value={authForm.username}
                                    onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                                    className="auth-input"
                                    required
                                />
                            </div>
                        )}
                        <div className="auth-form-group">
                            <label className="auth-label">Email</label>
                            <input
                                type="email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                className="auth-input"
                                required
                            />
                        </div>
                        <div className="auth-form-group">
                            <label className="auth-label">Password</label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                className="auth-input"
                                required
                            />
                        </div>
                        <button type="submit" className="auth-button">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setAuthError('');
                                setRegistrationSuccess(false);
                            }}
                            className="auth-switch-button"
                        >
                            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    min-height: 100vh;
                }
                
                .app-container {
                    padding: 20px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                
                .app-header {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                
                .header-info h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin-bottom: 8px;
                }
                
                .header-info p {
                    color: #6b7280;
                    font-size: 1.1rem;
                    margin-bottom: 5px;
                }
                
                .service-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .status-online {
                    background: #10b981;
                    color: white;
                }
                
                .status-offline {
                    background: #ef4444;
                    color: white;
                }
                
                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
                
                .btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 14px;
                }
                
                .btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
                }
                
                .btn-success {
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    color: white;
                }
                
                .btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
                }
                
                .btn-danger {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    color: white;
                }
                
                .btn-danger:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
                }
                
                .btn-secondary {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                    color: white;
                }
                
                .btn-secondary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 25px rgba(107, 114, 128, 0.3);
                }
                
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none !important;
                    box-shadow: none !important;
                }
                
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                
                .stat-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 16px;
                    padding: 25px;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.3s ease;
                }
                
                .stat-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
                }
                
                .stat-number {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin-bottom: 8px;
                }
                
                .stat-label {
                    color: #6b7280;
                    font-weight: 500;
                    font-size: 0.9rem;
                }
                
                .actions-grid {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    margin-bottom: 30px;
                }
                
                .search-panel {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 25px;
                    margin-bottom: 30px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .search-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: #374151;
                }
                
                .search-tabs {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    margin-bottom: 20px;
                }
                
                .search-tab {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 10px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #f3f4f6;
                    color: #6b7280;
                }
                
                .search-tab.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                }
                
                .search-controls {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    align-items: end;
                }
                
                .form-group {
                    display: flex;
                    flex-direction: column;
                }
                
                .form-label {
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                    font-size: 14px;
                }
                
                .form-input, .form-select {
                    padding: 12px;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: white;
                    min-width: 150px;
                }
                
                .form-input:focus, .form-select:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .tasks-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 25px;
                }
                
                .task-card {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(20px);
                    border-radius: 20px;
                    padding: 25px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .task-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 6px;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                
                .task-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
                }
                
                .task-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 15px;
                }
                
                .task-title {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 8px;
                    line-height: 1.4;
                }
                
                .task-description {
                    color: #6b7280;
                    line-height: 1.5;
                    margin-bottom: 20px;
                }
                
                .task-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                
                .task-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }
                
                .status-badge, .priority-badge {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    color: white;
                }
                
                .deadline-warning {
                    color: #ef4444;
                    font-weight: 600;
                }
                
                .task-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                
                .task-actions .btn {
                    padding: 8px 16px;
                    font-size: 12px;
                }
                
                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    color: #6b7280;
                }
                
                .empty-state h3 {
                    font-size: 1.5rem;
                    margin-bottom: 10px;
                    color: #374151;
                }
                
                .alert {
                    padding: 16px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    text-align: center;
                    font-weight: 500;
                }
                
                .alert-error {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }
                
                .alert-warning {
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                    color: #d97706;
                    border: 1px solid #fcd34d;
                }
                
                .loading {
                    text-align: center;
                    padding: 40px;
                    color: #6b7280;
                    font-size: 1.1rem;
                }
                
                .loading::after {
                    content: '';
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e5e7eb;
                    border-top: 2px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-left: 10px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    backdrop-filter: blur(5px);
                }
                
                .modal {
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
                }
                
                .modal h3 {
                    font-size: 1.5rem;
                    margin-bottom: 20px;
                    color: #374151;
                    font-weight: 600;
                }
                
                .modal-actions {
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    margin-top: 25px;
                }
                
                @media (max-width: 768px) {
                    .app-container {
                        padding: 15px;
                    }
                    
                    .header-content {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .header-info h1 {
                        font-size: 2rem;
                    }
                    
                    .actions-grid {
                        flex-direction: column;
                    }
                    
                    .search-controls {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    
                    .tasks-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .modal {
                        width: 95%;
                        padding: 20px;
                    }
                }
            `}</style>

            {/* Header */}
            <header className="app-header">
                <div className="header-content">
                    <div className="header-info">
                        <h1>TaskFlow Dashboard</h1>
                        <p>Welcome back, {currentUser.username}!</p>
                        <div className={`service-status ${serviceStatus === 'ONLINE' ? 'status-online' : 'status-offline'}`}>
                            <div className="status-indicator"></div>
                            {serviceStatus === 'ONLINE' ? 'All Systems Operational' : 'Service Disruption'}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button onClick={handleLogout} className="btn btn-danger">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-number" style={{color: '#667eea'}}>{taskStats.total}</div>
                    <div className="stat-label">Total Tasks</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number" style={{color: '#667eea'}}>{taskStats.todo}</div>
                    <div className="stat-label">To Do</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number" style={{color: '#f093fb'}}>{taskStats.inProgress}</div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number" style={{color: '#4facfe'}}>{taskStats.done}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-number" style={{color: '#ff6b6b'}}>{taskStats.overdue}</div>
                    <div className="stat-label">Overdue</div>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="actions-grid">
                <button
                    onClick={() => setShowTaskForm(true)}
                    className="btn btn-primary"
                >
                    Create New Task
                </button>
                <button
                    onClick={handleSyncTasks}
                    className="btn btn-success"
                    disabled={loading}
                >
                    {loading ? 'Syncing...' : 'Sync Tasks'}
                </button>
                <button
                    onClick={resetSearch}
                    className="btn btn-secondary"
                    disabled={loading}
                >
                    Reset Search
                </button>
            </div>

            {/* Search Panel */}
            <div className="search-panel">
                <h3 className="search-title">Search & Filter Tasks</h3>

                <div className="search-tabs">
                    <button
                        className={`search-tab ${searchType === 'ALL' ? 'active' : ''}`}
                        onClick={() => setSearchType('ALL')}
                    >
                        All Tasks
                    </button>
                    <button
                        className={`search-tab ${searchType === 'STATUS' ? 'active' : ''}`}
                        onClick={() => setSearchType('STATUS')}
                    >
                        By Status
                    </button>
                    <button
                        className={`search-tab ${searchType === 'PRIORITY' ? 'active' : ''}`}
                        onClick={() => setSearchType('PRIORITY')}
                    >
                        By Priority
                    </button>
                    <button
                        className={`search-tab ${searchType === 'KEYWORD' ? 'active' : ''}`}
                        onClick={() => setSearchType('KEYWORD')}
                    >
                        By Keyword
                    </button>
                </div>

                <div className="search-controls">
                    {searchType === 'STATUS' && (
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                value={searchStatus}
                                onChange={(e) => setSearchStatus(e.target.value)}
                                className="form-select"
                            >
                                <option value="">Select Status</option>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="OVERDUE">Overdue</option>
                            </select>
                        </div>
                    )}

                    {searchType === 'PRIORITY' && (
                        <div className="form-group">
                            <label className="form-label">Priority</label>
                            <select
                                value={searchPriority}
                                onChange={(e) => setSearchPriority(e.target.value)}
                                className="form-select"
                            >
                                <option value="">Select Priority</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                    )}

                    {searchType === 'KEYWORD' && (
                        <div className="form-group">
                            <label className="form-label">Keyword</label>
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Search in titles and descriptions..."
                                className="form-input"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleSearch}
                        className="btn btn-primary"
                        disabled={loading || serviceStatus === 'OFFLINE'}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="search-panel">
                <h3 className="search-title">Quick Filters</h3>
                <div className="search-controls">
                    <div className="form-group">
                        <label className="form-label">Filter by Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="form-select"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="OVERDUE">Overdue</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Filter by Priority</label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="form-select"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className={`alert ${serviceStatus === 'OFFLINE' ? 'alert-warning' : 'alert-error'}`}>
                    {error}
                    {serviceStatus === 'OFFLINE' && (
                        <div style={{fontSize: '0.9rem', marginTop: '8px'}}>
                            Automatic retry in progress...
                        </div>
                    )}
                </div>
            )}

            {/* Tasks Grid */}
            {loading ? (
                <div className="loading">
                    Loading tasks...
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="empty-state">
                    <h3>No tasks found</h3>
                    <p>Create your first task or adjust your search criteria</p>
                </div>
            ) : (
                <div className="tasks-grid">
                    {filteredTasks.map((task) => (
                        <div key={task.id} className="task-card">
                            <div className="task-header">
                                <h3 className="task-title">{task.title}</h3>
                                <div className="task-meta-item">
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: getStatusColor(task.status) }}
                                    >
                                        {getStatusText(task.status)}
                                    </span>
                                </div>
                            </div>

                            {task.description && (
                                <p className="task-description">{task.description}</p>
                            )}

                            <div className="task-meta">
                                <div className="task-meta-item">
                                    <strong>Priority:</strong>
                                    <span
                                        className="priority-badge"
                                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                                    >
                                        {getPriorityText(task.priority)}
                                    </span>
                                </div>

                                {task.deadline && (
                                    <div className="task-meta-item">
                                        <strong>Deadline:</strong>
                                        <span className={isOverdue(task.deadline) ? 'deadline-warning' : ''}>
                                            {formatDate(task.deadline)}
                                            {isOverdue(task.deadline) && ' (Overdue)'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="task-actions">
                                <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                    className="form-select"
                                    style={{ fontSize: '12px', padding: '6px 8px' }}
                                    disabled={serviceStatus === 'OFFLINE'}
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>

                                <select
                                    value={task.priority}
                                    onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                                    className="form-select"
                                    style={{ fontSize: '12px', padding: '6px 8px' }}
                                    disabled={serviceStatus === 'OFFLINE'}
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>

                                <button
                                    onClick={() => startEditTask(task)}
                                    className="btn btn-secondary"
                                    disabled={serviceStatus === 'OFFLINE'}
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="btn btn-danger"
                                    disabled={serviceStatus === 'OFFLINE'}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Task Modal */}
            {showTaskForm && (
                <div className="modal-overlay" onClick={() => setShowTaskForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Create New Task</h3>
                        <form onSubmit={handleCreateTask}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className="form-input"
                                    placeholder="Enter task title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    className="form-input"
                                    placeholder="Enter task description"
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    value={taskForm.status}
                                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as Task['status'] })}
                                    className="form-select"
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    value={taskForm.priority}
                                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as Task['priority'] })}
                                    className="form-select"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deadline</label>
                                <input
                                    type="datetime-local"
                                    value={taskForm.deadline}
                                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskForm(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={creatingTask || serviceStatus === 'OFFLINE'}
                                >
                                    {creatingTask ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <div className="modal-overlay" onClick={() => setEditingTask(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Edit Task</h3>
                        <form onSubmit={handleUpdateTask}>
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    value={editingTask.title}
                                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    value={editingTask.description}
                                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                                    className="form-input"
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Status</label>
                                <select
                                    value={editingTask.status}
                                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as Task['status'] })}
                                    className="form-select"
                                >
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Priority</label>
                                <select
                                    value={editingTask.priority}
                                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                                    className="form-select"
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Deadline</label>
                                <input
                                    type="datetime-local"
                                    value={editingTask.deadline}
                                    onChange={(e) => setEditingTask({ ...editingTask, deadline: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setEditingTask(null)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={updatingTask || serviceStatus === 'OFFLINE'}
                                >
                                    {updatingTask ? 'Updating...' : 'Update Task'}
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