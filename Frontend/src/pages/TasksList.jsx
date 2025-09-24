import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckSquare,
  Square,
  Calendar,
  Tag,
  AlertCircle
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import debounce from 'lodash.debounce'

const TasksList = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    completed: '',
    priority: '',
    sort: 'createdAt:desc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const queryClient = useQueryClient()

  // Debounced filter setter
  const debouncedSetFilter = useMemo(
    () =>
      debounce((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
      }, 300),
    []
  )

  // Fetch tasks (React Query v5 object syntax)
  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })
      const res = await api.get(`/tasks?${params.toString()}`)
      return res.data.data
    },
    keepPreviousData: true
  })

  // Toggle task completion (Optimistic, v5 syntax)
  const toggleTaskMutation = useMutation({
    mutationFn: async (taskId) => await api.post(`/tasks/${taskId}/toggle`),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', filters] })
      const previousTasks = queryClient.getQueryData({ queryKey: ['tasks', filters] })
      queryClient.setQueryData({ queryKey: ['tasks', filters] }, oldData => ({
        ...oldData,
        tasks: oldData.tasks.map(task =>
          task._id === taskId ? { ...task, completed: !task.completed } : task
        )
      }))
      return { previousTasks }
    },
    onError: (err, taskId, context) => {
      queryClient.setQueryData({ queryKey: ['tasks', filters] }, context.previousTasks)
      toast.error('Failed to update task')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      toast.success('Task updated!')
    }
  })

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => await api.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', filters] })
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      toast.success('Task deleted!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete task')
    }
  })

  const tasks = data?.tasks || []
  const pagination = data?.pagination || {}

  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      debouncedSetFilter(key, value)
    } else {
      setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
    }
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const handleToggleTask = (taskId) => toggleTaskMutation.mutate(taskId)
  const handleDeleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(taskId)
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading tasks</h3>
        <p className="mt-1 text-sm text-gray-500">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage your tasks and stay organized.</p>
        </div>
        <Link
          to="/tasks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                defaultValue={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="createdAt:desc">Newest first</option>
              <option value="createdAt:asc">Oldest first</option>
              <option value="dueDate:asc">Due date (earliest)</option>
              <option value="dueDate:desc">Due date (latest)</option>
              <option value="priority:desc">Priority (high to low)</option>
              <option value="priority:asc">Priority (low to high)</option>
              <option value="title:asc">Title (A-Z)</option>
            </select>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.completed}
                onChange={(e) => handleFilterChange('completed', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All tasks</option>
                <option value="false">Incomplete</option>
                <option value="true">Completed</option>
              </select>

              <input
                type="text"
                placeholder="Filter by category..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              />

              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All priorities</option>
                <option value="5">High (5)</option>
                <option value="4">High (4)</option>
                <option value="3">Medium (3)</option>
                <option value="2">Low (2)</option>
                <option value="1">Low (1)</option>
              </select>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first task.
              </p>
              <div className="mt-6">
                <Link
                  to="/tasks/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Link>
              </div>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task._id}
                task={task}
                onToggle={handleToggleTask}
                onDelete={handleDeleteTask}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm border rounded-md ${
                    page === pagination.currentPage
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Task Row Component
const TaskRow = ({ task, onToggle, onDelete }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task._id)}
          className="flex-shrink-0 text-gray-400 hover:text-indigo-600"
        >
          {task.completed ? (
            <CheckSquare className="h-5 w-5 text-green-600" />
          ) : (
            <Square className="h-5 w-5" />
          )}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className={`text-sm font-medium truncate ${
              task.completed ? 'text-gray-500 line-through' : 
              isOverdue ? 'text-red-600' : 'text-gray-900'
            }`}>
              {task.title}
            </h3>

            {task.priority > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                High
              </span>
            )}

            {isOverdue && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </span>
            )}
          </div>

          {/* Task meta */}
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
            {task.category && (
              <div className="flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                {task.category}
              </div>
            )}

            {task.dueDate && (
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </div>
            )}

            {task.estimatedDuration && (
              <div className="flex items-center">
                <span>{task.estimatedDuration}min</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Link
            to={`/tasks/${task._id}/edit`}
            className="text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <Edit className="h-4 w-4" />
          </Link>

          <button
            onClick={() => onDelete(task._id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TasksList
