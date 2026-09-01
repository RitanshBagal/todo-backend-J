/**
 * Todo - Modern Task Management Application (Vanilla JavaScript)
 * Communicates with the Spring Boot REST API endpoints.
 */

(function () {
    'use strict';

    // State
    const state = {
        todos: [],
        currentFilter: 'all', // 'all' | 'pending' | 'completed'
        searchQuery: '',
        searchDebounceTimeout: null,
        pendingDeleteAction: null
    };

    // DOM Elements
    const elements = {
        todoListContainer: document.getElementById('todo-list-container'),
        emptyState: document.getElementById('empty-state'),
        emptyTitle: document.getElementById('empty-title'),
        emptySubtitle: document.getElementById('empty-subtitle'),
        loadingSpinner: document.getElementById('loading-spinner'),
        toastContainer: document.getElementById('toast-container'),

        // Theme Toggle Elements
        themeToggleBtn: document.getElementById('theme-toggle-btn'),
        themeIconSun: document.getElementById('theme-icon-sun'),
        themeIconMoon: document.getElementById('theme-icon-moon'),

        // Stats
        statTotal: document.getElementById('stat-total'),
        statPending: document.getElementById('stat-pending'),
        statCompleted: document.getElementById('stat-completed'),
        statPercentage: document.getElementById('stat-percentage'),
        statProgressBar: document.getElementById('stat-progress-bar'),

        // Badges
        badgeAll: document.getElementById('badge-all'),
        badgePending: document.getElementById('badge-pending'),
        badgeCompleted: document.getElementById('badge-completed'),

        // Filter Buttons
        filterAll: document.getElementById('filter-all'),
        filterPending: document.getElementById('filter-pending'),
        filterCompleted: document.getElementById('filter-completed'),

        // Search
        searchInput: document.getElementById('search-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),

        // Create Form
        createForm: document.getElementById('create-todo-form'),
        newTitle: document.getElementById('new-todo-title'),
        newDesc: document.getElementById('new-todo-desc'),
        newCompleted: document.getElementById('new-todo-completed'),
        createBtn: document.getElementById('create-btn'),

        // Edit Modal
        editModal: document.getElementById('edit-modal'),
        editForm: document.getElementById('edit-todo-form'),
        editId: document.getElementById('edit-todo-id'),
        editTitle: document.getElementById('edit-todo-title'),
        editDesc: document.getElementById('edit-todo-desc'),
        editCompleted: document.getElementById('edit-todo-completed'),

        // Delete Modal
        deleteModal: document.getElementById('delete-modal'),
        deleteTitle: document.getElementById('delete-modal-title'),
        deleteDesc: document.getElementById('delete-modal-desc'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn')
    };

    // Theme Management
    function initTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        updateThemeIcons(isDark);
    }

    function updateThemeIcons(isDark) {
        if (!elements.themeIconSun || !elements.themeIconMoon) return;
        if (isDark) {
            elements.themeIconSun.classList.remove('hidden');
            elements.themeIconMoon.classList.add('hidden');
        } else {
            elements.themeIconSun.classList.add('hidden');
            elements.themeIconMoon.classList.remove('hidden');
        }
    }

    function toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('todo_theme', isDark ? 'dark' : 'light');
        updateThemeIcons(isDark);
        showToast(isDark ? 'Switched to dark theme' : 'Switched to light theme', 'info');
    }

    // API Service
    const API = {
        async getTodos(completed, search) {
            const params = new URLSearchParams();
            if (completed !== null && completed !== undefined) {
                params.append('completed', completed);
            }
            if (search && search.trim() !== '') {
                params.append('search', search.trim());
            }
            const query = params.toString() ? `?${params.toString()}` : '';
            const res = await fetch(`/api/todos${query}`);
            if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.statusText}`);
            return await res.json();
        },

        async createTodo(payload) {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create task');
            }
            return await res.json();
        },

        async updateTodo(id, payload) {
            const res = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update task');
            }
            return await res.json();
        },

        async toggleTodo(id) {
            const res = await fetch(`/api/todos/${id}/toggle`, {
                method: 'PATCH'
            });
            if (!res.ok) throw new Error('Failed to toggle task status');
            return await res.json();
        },

        async deleteTodo(id) {
            const res = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete task');
            return true;
        },

        async deleteAllTodos() {
            const res = await fetch('/api/todos', {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete all tasks');
            return true;
        }
    };

    // Helper: Escape HTML to avoid XSS
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Helper: Format Date
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }

    // Toast Notification System
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-lg border text-xs font-medium transform transition-all duration-300 translate-y-2 opacity-0';

        let iconSvg = '';
        if (type === 'success') {
            toast.classList.add('bg-white', 'dark:bg-slate-800', 'border-emerald-200', 'dark:border-emerald-800', 'text-slate-800', 'dark:text-slate-100');
            iconSvg = `<div class="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>`;
        } else if (type === 'error') {
            toast.classList.add('bg-white', 'dark:bg-slate-800', 'border-rose-200', 'dark:border-rose-800', 'text-slate-800', 'dark:text-slate-100');
            iconSvg = `<div class="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>`;
        } else {
            toast.classList.add('bg-white', 'dark:bg-slate-800', 'border-blue-200', 'dark:border-blue-800', 'text-slate-800', 'dark:text-slate-100');
            iconSvg = `<div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>`;
        }

        toast.innerHTML = `
            <div class="flex items-center gap-2.5">
                ${iconSvg}
                <span>${escapeHtml(message)}</span>
            </div>
            <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 ml-3 p-0.5 rounded-md" onclick="this.parentElement.remove()">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        `;

        let container = elements.toastContainer || document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none';
            document.body.appendChild(container);
            elements.toastContainer = container;
        }
        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        // Auto remove after 3.5s
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // Update Statistics & Filter Counts
    function updateStats() {
        const total = state.todos.length;
        const completed = state.todos.filter(t => t.completed).length;
        const pending = total - completed;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        elements.statTotal.textContent = total;
        elements.statPending.textContent = pending;
        elements.statCompleted.textContent = completed;
        elements.statPercentage.textContent = `${percentage}%`;
        elements.statProgressBar.style.width = `${percentage}%`;

        elements.badgeAll.textContent = total;
        elements.badgePending.textContent = pending;
        elements.badgeCompleted.textContent = completed;
    }

    // Render Todo List
    function renderTodos() {
        updateStats();

        // Apply filtering and search
        let filtered = state.todos.filter(todo => {
            // Filter tab
            if (state.currentFilter === 'pending' && todo.completed) return false;
            if (state.currentFilter === 'completed' && !todo.completed) return false;

            // Search query
            if (state.searchQuery.trim() !== '') {
                const q = state.searchQuery.trim().toLowerCase();
                const matchTitle = todo.title && todo.title.toLowerCase().includes(q);
                const matchDesc = todo.description && todo.description.toLowerCase().includes(q);
                return matchTitle || matchDesc;
            }
            return true;
        });

        elements.todoListContainer.innerHTML = '';

        if (filtered.length === 0) {
            elements.emptyState.classList.remove('hidden');
            if (state.searchQuery.trim() !== '') {
                elements.emptyTitle.textContent = 'No matching tasks';
                elements.emptySubtitle.textContent = `No tasks found matching "${state.searchQuery}". Try clearing search.`;
            } else if (state.currentFilter === 'pending') {
                elements.emptyTitle.textContent = 'All caught up!';
                elements.emptySubtitle.textContent = 'You have no pending tasks. Great job!';
            } else if (state.currentFilter === 'completed') {
                elements.emptyTitle.textContent = 'No completed tasks yet';
                elements.emptySubtitle.textContent = 'Check off tasks as you finish them to see them here.';
            } else {
                elements.emptyTitle.textContent = 'No tasks found';
                elements.emptySubtitle.textContent = 'Get started by creating your first task above.';
            }
            return;
        }

        elements.emptyState.classList.add('hidden');

        filtered.forEach(todo => {
            const card = document.createElement('div');
            card.className = `todo-enter bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border ${
                todo.completed
                    ? 'border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40'
                    : 'border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-md'
            } flex items-start gap-3 sm:gap-4 transition-all group`;

            card.innerHTML = `
                <!-- Checkbox -->
                <button type="button" onclick="window.app.toggleTodo(${todo.id})"
                    title="${todo.completed ? 'Mark as pending' : 'Mark as completed'}"
                    class="mt-1 flex-shrink-0 w-5 h-5 rounded-lg border ${
                        todo.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-brand-500 bg-white dark:bg-slate-900 text-transparent'
                    } flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    <svg class="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                </button>

                <!-- Details -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="text-sm font-semibold ${
                            todo.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                        } break-words">
                            ${escapeHtml(todo.title)}
                        </h4>
                        ${
                            todo.completed
                                ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">Completed</span>`
                                : `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">In Progress</span>`
                        }
                    </div>

                    ${
                        todo.description
                            ? `<p class="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line ${
                                  todo.completed ? 'line-through text-slate-300 dark:text-slate-600' : ''
                              }">${escapeHtml(todo.description)}</p>`
                            : ''
                    }

                    <div class="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                        <span class="flex items-center gap-1">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            ${formatDate(todo.createdAt)}
                        </span>
                        ${
                            todo.updatedAt && todo.updatedAt !== todo.createdAt
                                ? `<span class="hidden sm:inline">&bull; Updated: ${formatDate(todo.updatedAt)}</span>`
                                : ''
                        }
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button type="button" onclick="window.app.openEditModal(${todo.id})"
                        title="Edit Task"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors cursor-pointer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button type="button" onclick="window.app.promptDeleteTodo(${todo.id}, '${escapeHtml(todo.title)}')"
                        title="Delete Task"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            `;

            elements.todoListContainer.appendChild(card);
        });
    }

    // Load Todos from API
    async function loadTodos() {
        elements.loadingSpinner.classList.remove('hidden');
        try {
            state.todos = await API.getTodos(null, null);
            renderTodos();
        } catch (err) {
            showToast(err.message || 'Error loading tasks', 'error');
        } finally {
            elements.loadingSpinner.classList.add('hidden');
        }
    }

    // Create Todo
    async function handleCreateTodo() {
        const title = elements.newTitle.value.trim();
        const description = elements.newDesc.value.trim();
        const completed = elements.newCompleted.checked;

        if (!title) {
            showToast('Task title is required', 'error');
            elements.newTitle.focus();
            return;
        }

        elements.createBtn.disabled = true;
        try {
            const created = await API.createTodo({
                title,
                description: description || null,
                completed
            });
            state.todos.unshift(created);
            renderTodos();
            showToast('Task created successfully!', 'success');

            // Reset form
            elements.createForm.reset();
            elements.newTitle.focus();
        } catch (err) {
            showToast(err.message || 'Failed to create task', 'error');
        } finally {
            elements.createBtn.disabled = false;
        }
    }

    // Toggle Todo Status
    async function toggleTodo(id) {
        try {
            const updated = await API.toggleTodo(id);
            const index = state.todos.findIndex(t => t.id === id);
            if (index !== -1) {
                state.todos[index] = updated;
                renderTodos();
                showToast(
                    updated.completed ? 'Task marked as completed!' : 'Task moved to in progress',
                    'success'
                );
            }
        } catch (err) {
            showToast(err.message || 'Error toggling task', 'error');
        }
    }

    // Open Edit Modal
    function openEditModal(id) {
        const todo = state.todos.find(t => t.id === id);
        if (!todo) return;

        elements.editId.value = todo.id;
        elements.editTitle.value = todo.title;
        elements.editDesc.value = todo.description || '';
        elements.editCompleted.checked = todo.completed;

        elements.editModal.classList.remove('hidden');
        elements.editTitle.focus();
    }

    // Close Edit Modal
    function closeEditModal() {
        elements.editModal.classList.add('hidden');
    }

    // Save Edit
    async function handleSaveEdit() {
        const id = parseInt(elements.editId.value, 10);
        const title = elements.editTitle.value.trim();
        const description = elements.editDesc.value.trim();
        const completed = elements.editCompleted.checked;

        if (!title) {
            showToast('Title cannot be empty', 'error');
            elements.editTitle.focus();
            return;
        }

        try {
            const updated = await API.updateTodo(id, {
                title,
                description: description || null,
                completed
            });

            const index = state.todos.findIndex(t => t.id === id);
            if (index !== -1) {
                state.todos[index] = updated;
                renderTodos();
                closeEditModal();
                showToast('Task updated successfully!', 'success');
            }
        } catch (err) {
            showToast(err.message || 'Failed to update task', 'error');
        }
    }

    // Open Delete Single Todo Modal
    function promptDeleteTodo(id, title) {
        state.pendingDeleteAction = async () => {
            try {
                await API.deleteTodo(id);
                state.todos = state.todos.filter(t => t.id !== id);
                renderTodos();
                closeDeleteModal();
                showToast('Task deleted', 'info');
            } catch (err) {
                showToast(err.message || 'Failed to delete task', 'error');
            }
        };

        elements.deleteTitle.textContent = 'Delete Task?';
        elements.deleteDesc.textContent = `Are you sure you want to delete "${title}"? This cannot be undone.`;
        elements.deleteModal.classList.remove('hidden');
    }

    // Open Delete All Modal
    function promptDeleteAll() {
        if (state.todos.length === 0) {
            showToast('No tasks to delete', 'info');
            return;
        }

        state.pendingDeleteAction = async () => {
            try {
                await API.deleteAllTodos();
                state.todos = [];
                renderTodos();
                closeDeleteModal();
                showToast('All tasks deleted', 'info');
            } catch (err) {
                showToast(err.message || 'Failed to delete tasks', 'error');
            }
        };

        elements.deleteTitle.textContent = 'Delete All Tasks?';
        elements.deleteDesc.textContent = `This will permanently delete all ${state.todos.length} task(s). Are you sure?`;
        elements.deleteModal.classList.remove('hidden');
    }

    // Close Delete Modal
    function closeDeleteModal() {
        state.pendingDeleteAction = null;
        elements.deleteModal.classList.add('hidden');
    }

    // Filter Handling
    function setFilter(filter) {
        state.currentFilter = filter;

        // Update button styles
        [elements.filterAll, elements.filterPending, elements.filterCompleted].forEach(btn => {
            btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-xs');
            btn.classList.add('text-slate-600', 'dark:text-slate-400');
        });

        let activeBtn = elements.filterAll;
        if (filter === 'pending') activeBtn = elements.filterPending;
        if (filter === 'completed') activeBtn = elements.filterCompleted;

        activeBtn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-900', 'dark:text-white', 'shadow-xs');
        activeBtn.classList.remove('text-slate-600', 'dark:text-slate-400');

        renderTodos();
    }

    // Search Handling
    function handleSearch(query) {
        state.searchQuery = query;
        if (query.trim() !== '') {
            elements.clearSearchBtn.classList.remove('hidden');
        } else {
            elements.clearSearchBtn.classList.add('hidden');
        }

        clearTimeout(state.searchDebounceTimeout);
        state.searchDebounceTimeout = setTimeout(() => {
            renderTodos();
        }, 150);
    }

    function clearSearch() {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.classList.add('hidden');
        renderTodos();
    }

    // Bind Event Listeners
    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener('click', () => {
            if (typeof state.pendingDeleteAction === 'function') {
                state.pendingDeleteAction();
            }
        });
    }

    // Close modals on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.editModal) closeEditModal();
            if (elements.deleteModal) closeDeleteModal();
        }
    });

    // Close modal when clicking outside backdrop
    if (elements.editModal) {
        elements.editModal.addEventListener('click', (e) => {
            if (e.target === elements.editModal) closeEditModal();
        });
    }
    if (elements.deleteModal) {
        elements.deleteModal.addEventListener('click', (e) => {
            if (e.target === elements.deleteModal) closeDeleteModal();
        });
    }

    // Expose app methods to global scope for HTML inline handlers
    window.app = {
        toggleTheme,
        loadTodos,
        handleCreateTodo,
        toggleTodo,
        openEditModal,
        closeEditModal,
        handleSaveEdit,
        promptDeleteTodo,
        promptDeleteAll,
        closeDeleteModal,
        setFilter,
        handleSearch,
        clearSearch,
        showToast
    };

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        initTheme();
        if (elements.todoListContainer) {
            loadTodos();
        }
    });
})();
