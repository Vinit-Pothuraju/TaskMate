import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Layout
import Layout from './components/Layout'
import AuthLayout from './components/AuthLayout'

// Pages
import Dashboard from './pages/Dashboard'
import TasksList from './pages/TasksList'
import TaskEditor from './pages/TaskEditor'
import FocusTimer from './pages/FocusTimer'
import Analytics from './pages/Analytics'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Public Route component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  const { initializeAuth } = useAuthStore()
  
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <Login />
            </AuthLayout>
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <AuthLayout>
              <Register />
            </AuthLayout>
          </PublicRoute>
        } />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <Layout>
              <TasksList />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks/new" element={
          <ProtectedRoute>
            <Layout>
              <TaskEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/tasks/:id/edit" element={
          <ProtectedRoute>
            <Layout>
              <TaskEditor />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/focus" element={
          <ProtectedRoute>
            <Layout>
              <FocusTimer />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/reminders" element={
          <ProtectedRoute>
            <Layout>
              <Reminders />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Default redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App