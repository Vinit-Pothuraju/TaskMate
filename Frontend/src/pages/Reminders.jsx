// frontend/src/pages/Reminders.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns'
import {
  Plus,
  Bell,
  Calendar,
  Clock,
  Repeat,
  Edit,
  Trash2,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const Reminders = () => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: 'all' })
  const queryClient = useQueryClient()

  // ---------------- Fetch Reminders ----------------
  const { data: remindersData, isLoading } = useQuery({
    queryKey: ['reminders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.status === 'upcoming') params.set('upcoming', 'true')
      const res = await api.get(`/reminders?${params.toString()}`)
      return res.data.data
    },
    keepPreviousData: true
  })

  // ---------------- Delete Reminder ----------------
  const deleteReminderMutation = useMutation({
    mutationFn: (reminderId) => api.delete(`/reminders/${reminderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      toast.success('Reminder deleted!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete reminder')
    }
  })

  const reminders = remindersData?.reminders || []

  const filteredReminders = reminders.filter((reminder) => {
    const now = new Date()
    const reminderDate = new Date(reminder.when)
    if (filters.status === 'upcoming') return isFuture(reminderDate) && !reminder.delivered
    if (filters.status === 'delivered') return reminder.delivered
    if (filters.status === 'overdue') return isPast(reminderDate) && !reminder.delivered
    return true
  })

  const handleDeleteReminder = (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      deleteReminderMutation.mutate(reminderId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading reminders...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-600">Stay on top of important tasks and events</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Reminder
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reminders..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Reminders</option>
          <option value="upcoming">Upcoming</option>
          <option value="delivered">Delivered</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Reminders List */}
      <div className="bg-white shadow rounded-lg">
        {filteredReminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.status === 'all' ? "Get started by creating your first reminder." : `No ${filters.status} reminders at this time.`}
            </p>
            {filters.status === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Reminder
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReminders.map((reminder) => (
              <ReminderItem key={reminder._id} reminder={reminder} onEdit={setEditingReminder} onDelete={handleDeleteReminder} />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReminder) && (
        <ReminderModal
          reminder={editingReminder}
          onClose={() => {
            setShowCreateModal(false)
            setEditingReminder(null)
          }}
        />
      )}
    </div>
  )
}

// ---------------- Reminder Item ----------------
const ReminderItem = ({ reminder, onEdit, onDelete }) => {
  const reminderDate = new Date(reminder.when)
  const now = new Date()
  const isOverdue = isPast(reminderDate) && !reminder.delivered

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-medium text-gray-900 truncate">{reminder.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${reminder.delivered ? 'text-green-700 bg-green-100' : isOverdue ? 'text-red-700 bg-red-100' : 'text-blue-700 bg-blue-100'}`}>
              {reminder.delivered ? <CheckCircle className="h-3 w-3 mr-1" /> : isOverdue ? <AlertCircle className="h-3 w-3 mr-1" /> : <Bell className="h-3 w-3 mr-1" />}
              {reminder.delivered ? 'Delivered' : isOverdue ? 'Overdue' : 'Upcoming'}
            </span>
            {reminder.recurring?.enabled && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-purple-700 bg-purple-100"><Repeat className="h-3 w-3 mr-1" />Recurring</span>}
          </div>
          {reminder.message && <p className="text-gray-600 mb-3 line-clamp-2">{reminder.message}</p>}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center"><Calendar className="h-4 w-4 mr-1" />{format(reminderDate, 'MMM d, yyyy')}</div>
            <div className="flex items-center"><Clock className="h-4 w-4 mr-1" />{format(reminderDate, 'h:mm a')}</div>
            <div className="flex items-center">{isPast(reminderDate) ? <span className={reminder.delivered ? 'text-green-600' : 'text-red-600'}>{formatDistanceToNow(reminderDate)} ago</span> : <span className="text-blue-600">in {formatDistanceToNow(reminderDate)}</span>}</div>
          </div>
          {reminder.recurring?.enabled && <div className="mt-2 text-xs text-purple-600">Repeats {reminder.recurring.pattern}{reminder.recurring.endDate && <span> until {format(new Date(reminder.recurring.endDate), 'MMM d, yyyy')}</span>}</div>}
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <button onClick={() => onEdit(reminder)} className="text-gray-400 hover:text-indigo-600 transition-colors"><Edit className="h-5 w-5" /></button>
          <button onClick={() => onDelete(reminder._id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  )
}

// ---------------- Reminder Modal ----------------
const ReminderModal = ({ reminder, onClose }) => {
  const queryClient = useQueryClient()
  const isEditing = !!reminder

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: reminder?.title || '',
      message: reminder?.message || '',
      when: reminder?.when ? new Date(reminder.when).toISOString().slice(0, 16) : '',
      recurring: { enabled: reminder?.recurring?.enabled || false, pattern: reminder?.recurring?.pattern || 'daily', endDate: reminder?.recurring?.endDate ? new Date(reminder.recurring.endDate).toISOString().slice(0, 10) : '' }
    }
  })

  const watchRecurring = watch('recurring.enabled')

  const saveReminderMutation = useMutation({
    mutationFn: (data) => isEditing ? api.put(`/reminders/${reminder._id}`, data) : api.post('/reminders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      toast.success(`Reminder ${isEditing ? 'updated' : 'created'} successfully!`)
      onClose()
    },
    onError: (error) => toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} reminder`)
  })

  const onSubmit = (data) => {
    const reminderData = {
      ...data,
      when: new Date(data.when).toISOString(),
      recurring: data.recurring.enabled ? { enabled: true, pattern: data.recurring.pattern, endDate: data.recurring.endDate ? new Date(data.recurring.endDate).toISOString() : null } : { enabled: false }
    }
    saveReminderMutation.mutate(reminderData)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">{isEditing ? 'Edit Reminder' : 'New Reminder'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input {...register('title', { required: 'Title is required', maxLength: { value: 200, message: 'Title cannot exceed 200 characters' } })} type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter reminder title..." />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea {...register('message', { maxLength: { value: 500, message: 'Message cannot exceed 500 characters' } })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Optional reminder message..." />
            {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input {...register('when', { required: 'Date and time are required' })} type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {errors.when && <p className="mt-1 text-sm text-red-600">{errors.when.message}</p>}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <input {...register('recurring.enabled')} type="checkbox" id="recurring" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
              <label htmlFor="recurring" className="text-sm font-medium text-gray-700">Repeat this reminder</label>
            </div>
            {watchRecurring && (
              <div className="space-y-3 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Pattern</label>
                  <select {...register('recurring.pattern')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                  <input {...register('recurring.endDate')} type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <p className="mt-1 text-xs text-gray-500">Leave empty to repeat indefinitely</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={saveReminderMutation.isLoading} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saveReminderMutation.isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
              {isEditing ? 'Update' : 'Create'} Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Reminders
