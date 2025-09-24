import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../services/api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Initialize auth state
      initializeAuth: async () => {
        const { accessToken, refreshToken } = get()
        
        if (accessToken && refreshToken) {
          try {
            // Validate token by fetching user profile
            const response = await api.get('/auth/profile', {
              headers: { Authorization: `Bearer ${accessToken}` }
            })
            
            set({
              user: response.data.data.user,
              isAuthenticated: true,
              isLoading: false
            })
          } catch (error) {
            // Token might be expired, try to refresh
            if (refreshToken) {
              await get().refreshAccessToken()
            } else {
              get().logout()
            }
          }
        } else {
          set({ isLoading: false })
        }
      },

      // Login
      login: async (credentials) => {
        try {
          const response = await api.post('/auth/login', credentials)
          const { user, accessToken, refreshToken } = response.data.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true
          })
          
          toast.success('Welcome back!')
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          return { success: false, message }
        }
      },

      // Register
      register: async (userData) => {
        try {
          const response = await api.post('/auth/register', userData)
          const { user, accessToken, refreshToken } = response.data.data
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true
          })
          
          toast.success('Account created successfully!')
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          return { success: false, message }
        }
      },

      // Refresh access token
      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get()
          const response = await api.post('/auth/refresh', { refreshToken })
          const { accessToken, user } = response.data.data
          
          set({
            accessToken,
            user,
            isAuthenticated: true,
            isLoading: false
          })
          
          return accessToken
        } catch (error) {
          get().logout()
          throw error
        }
      },

      // Logout
      logout: async (fromAllDevices = false) => {
        const { refreshToken } = get()
        
        try {
          if (refreshToken) {
            await api.post(fromAllDevices ? '/auth/logout-all' : '/auth/logout', 
              { refreshToken })
          }
        } catch (error) {
          console.error('Logout error:', error)
        }
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        })
        
        toast.success('Logged out successfully')
      },

      // Update user profile
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }))
      }
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user
      })
    }
  )
)

export { useAuthStore }
