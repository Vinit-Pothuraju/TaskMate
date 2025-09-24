import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Clock,
  Coffee,
  CheckSquare
} from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const FocusTimer = () => {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [sessionType, setSessionType] = useState('work')
  const [selectedTask, setSelectedTask] = useState(null)
  const [customDuration, setCustomDuration] = useState('')
  const [notes, setNotes] = useState('')

  // Read duration from URL params
  useEffect(() => {
    const duration = searchParams.get('duration')
    if (duration) setTimeLeft(parseInt(duration) * 60)
  }, [searchParams])

  // Fetch active session
  const { data: activeSessionData } = useQuery({
    queryKey: ['active-focus-session'],
    queryFn: () => api.get('/focus/active').then(res => res.data.data),
    refetchInterval: 1000,
    refetchIntervalInBackground: false
  })

  // Fetch available tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', { completed: false, limit: 50 }],
    queryFn: () => api.get('/tasks?completed=false&limit=50').then(res => res.data.data)
  })

  const startSessionMutation = useMutation({
    mutationFn: (sessionData) => api.post('/focus/start', sessionData),
    onSuccess: () => {
      setIsRunning(true)
      toast.success('Focus session started!')
      queryClient.invalidateQueries(['active-focus-session'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start session')
    }
  })

  const endSessionMutation = useMutation({
    mutationFn: (sessionData) => api.post('/focus/end', sessionData),
    onSuccess: (response) => {
      setIsRunning(false)
      const duration = Math.round(response.data.data.duration.minutes)
      toast.success(`Session completed! ${duration} minutes focused.`)
      queryClient.invalidateQueries(['active-focus-session'])
      queryClient.invalidateQueries(['tasks'])
      queryClient.invalidateQueries(['analytics'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to end session')
    }
  })

  const tasks = tasksData?.tasks || []
  const activeSession = activeSessionData?.session

  // Sync timer with active session
  useEffect(() => {
    if (activeSession && !isRunning) {
      const elapsed = activeSession.elapsed || 0
      const estimatedDuration = activeSession.estimatedDuration || 25
      const remaining = Math.max(0, estimatedDuration * 60 - elapsed)
      setTimeLeft(remaining)
      setSessionType(activeSession.sessionType)
      setSelectedTask(activeSession.taskId)
      setIsRunning(true)
    }
  }, [activeSession, isRunning])

  // Timer countdown
  useEffect(() => {
    let interval = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && isRunning) {
      handleEndSession()
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Session Complete!', {
          body: 'Great job! Time for a break.',
          icon: '/favicon.ico'
        })
      }
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`
  }

  const getProgressPercentage = () => {
    const total = sessionType === 'work' ? 25 * 60 :
                  sessionType === 'shortBreak' ? 5 * 60 : 15 * 60
    return ((total - timeLeft) / total) * 100
  }

  const handleStart = () => {
    if (activeSession) return setIsRunning(true)
    const duration = customDuration ? parseInt(customDuration) : 
                     sessionType === 'work' ? 25 : sessionType === 'shortBreak' ? 5 : 15
    startSessionMutation.mutate({
      taskId: selectedTask || undefined,
      sessionType,
      estimatedDuration: duration
    })
  }

  const handlePause = () => setIsRunning(false)

  const handleEndSession = (interrupted = false) => {
    if (activeSession) {
      endSessionMutation.mutate({ interrupted, notes: notes.trim() || undefined })
    }
    setIsRunning(false)
    setNotes('')
  }

  const handleSkipSession = () => {
    if (window.confirm('Are you sure you want to skip this session?')) {
      handleEndSession(true)
    }
  }

  const presetDurations = [
    { label: '15 min', value: 15, type: 'work' },
    { label: '25 min', value: 25, type: 'work' },
    { label: '45 min', value: 45, type: 'work' },
    { label: '5 min break', value: 5, type: 'shortBreak' },
    { label: '15 min break', value: 15, type: 'longBreak' }
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Focus Timer</h1>
        <p className="text-gray-600 mt-2">Stay focused and productive with the Pomodoro technique</p>
      </div>

      <div className="relative mx-auto w-80 h-80">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-200" />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${2*Math.PI*45}`}
            strokeDashoffset={`${2*Math.PI*45*(1-getProgressPercentage()/100)}`}
            className={`transition-all duration-1000 ${sessionType==='work'?'text-indigo-600':sessionType==='shortBreak'?'text-green-600':'text-blue-600'}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-gray-900 mb-2">{formatTime(timeLeft)}</div>
          <div className="flex items-center space-x-2 text-lg text-gray-600 mb-4">
            {sessionType==='work'?<Clock className="h-5 w-5"/>:<Coffee className="h-5 w-5"/>}
            <span className="capitalize">{sessionType==='shortBreak'?'Short Break':sessionType==='longBreak'?'Long Break':sessionType}</span>
          </div>
          {selectedTask && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 text-center">
              <CheckSquare className="h-4 w-4"/>
              <span className="truncate max-w-48">{tasks.find(t=>t._id===selectedTask)?.title||'Selected Task'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        {!isRunning ? (
          <button onClick={handleStart} disabled={startSessionMutation.isLoading} className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50">
            <Play className="h-5 w-5"/><span>Start</span>
          </button>
        ) : (
          <>
            <button onClick={handlePause} className="flex items-center space-x-2 px-8 py-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors">
              <Pause className="h-5 w-5"/><span>Pause</span>
            </button>
            <button onClick={()=>handleEndSession(false)} disabled={endSessionMutation.isLoading} className="flex items-center space-x-2 px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50">
              <Square className="h-5 w-5"/><span>Complete</span>
            </button>
            <button onClick={handleSkipSession} className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors">
              <SkipForward className="h-5 w-5"/><span>Skip</span>
            </button>
          </>
        )}
      </div>

      {!isRunning && !activeSession && (
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Session Settings</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Task (Optional)</label>
            <select value={selectedTask||''} onChange={e=>setSelectedTask(e.target.value||null)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">No specific task</option>
              {tasks.map(task=><option key={task._id} value={task._id}>{task.title}{task.category?` (${task.category})`:''}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
            <div className="flex space-x-4">
              {[
                {value:'work', label:'Work', icon:Clock},
                {value:'shortBreak', label:'Short Break', icon:Coffee},
                {value:'longBreak', label:'Long Break', icon:Coffee}
              ].map(({value,label,icon:Icon})=>(
                <button key={value} onClick={()=>{setSessionType(value); setTimeLeft(value==='work'?25*60:value==='shortBreak'?5*60:15*60)}} className={`flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors ${sessionType===value?'border-indigo-500 bg-indigo-50 text-indigo-700':'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  <Icon className="h-4 w-4"/><span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration Presets</label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {presetDurations.map(({label,value,type})=>(
                <button key={`${value}-${type}`} onClick={()=>{setTimeLeft(value*60); setSessionType(type)}} className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">{label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Duration (minutes)</label>
            <div className="flex space-x-2">
              <input type="number" min="1" max="180" value={customDuration} onChange={e=>setCustomDuration(e.target.value)} placeholder="Enter minutes..." className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              <button onClick={()=>{if(customDuration&&parseInt(customDuration)>0)setTimeLeft(parseInt(customDuration)*60)}} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Set</button>
            </div>
          </div>
        </div>
      )}

      {isRunning && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Notes</h3>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add notes about this session..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
        </div>
      )}
    </div>
  )
}

export default FocusTimer
