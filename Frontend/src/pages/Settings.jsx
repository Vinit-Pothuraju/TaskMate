// frontend/src/pages/Settings.jsx
import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import {
  User,
  Clock,
  Bell,
  Shield,
  Palette,
  Download,
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  Check
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'focus', name: 'Focus Settings', icon: Clock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'preferences', name: 'Preferences', icon: Palette },
    { id: 'data', name: 'Data & Privacy', icon: Download }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-200">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'focus' && <FocusSettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'preferences' && <PreferencesSettings />}
            {activeTab === 'data' && <DataPrivacySettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- PROFILE SETTINGS ----------------
const ProfileSettings = () => {
  const { user, updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: { name: user?.name || '', email: user?.email || '' }
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/auth/profile', data),
    onSuccess: (response) => {
      updateUser(response.data.data.user)
      queryClient.invalidateQueries(['user'])
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    }
  })

  const onSubmit = (data) => updateProfileMutation.mutate(data)

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
      <p className="text-sm text-gray-600">Update your personal information.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 2, message: 'Name must be at least 2 characters' }
            })}
            type="text"
            className="input-field"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <input {...register('email')} type="email" className="input-field bg-gray-50" readOnly />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || updateProfileMutation.isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateProfileMutation.isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------------- FOCUS SETTINGS ----------------
const FocusSettings = () => {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      workDuration: user?.settings?.focusDefaults?.work || 25,
      shortBreak: user?.settings?.focusDefaults?.shortBreak || 5,
      longBreak: user?.settings?.focusDefaults?.longBreak || 15
    }
  })

  const updateFocusSettingsMutation = useMutation({
    mutationFn: (data) => api.put('/auth/profile', { settings: { ...user.settings, focusDefaults: data } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user'])
      toast.success('Focus settings updated!')
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update settings')
  })

  const onSubmit = (data) => {
    updateFocusSettingsMutation.mutate({
      work: parseInt(data.workDuration),
      shortBreak: parseInt(data.shortBreak),
      longBreak: parseInt(data.longBreak)
    })
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Focus Timer Settings</h3>
      <p className="text-sm text-gray-600">Customize your default focus session durations.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Work Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Session Duration</label>
          <input {...register('workDuration', { required: true, min: 1, max: 180 })} type="number" className="input-field w-24" />
        </div>
        {/* Short Break */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Break Duration</label>
          <input {...register('shortBreak', { required: true, min: 1, max: 60 })} type="number" className="input-field w-24" />
        </div>
        {/* Long Break */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Long Break Duration</label>
          <input {...register('longBreak', { required: true, min: 1, max: 60 })} type="number" className="input-field w-24" />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || updateFocusSettingsMutation.isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateFocusSettingsMutation.isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  )
}

// ---------------- NOTIFICATION SETTINGS ----------------
const NotificationSettings = () => {
  const [permissions, setPermissions] = useState(Notification.permission)

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission()
    setPermissions(permission)
    if (permission === 'granted') toast.success('Notifications enabled!')
    else toast.error('Notifications blocked')
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
      <p className="text-sm text-gray-600">Manage how you receive notifications.</p>

      <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Browser Notifications</h4>
          <p className="text-sm text-gray-600">Get notified when focus sessions end</p>
        </div>
        <div>
          {permissions === 'granted' ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              <Check className="h-4 w-4 mr-1" /> Enabled
            </span>
          ) : (
            <button onClick={requestNotificationPermission} className="btn-secondary text-sm">Enable Notifications</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------- SECURITY SETTINGS ----------------
const SecuritySettings = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const { logout } = useAuthStore()
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const newPassword = watch('newPassword')

  const changePasswordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed!'); reset() },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to change password')
  })

  const onSubmit = (data) => changePasswordMutation.mutate({ currentPassword: data.currentPassword, newPassword: data.newPassword })

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label>Current Password</label>
          <input {...register('currentPassword', { required: true })} type={showCurrentPassword ? 'text' : 'password'} className="input-field" />
          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
            {showCurrentPassword ? <EyeOff /> : <Eye />}
          </button>
          {errors.currentPassword && <p className="text-red-600 text-sm">Current password required</p>}
        </div>
        <div>
          <label>New Password</label>
          <input {...register('newPassword', { required: true, minLength: 6 })} type={showNewPassword ? 'text' : 'password'} className="input-field" />
          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}>
            {showNewPassword ? <EyeOff /> : <Eye />}
          </button>
          {errors.newPassword && <p className="text-red-600 text-sm">Password must be at least 6 characters</p>}
        </div>
        <div>
          <label>Confirm New Password</label>
          <input {...register('confirmPassword', {
            required: true,
            validate: (value) => value === newPassword || 'Passwords do not match'
          })} type="password" className="input-field" />
          {errors.confirmPassword && <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>}
        </div>
        <div className="flex justify-end space-x-2">
          <button type="submit" className="btn-primary">Change Password</button>
          <button type="button" onClick={logout} className="btn-secondary">Logout</button>
        </div>
      </form>
    </div>
  )
}

// ---------------- PREFERENCES SETTINGS ----------------
const PreferencesSettings = () => <div>Preferences Settings Content</div>

// ---------------- DATA & PRIVACY SETTINGS ----------------
const DataPrivacySettings = () => <div>Data & Privacy Settings Content</div>

export default Settings
