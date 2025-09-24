import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Save, ArrowLeft, Calendar, Tag, Clock, X } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const TaskEditor = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = Boolean(id)

  const [newTag, setNewTag] = useState('')

  // Form setup
  const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priority: 3,
      dueDate: '',
      tags: [],
      estimatedDuration: ''
    }
  })

  const watchedTags = watch('tags')

  // Fetch task for editing
  useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const res = await api.get(`/tasks/${id}`)
      return res.data.data.task
    },
    enabled: isEditing,
    onSuccess: (task) => {
      if (!task) return
      Object.entries(task).forEach(([key, value]) => {
        if (key === 'dueDate' && value) {
          setValue(key, new Date(value).toISOString().slice(0, 16))
        } else if (key === 'tags') {
          setValue(key, value || [])
        } else {
          setValue(key, value)
        }
      })
    }
  })

  // Create or update task mutation
  const saveTaskMutation = useMutation({
    mutationFn: async (taskPayload) => {
      return isEditing
        ? api.put(`/tasks/${id}`, taskPayload)
        : api.post('/tasks', taskPayload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task-stats'] })
      if (isEditing) queryClient.invalidateQueries({ queryKey: ['task', id] })
      toast.success(`Task ${isEditing ? 'updated' : 'created'} successfully!`)
      navigate('/tasks')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} task`)
    }
  })

  const onSubmit = (data) => {
    const payload = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      estimatedDuration: data.estimatedDuration ? parseInt(data.estimatedDuration) : null,
      priority: parseInt(data.priority)
    }
    saveTaskMutation.mutate(payload)
  }

  const addTag = () => {
    const trimmedTag = newTag.trim()
    if (trimmedTag && !watchedTags.includes(trimmedTag)) {
      setValue('tags', [...watchedTags, trimmedTag], { shouldDirty: true })
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove), { shouldDirty: true })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Task' : 'New Task'}
            </h1>
            <p className="text-gray-600">
              {isEditing ? 'Update task details' : 'Create a new task to stay organized'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg">
        <div className="px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              {...register('title', {
                required: 'Title is required',
                maxLength: { value: 200, message: 'Title cannot exceed 200 characters' }
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter task title..."
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              {...register('description', { maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' } })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter task description..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                {...register('category', { maxLength: { value: 50, message: 'Category cannot exceed 50 characters' } })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Work, Personal, Study"
              />
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>
                    {n} - {['Very Low', 'Low', 'Medium', 'High', 'Very High'][n-1]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date & Estimated Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" /> Due Date
              </label>
              <input
                {...register('dueDate')}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" /> Estimated Duration (minutes)
              </label>
              <input
                {...register('estimatedDuration', {
                  min: { value: 1, message: 'Duration must be at least 1 minute' },
                  max: { value: 480, message: 'Duration cannot exceed 480 minutes' }
                })}
                type="number"
                min="1"
                max="480"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 30"
              />
              {errors.estimatedDuration && <p className="mt-1 text-sm text-red-600">{errors.estimatedDuration.message}</p>}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4 inline mr-1" /> Tags
            </label>

            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {watchedTags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-2 text-indigo-600 hover:text-indigo-800">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add a tag..."
                maxLength={30}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={saveTaskMutation.isLoading || (!isDirty && isEditing)}
            className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveTaskMutation.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isEditing ? 'Update Task' : 'Create Task'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskEditor
