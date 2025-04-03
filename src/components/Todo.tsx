import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Square, Plus, Calendar, Clock, Filter, Search, Trash2, Edit, ArrowUp, ArrowDown, X, AlertCircle } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

interface Todo {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  userId: number;
  createdAt: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

const TodoArea: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showNewTodoForm, setShowNewTodoForm] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'createdAt'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);
  const { } = useTheme();

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      // Simulating API call with mock data
      const mockTodos: Todo[] = [
        {
          id: 1,
          title: 'Complete project proposal',
          description: 'Finalize the project proposal document with budget estimates and timeline',
          dueDate: '2025-04-05T17:00:00',
          completed: false,
          userId: 1,
          createdAt: '2025-04-01T09:30:00',
          priority: 'high',
          tags: ['work', 'project', 'urgent']
        },
        {
          id: 2,
          title: 'Review code pull requests',
          description: 'Review and approve pending pull requests from the development team',
          dueDate: '2025-04-03T16:00:00',
          completed: true,
          userId: 1,
          createdAt: '2025-04-02T10:15:00',
          priority: 'medium',
          tags: ['work', 'development']
        },
        {
          id: 3,
          title: 'Schedule team meeting',
          description: 'Arrange a team meeting to discuss project progress and roadblocks',
          dueDate: '2025-04-04T12:00:00',
          completed: false,
          userId: 1,
          createdAt: '2025-04-02T14:20:00',
          priority: 'medium',
          tags: ['work', 'meeting']
        },
        {
          id: 4,
          title: 'Buy groceries',
          description: 'Get milk, eggs, bread, and vegetables',
          dueDate: '2025-04-03T19:00:00',
          completed: false,
          userId: 1,
          createdAt: '2025-04-02T18:30:00',
          priority: 'low',
          tags: ['personal', 'shopping']
        },
        {
          id: 5,
          title: 'Prepare presentation for client meeting',
          description: 'Create slides for the upcoming client presentation on new features',
          dueDate: '2025-04-06T09:00:00',
          completed: false,
          userId: 1,
          createdAt: '2025-04-03T08:45:00',
          priority: 'high',
          tags: ['work', 'client', 'presentation']
        },
        {
          id: 6,
          title: 'Call dentist to schedule appointment',
          description: 'Schedule a check-up appointment with Dr. Smith',
          dueDate: '2025-04-05T12:00:00',
          completed: false,
          userId: 1,
          createdAt: '2025-04-03T10:00:00',
          priority: 'medium',
          tags: ['personal', 'health']
        },
        {
          id: 7,
          title: 'Fix UI bugs in dashboard',
          description: 'Address reported UI issues in the analytics dashboard',
          dueDate: '2025-04-04T17:00:00',
          completed: false,
          userId: 1,
          createdAt: '2025-04-03T11:30:00',
          priority: 'high',
          tags: ['work', 'bug', 'UI']
        }
      ];

      setTodos(mockTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTodoId !== null) {
        // Update existing todo - simulate API call
        const updatedTodo: Todo = {
          id: editingTodoId,
          title: newTodo.title,
          description: newTodo.description,
          dueDate: newTodo.dueDate,
          completed: todos.find(todo => todo.id === editingTodoId)?.completed || false,
          userId: 1,
          createdAt: todos.find(todo => todo.id === editingTodoId)?.createdAt || new Date().toISOString(),
          priority: newTodo.priority,
          tags: newTodo.tags
        };
        
        setTodos(prev => prev.map(todo => 
          todo.id === editingTodoId ? updatedTodo : todo
        ));
        setEditingTodoId(null);
      } else {
        // Create new todo - simulate API call
        const newTodoItem: Todo = {
          id: Math.max(...todos.map(t => t.id), 0) + 1,
          title: newTodo.title,
          description: newTodo.description,
          dueDate: newTodo.dueDate,
          completed: false,
          userId: 1,
          createdAt: new Date().toISOString(),
          priority: newTodo.priority,
          tags: newTodo.tags
        };
        
        setTodos(prev => [...prev, newTodoItem]);
      }
      
      setShowNewTodoForm(false);
      setNewTodo({ 
        title: '', 
        description: '', 
        dueDate: '',
        priority: 'medium',
        tags: []
      });
      setTagInput('');
    } catch (error) {
      console.error('Error with todo:', error);
    }
  };

  const toggleTodoStatus = async (todoId: number, completed: boolean) => {
    try {
      // Simulate API call
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, completed } : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (todoId: number) => {
    try {
      // Simulate API call
      setTodos(prev => prev.filter(todo => todo.id !== todoId));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setNewTodo({
      title: todo.title,
      description: todo.description,
      dueDate: todo.dueDate,
      priority: todo.priority || 'medium',
      tags: todo.tags || []
    });
    setShowNewTodoForm(true);
  };

  const addTag = () => {
    if (tagInput.trim() && !newTodo.tags.includes(tagInput.trim())) {
      setNewTodo(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
      tagInputRef.current?.focus();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewTodo(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const toggleSort = (sortField: 'dueDate' | 'priority' | 'createdAt') => {
    if (sortBy === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(sortField);
      setSortDirection('asc');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'bg-green-100 dark:bg-green-900/20';
      default: return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d, yyyy');
  };

  const getDueDateColor = (dateString: string) => {
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'text-red-600 dark:text-red-400';
    if (isToday(date)) return 'text-yellow-600 dark:text-yellow-400';
    if (isTomorrow(date)) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-500';
  };

  // Filter and sort todos
  const filteredAndSortedTodos = todos
    .filter(todo => {
      // Filter by status
      if (filterStatus === 'active' && todo.completed) return false;
      if (filterStatus === 'completed' && !todo.completed) return false;
      
      // Filter by priority
      if (filterPriority !== 'all' && todo.priority !== filterPriority) return false;
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          todo.title.toLowerCase().includes(query) ||
          todo.description.toLowerCase().includes(query) ||
          (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortBy === 'dueDate') {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortBy === 'priority') {
        const priorityMap = { high: 3, medium: 2, low: 1 };
        const priorityA = priorityMap[a.priority || 'medium'];
        const priorityB = priorityMap[b.priority || 'medium'];
        return sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      }
      
      if (sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      return 0;
    });

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold dark:text-dark-text-primary">Todo List</h2>
            <div className="ml-4 flex items-center text-sm">
              <span className="text-gray-500 dark:text-dark-text-secondary mr-2">
                {filteredAndSortedTodos.filter(t => !t.completed).length} active
              </span>
              <span className="text-gray-400 dark:text-dark-text-muted">
                {filteredAndSortedTodos.filter(t => t.completed).length} completed
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowNewTodoForm(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
          >
            <Plus size={20} />
            <span>New Task</span>
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-muted h-5 w-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg bg-gray-100 dark:bg-dark-bg border-transparent focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900/30 dark:text-dark-text-primary"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${showFilters 
                ? 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10' 
                : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg/50'}`}
            >
              <Filter size={18} />
              <span>Filters</span>
            </button>
            
            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-10 p-4 animate-fade-in">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Status</h4>
                  <div className="flex space-x-2">
                    {['all', 'active', 'completed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status as any)}
                        className={`px-3 py-1 rounded-full text-xs ${filterStatus === status 
                          ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' 
                          : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Priority</h4>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'high', 'medium', 'low'].map((priority) => (
                      <button
                        key={priority}
                        onClick={() => setFilterPriority(priority as any)}
                        className={`px-3 py-1 rounded-full text-xs ${filterPriority === priority 
                          ? getPriorityBgColor(priority) + ' ' + getPriorityColor(priority)
                          : 'bg-gray-100 dark:bg-dark-bg text-gray-700 dark:text-dark-text-secondary'}`}
                      >
                        {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">Sort By</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'dueDate', label: 'Due Date', icon: Calendar },
                      { id: 'priority', label: 'Priority', icon: AlertCircle },
                      { id: 'createdAt', label: 'Created Date', icon: Clock }
                    ].map((sortOption) => (
                      <button
                        key={sortOption.id}
                        onClick={() => toggleSort(sortOption.id as any)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-md ${sortBy === sortOption.id 
                          ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400' 
                          : 'hover:bg-gray-50 dark:hover:bg-dark-bg/50 text-gray-700 dark:text-dark-text-secondary'}`}
                      >
                        <div className="flex items-center">
                          <sortOption.icon size={16} className="mr-2" />
                          <span>{sortOption.label}</span>
                        </div>
                        {sortBy === sortOption.id && (
                          sortDirection === 'asc' 
                            ? <ArrowUp size={16} /> 
                            : <ArrowDown size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2 ml-auto">
            <button 
              onClick={() => toggleSort('dueDate')}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg/50 text-gray-700 dark:text-dark-text-secondary"
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Due Date</span>
              {sortBy === 'dueDate' && (
                sortDirection === 'asc' 
                  ? <ArrowUp size={16} /> 
                  : <ArrowDown size={16} />
              )}
            </button>
            
            <button 
              onClick={() => toggleSort('priority')}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg/50 text-gray-700 dark:text-dark-text-secondary"
            >
              <AlertCircle size={18} />
              <span className="hidden sm:inline">Priority</span>
              {sortBy === 'priority' && (
                sortDirection === 'asc' 
                  ? <ArrowUp size={16} /> 
                  : <ArrowDown size={16} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showNewTodoForm && (
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6 mb-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4 dark:text-dark-text-primary flex items-center">
              {editingTodoId !== null ? 'Edit Task' : 'Add New Task'}
              <button 
                onClick={() => {
                  setShowNewTodoForm(false);
                  setEditingTodoId(null);
                  setNewTodo({ 
                    title: '', 
                    description: '', 
                    dueDate: '',
                    priority: 'medium',
                    tags: []
                  });
                }}
                className="ml-auto text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-secondary"
              >
                <X size={20} />
              </button>
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Title</label>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Description</label>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Due Date</label>
                  <input
                    type="datetime-local"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Priority</label>
                  <div className="mt-1 flex space-x-2">
                    {['low', 'medium', 'high'].map((priority) => (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setNewTodo(prev => ({ ...prev, priority: priority as any }))}
                        className={`flex-1 py-2 rounded-md border ${newTodo.priority === priority 
                          ? getPriorityBgColor(priority) + ' border-transparent ' + getPriorityColor(priority) + ' font-medium'
                          : 'border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg/50'}`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newTodo.tags.map((tag) => (
                    <div 
                      key={tag} 
                      className="flex items-center bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-sm"
                    >
                      <span>{tag}</span>
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-purple-500 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    ref={tagInputRef}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    placeholder="Add a tag and press Enter"
                    className="flex-1 rounded-l-md border-gray-300 dark:border-dark-border dark:bg-dark-bg dark:text-dark-text-primary shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200 dark:focus:ring-purple-900/30"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-purple-600 text-white px-4 rounded-r-md hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTodoForm(false);
                    setEditingTodoId(null);
                    setNewTodo({ 
                      title: '', 
                      description: '', 
                      dueDate: '',
                      priority: 'medium',
                      tags: []
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-md text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                >
                  {editingTodoId !== null ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        )}

        {filteredAndSortedTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-purple-100 dark:bg-purple-900/20 p-4 rounded-full mb-4">
              <CheckSquare size={40} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 dark:text-dark-text-primary mb-2">
              {searchQuery ? 'No matching tasks found' : 'No tasks yet'}
            </h3>
            <p className="text-gray-500 dark:text-dark-text-secondary max-w-md">
              {searchQuery 
                ? 'Try adjusting your search or filters to find what you\'re looking for.'
                : 'Get started by adding your first task using the "New Task" button.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedTodos.map((todo) => (
              <div
                key={todo.id}
                className={`bg-white dark:bg-dark-card rounded-lg shadow-sm p-4 flex items-start transition-all duration-200 hover:shadow-md ${todo.completed ? 'opacity-75' : ''}`}
              >
                <button
                  onClick={() => toggleTodoStatus(todo.id, !todo.completed)}
                  className="mt-1 mr-3 flex-shrink-0"
                  aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {todo.completed ? (
                    <CheckSquare className="h-5 w-5 text-purple-600 dark:text-purple-500" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400 dark:text-dark-text-muted" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className={`text-lg font-medium ${todo.completed ? 'line-through text-gray-500 dark:text-dark-text-muted' : 'text-gray-900 dark:text-dark-text-primary'}`}>
                      {todo.title}
                    </h3>
                    <div className="flex space-x-1 ml-2">
                      <button 
                        onClick={() => handleEditTodo(todo)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text-secondary rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg/70"
                        aria-label="Edit task"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => deleteTodo(todo.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:text-dark-text-muted dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg/70"
                        aria-label="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {todo.description && (
                    <p className="text-gray-600 dark:text-dark-text-secondary mt-1 text-sm">{todo.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center mt-3 gap-3">
                    <div className={`flex items-center text-xs px-2 py-1 rounded-full ${getDueDateColor(todo.dueDate)}`}>
                      <Calendar size={14} className="mr-1" />
                      <span>{formatDueDate(todo.dueDate)}</span>
                      <span className="ml-1 text-gray-500 dark:text-dark-text-muted">
                        {format(new Date(todo.dueDate), 'h:mm a')}
                      </span>
                    </div>
                    
                    {todo.priority && (
                      <div className={`flex items-center text-xs px-2 py-1 rounded-full ${getPriorityBgColor(todo.priority)} ${getPriorityColor(todo.priority)}`}>
                        <AlertCircle size={14} className="mr-1" />
                        <span>{todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}</span>
                      </div>
                    )}
                    
                    {todo.tags && todo.tags.map(tag => (
                      <div 
                        key={tag}
                        className="bg-purple-100 dark:bg-purple-900/10 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs"
                      >
                        <span>{tag}</span>
                      </div>
                    ))}
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

export default TodoArea;