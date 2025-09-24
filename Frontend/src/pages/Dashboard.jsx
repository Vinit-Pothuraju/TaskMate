import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow } from 'date-fns'
import {
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  Plus,
  Play,
  BarChart3,
  TrendingUp
} from 'lucide-react'
import api from '../services/api'

const Dashboard = () => {
  const [selectedDate] = useState(new Date())

  // Fetch dashboard data
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', { limit: 10, completed: false }],
    queryFn: () => api.get('/tasks?limit=10&completed=false').then(res => res.data.data),
  })

  const { data: statsData } = useQuery({
    queryKey: ['task-stats'],
    queryFn: () => api.get('/tasks/stats').then(res => res.data.data),
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics', '7d'],
    queryFn: () => api.get('/focus/analytics?period=7d').then(res => res.data.data),
  })

  const { data: aiSuggestions } = useQuery({
    queryKey: ['ai-suggestions', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => api.get(`/ai/suggestions?date=${format(selectedDate, 'yyyy-MM-dd')}`).then(res => res.data.data),
    retry: false,
  })

  const tasks = tasksData?.tasks || []
  const stats = statsData?.overview || {}
  const analytics = analyticsData?.overview || {}

  const todayTasks = tasks.filter(task => task.dueDate && isToday(new Date(task.dueDate)))
  const overdueTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate) < new Date() && !task.completed)
  const upcomingTasks = tasks.filter(task => task.dueDate && isTomorrow(new Date(task.dueDate)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's on your plate today.</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/tasks/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
          <Link
            to="/focus"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Play className="h-4 w-4 mr-2" />
            Start Focus
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks || 0}
          icon={CheckSquare}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completedTasks || 0}
          icon={CheckSquare}
          color="green"
          subtitle={stats.totalTasks ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%'}
        />
        <StatCard
          title="Overdue"
          value={stats.overdueTasks || 0}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title="Focus Time Today"
          value={`${Math.round((analytics.totalFocusTime || 0) / 3600)}h`}
          icon={Clock}
          color="purple"
          subtitle={`${analytics.streakDays || 0} day streak`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {overdueTasks.length > 0 && (
            <TaskSection
              title="Overdue"
              tasks={overdueTasks}
              titleColor="text-red-600"
              bgColor="bg-red-50"
              borderColor="border-red-200"
            />
          )}

          <TaskSection
            title="Due Today"
            tasks={todayTasks}
            titleColor="text-orange-600"
            bgColor="bg-orange-50"
            borderColor="border-orange-200"
            emptyMessage="No tasks due today. Great job!"
          />

          {upcomingTasks.length > 0 && (
            <TaskSection
              title="Due Tomorrow"
              tasks={upcomingTasks}
              titleColor="text-blue-600"
              bgColor="bg-blue-50"
              borderColor="border-blue-200"
            />
          )}

          <TaskSection
            title="Recent Tasks"
            tasks={tasks.slice(0, 5)}
            showViewAll
            viewAllLink="/tasks"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {aiSuggestions?.suggestion && (
            <AISuggestionsCard suggestions={aiSuggestions.suggestion} />
          )}
          <QuickFocusCard />
          <AnalyticsPreviewCard analytics={analytics} />
        </div>
      </div>
    </div>
  )
}

// ---------------- StatCard ----------------
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
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
                {subtitle && (
                  <div className="ml-2 text-sm text-gray-500">{subtitle}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- TaskSection ----------------
const TaskSection = ({ 
  title, 
  tasks, 
  titleColor = 'text-gray-900', 
  bgColor = 'bg-white', 
  borderColor = 'border-gray-200',
  showViewAll = false,
  viewAllLink = '',
  emptyMessage = 'No tasks found.'
}) => {
  return (
    <div className={`${bgColor} shadow rounded-lg border ${borderColor}`}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-medium ${titleColor}`}>{title}</h3>
          {showViewAll && (
            <Link
              to={viewAllLink}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              View all
            </Link>
          )}
        </div>
        
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskItem key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------- TaskItem ----------------
const TaskItem = ({ task }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate))

  return (
    <div className="flex items-center space-x-3 p-3 bg-white rounded-md border border-gray-200">
      <div className="flex-shrink-0">
        <div className={`h-2 w-2 rounded-full ${
          task.completed ? 'bg-green-400' : 
          isOverdue ? 'bg-red-400' : 
          isDueToday ? 'bg-orange-400' : 'bg-gray-300'
        }`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium truncate ${
            task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}>
            {task.title}
          </p>
          {task.priority && task.priority > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              High
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2 mt-1">
          {task.category && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {task.category}
            </span>
          )}
          {task.dueDate && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(task.dueDate), 'MMM d')}
            </div>
          )}
        </div>
      </div>
      
      <Link
        to={`/tasks/${task._id}/edit`}
        className="text-indigo-600 hover:text-indigo-900 text-sm"
      >
        Edit
      </Link>
    </div>
  )
}

// ---------------- AI Suggestions Card ----------------
const AISuggestionsCard = ({ suggestions }) => {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-100 shadow rounded-lg border border-purple-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          🤖 AI Suggestions for Today
        </h3>
        
        <div className="space-y-3">
          {suggestions.suggestions.slice(0, 3).map((suggestion, index) => (
            <div key={index} className="p-3 bg-white rounded-md border border-purple-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{suggestion.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{suggestion.rationale}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                      Priority {suggestion.priority}/10
                    </span>
                    {suggestion.estimatedDuration && (
                      <span className="text-xs text-gray-500">
                        ~{suggestion.estimatedDuration}min
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Link
          to="/focus"
          className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 transition-colors"
        >
          Start with AI suggestions
        </Link>
      </div>
    </div>
  )
}

// ---------------- Quick Focus Card ----------------
const QuickFocusCard = () => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Focus</h3>
        
        <div className="space-y-3">
          <Link
            to="/focus?duration=25"
            className="block w-full text-center px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors"
          >
            <div className="text-sm font-medium text-indigo-900">25 min Pomodoro</div>
            <div className="text-xs text-indigo-700">Classic focus session</div>
          </Link>
          
          <Link
            to="/focus?duration=15"
            className="block w-full text-center px-4 py-3 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
          >
            <div className="text-sm font-medium text-green-900">15 min Quick Focus</div>
            <div className="text-xs text-green-700">Short burst session</div>
          </Link>
          
          <Link
            to="/focus?duration=45"
            className="block w-full text-center px-4 py-3 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
          >
            <div className="text-sm font-medium text-orange-900">45 min Deep Work</div>
            <div className="text-xs text-orange-700">Extended focus session</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ---------------- Analytics Preview Card ----------------
const AnalyticsPreviewCard = ({ analytics }) => {
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">This Week</h3>
          <Link
            to="/analytics"
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            <BarChart3 className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Focus Sessions</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics.totalSessions || 0}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Focus Time</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics.totalFocusHours || 0}h
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completion Rate</span>
            <span className="text-sm font-medium text-gray-900">
              {analytics.completionRate || 0}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Streak</span>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-900">
                {analytics.streakDays || 0} days
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
