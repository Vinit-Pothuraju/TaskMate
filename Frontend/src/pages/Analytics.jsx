import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ResponsiveContainer,
} from 'recharts'
import {
  Calendar, Clock, Target, TrendingUp, Award, Flame,
  BarChart3, Activity
} from 'lucide-react'
import api from '../services/api'

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedView, setSelectedView] = useState('overview')

  // --- React Query v5: object syntax ---
  const { data: analyticsData, isLoading: loadingAnalytics, isError: errorAnalytics } = useQuery({
    queryKey: ['analytics', selectedPeriod],
    queryFn: async () => {
      const res = await api.get(`/focus/analytics?period=${selectedPeriod}`)
      return res.data.data
    },
    keepPreviousData: true,
  })

  const { data: taskStats, isLoading: loadingTasks, isError: errorTasks } = useQuery({
    queryKey: ['task-stats'],
    queryFn: async () => {
      const res = await api.get('/tasks/stats')
      return res.data.data
    },
  })

  if (loadingAnalytics || loadingTasks) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (errorAnalytics || errorTasks) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500">
        Failed to load analytics. Please try again later.
      </div>
    )
  }

  const analytics = analyticsData?.overview || {}
  const dailyStats = analyticsData?.dailyStats || []
  const topTasks = analyticsData?.topTasks || []
  const heatmapData = analyticsData?.heatmap || []
  const tasks = taskStats?.overview || {}

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ]

  const views = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'focus', label: 'Focus Time', icon: Clock },
    { value: 'tasks', label: 'Tasks', icon: Target },
    { value: 'productivity', label: 'Productivity', icon: Activity }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your productivity and focus patterns</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {periods.map(period => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* View Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {views.map(view => {
            const Icon = view.icon
            return (
              <button
                key={view.value}
                onClick={() => setSelectedView(view.value)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === view.value
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{view.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Render Views */}
      {selectedView === 'overview' && <OverviewTab analytics={analytics} dailyStats={dailyStats} taskStats={taskStats} />}
      {selectedView === 'focus' && <FocusTab dailyStats={dailyStats} topTasks={topTasks} heatmapData={heatmapData} />}
      {selectedView === 'tasks' && <TasksTab taskStats={taskStats} dailyStats={dailyStats} />}
      {selectedView === 'productivity' && <ProductivityTab analytics={analytics} tasks={tasks} dailyStats={dailyStats} />}
    </div>
  )
}
const OverviewTab = ({ analytics, dailyStats, taskStats }) => {
  return <div>Overview content goes here</div>
}

const FocusTab = ({ dailyStats, topTasks, heatmapData }) => {
  return <div>Focus content goes here</div>
}

const TasksTab = ({ taskStats, dailyStats }) => {
  return <div>Tasks content goes here</div>
}

const ProductivityTab = ({ analytics, tasks, dailyStats }) => {
  return <div>Productivity content goes here</div>
}


// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`h-8 w-8 rounded-md ${colorClasses[color]} flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className="ml-2 text-sm text-green-600 font-medium">{trend}</div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-sm text-gray-500">{subtitle}</dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Completion Chart
const TaskCompletionChart = ({ tasks }) => {
  const data = [
    { name: 'Completed', value: tasks.completedTasks || 0, fill: '#10B981' },
    { name: 'Pending', value: tasks.pendingTasks || 0, fill: '#F59E0B' },
    { name: 'Overdue', value: tasks.overdueTasks || 0, fill: '#EF4444' }
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Category Breakdown Chart
const CategoryBreakdownChart = ({ categories }) => {
  const data = categories.map(cat => ({
    name: cat._id || 'Uncategorized',
    total: cat.count,
    completed: cat.completed
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Category</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#6366F1" />
            <Bar dataKey="completed" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Daily Focus Trend
const DailyFocusTrend = ({ data }) => {
  const chartData = data.map(day => ({
    date: format(new Date(day._id), 'MMM dd'),
    focusTime: Math.round((day.workTime || 0) / 60), // Convert to minutes
    sessions: day.sessions
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Focus Trend</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'focusTime' ? `${value} min` : value,
                name === 'focusTime' ? 'Focus Time' : 'Sessions'
              ]}
            />
            <Area
              type="monotone"
              dataKey="focusTime"
              stroke="#6366F1"
              fill="#6366F1"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Focus Time Chart
const FocusTimeChart = ({ data }) => {
  const chartData = data.map(day => ({
    date: format(new Date(day._id), 'MMM dd'),
    minutes: Math.round((day.workTime || 0) / 60)
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Focus Time by Day</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} min`, 'Focus Time']} />
            <Line
              type="monotone"
              dataKey="minutes"
              stroke="#6366F1"
              strokeWidth={2}
              dot={{ fill: '#6366F1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Top Tasks by Focus Time
const TopTasksByFocusTime = ({ tasks }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Tasks by Focus Time</h3>
      <div className="space-y-4">
        {tasks.slice(0, 8).map((task, index) => (
          <div key={task._id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-medium text-gray-500">
                #{index + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 truncate max-w-48">
                  {task.taskTitle || 'Untitled Task'}
                </p>
                <p className="text-xs text-gray-500">{task.taskCategory || 'No category'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {Math.round(task.totalTime / 60)}min
              </p>
              <p className="text-xs text-gray-500">{task.sessions} sessions</p>
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No focus sessions recorded yet
          </p>
        )}
      </div>
    </div>
  )
}

// Productivity Heatmap
const ProductivityHeatmap = ({ data }) => {
  // Create a simple heatmap visualization
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Heatmap (Last Year)</h3>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 365 }, (_, i) => {
          const dayData = data.find(d => d.date === format(subDays(new Date(), 365 - i), 'yyyy-MM-dd'))
          const intensity = dayData ? (dayData.value / maxValue) : 0
          
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${
                intensity === 0 ? 'bg-gray-100' :
                intensity < 0.25 ? 'bg-green-100' :
                intensity < 0.5 ? 'bg-green-300' :
                intensity < 0.75 ? 'bg-green-500' : 'bg-green-700'
              }`}
              title={`${dayData?.value || 0} minutes focused`}
            />
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Less</span>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-gray-100 rounded-sm" />
          <div className="w-3 h-3 bg-green-100 rounded-sm" />
          <div className="w-3 h-3 bg-green-300 rounded-sm" />
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <div className="w-3 h-3 bg-green-700 rounded-sm" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

// Task Priority Chart
const TaskPriorityChart = ({ priorities }) => {
  const data = priorities.map(p => ({
    priority: `Priority ${p._id}`,
    count: p.count
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Priority</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="priority" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#F59E0B" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Task Category Chart
const TaskCategoryChart = ({ categories }) => {
  const data = categories.map(cat => ({
    name: cat._id || 'Uncategorized',
    value: cat.count,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Category</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Task Completion Trend
const TaskCompletionTrend = ({ data }) => {
  // This would need additional API endpoint for task completion by day
  // For now, showing placeholder
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Task Completion Trend</h3>
      <div className="text-center py-8 text-gray-500">
        <Target className="h-12 w-12 mx-auto mb-4" />
        <p>Task completion trend coming soon</p>
      </div>
    </div>
  )
}

// Productivity Insights
const ProductivityInsights = ({ analytics, tasks }) => {
  const insights = []

  if (analytics.streakDays >= 7) {
    insights.push({
      type: 'positive',
      title: 'Great Consistency!',
      description: `You've maintained a ${analytics.streakDays}-day focus streak. Keep it up!`,
      icon: Flame
    })
  }

  if (analytics.completionRate >= 80) {
    insights.push({
      type: 'positive',
      title: 'Excellent Focus',
      description: `${analytics.completionRate}% completion rate shows great discipline.`,
      icon: Award
    })
  }

  if (tasks.overdueTasks > 0) {
    insights.push({
      type: 'warning',
      title: 'Overdue Tasks',
      description: `You have ${tasks.overdueTasks} overdue tasks that need attention.`,
      icon: Calendar
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {insights.map((insight, index) => {
        const Icon = insight.icon
        return (
          <div key={index} className={`p-6 rounded-lg border-l-4 ${
            insight.type === 'positive' ? 'bg-green-50 border-green-500' :
            insight.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
            'bg-blue-50 border-blue-500'
          }`}>
            <div className="flex items-start space-x-3">
              <Icon className={`h-6 w-6 ${
                insight.type === 'positive' ? 'text-green-600' :
                insight.type === 'warning' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div>
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
              </div>
            </div>
          </div>
        )
      })}
      
      {insights.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          <TrendingUp className="h-12 w-12 mx-auto mb-4" />
          <p>Keep using TaskMate to generate productivity insights!</p>
        </div>
      )}
    </div>
  )
}

// Weekly Productivity Chart
const WeeklyProductivityChart = ({ data }) => {
  const weeklyData = data.slice(-7).map(day => ({
    day: format(new Date(day._id), 'EEE'),
    productivity: Math.round((day.workTime || 0) / 60)
  }))

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">This Week's Productivity</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} min`, 'Focus Time']} />
            <Bar dataKey="productivity" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Analytics