import FocusSession from '../models/FocusSession.js';
import Task from '../models/Task.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Store active sessions in memory (in production, use Redis)
const activeSessions = new Map();

export const startSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { taskId, sessionType = 'work', estimatedDuration } = req.body;
    const userId = req.userId;

    // Check if user has an active session
    const existingSession = activeSessions.get(userId.toString());
    if (existingSession && !existingSession.ended) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active session. Please end it first.',
        activeSession: existingSession
      });
    }

    // Validate task ownership if taskId provided
    if (taskId) {
      const task = await Task.findOne({
        _id: taskId,
        userId: userId
      });

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }
    }

    // Create active session object
    const sessionData = {
      id: new mongoose.Types.ObjectId(),
      userId,
      taskId: taskId || null,
      sessionType,
      startAt: new Date(),
      estimatedDuration,
      ended: false
    };

    // Store in memory for tracking
    activeSessions.set(userId.toString(), sessionData);

    res.json({
      success: true,
      message: 'Focus session started',
      data: { session: sessionData }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting focus session'
    });
  }
};

export const endSession = async (req, res) => {
  try {
    const { sessionId, interrupted = false, notes } = req.body;
    const userId = req.userId;

    // Get active session
    let activeSession = activeSessions.get(userId.toString());
    
    // If sessionId provided, verify it matches
    if (sessionId && activeSession && activeSession.id.toString() !== sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID mismatch'
      });
    }

    if (!activeSession || activeSession.ended) {
      return res.status(404).json({
        success: false,
        message: 'No active session found'
      });
    }

    const endAt = new Date();
    const durationSec = Math.floor((endAt - activeSession.startAt) / 1000);

    // Create permanent session record
    const focusSession = new FocusSession({
      userId,
      taskId: activeSession.taskId,
      sessionType: activeSession.sessionType,
      startAt: activeSession.startAt,
      endAt,
      durationSec,
      interrupted,
      notes
    });

    await focusSession.save();

    // Remove from active sessions
    activeSessions.delete(userId.toString());

    // If it was a work session, update task's actual duration (handled by post-save hook)

    res.json({
      success: true,
      message: 'Focus session ended',
      data: { 
        session: focusSession.toObject(),
        duration: {
          seconds: durationSec,
          minutes: Math.round(durationSec / 60)
        }
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error ending focus session'
    });
  }
};

export const getActiveSession = async (req, res) => {
  try {
    const userId = req.userId;
    const activeSession = activeSessions.get(userId.toString());

    if (!activeSession || activeSession.ended) {
      return res.json({
        success: true,
        data: { session: null }
      });
    }

    // Calculate elapsed time
    const elapsed = Math.floor((new Date() - activeSession.startAt) / 1000);

    res.json({
      success: true,
      data: { 
        session: {
          ...activeSession,
          elapsed
        }
      }
    });
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active session'
    });
  }
};

export const getSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      taskId,
      sessionType
    } = req.query;

    const userId = req.userId;

    // Build query
    const query = { userId };

    if (startDate || endDate) {
      query.startAt = {};
      if (startDate) query.startAt.$gte = new Date(startDate);
      if (endDate) query.startAt.$lte = new Date(endDate);
    }

    if (taskId) query.taskId = taskId;
    if (sessionType) query.sessionType = sessionType;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [sessions, totalCount] = await Promise.all([
      FocusSession.find(query)
        .populate('taskId', 'title category')
        .sort({ startAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      FocusSession.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const {
      startDate,
      endDate = new Date(),
      period = '7d' // 1d, 7d, 30d, 90d, 1y
    } = req.query;

    const userId = req.userId;

    // Calculate date range based on period if startDate not provided
    let start = startDate ? new Date(startDate) : new Date();
    if (!startDate) {
      switch (period) {
        case '1d':
          start.setDate(start.getDate() - 1);
          break;
        case '7d':
          start.setDate(start.getDate() - 7);
          break;
        case '30d':
          start.setDate(start.getDate() - 30);
          break;
        case '90d':
          start.setDate(start.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(start.getFullYear() - 1);
          break;
        default:
          start.setDate(start.getDate() - 7);
      }
    }

    const end = new Date(endDate);

    // Overall stats
    const overallStats = await FocusSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          startAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalFocusTime: { $sum: '$durationSec' },
          workSessions: {
            $sum: { $cond: [{ $eq: ['$sessionType', 'work'] }, 1, 0] }
          },
          workTime: {
            $sum: { $cond: [{ $eq: ['$sessionType', 'work'] }, '$durationSec', 0] }
          },
          averageSessionLength: { $avg: '$durationSec' },
          interruptedSessions: {
            $sum: { $cond: ['$interrupted', 1, 0] }
          }
        }
      }
    ]);

    const stats = overallStats[0] || {
      totalSessions: 0,
      totalFocusTime: 0,
      workSessions: 0,
      workTime: 0,
      averageSessionLength: 0,
      interruptedSessions: 0
    };

    // Daily breakdown for charts
    const dailyStats = await FocusSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          startAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startAt' }
          },
          sessions: { $sum: 1 },
          totalTime: { $sum: '$durationSec' },
          workTime: {
            $sum: { $cond: [{ $eq: ['$sessionType', 'work'] }, '$durationSec', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top tasks by focus time
    const topTasks = await FocusSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          startAt: { $gte: start, $lte: end },
          sessionType: 'work',
          taskId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$taskId',
          totalTime: { $sum: '$durationSec' },
          sessions: { $sum: 1 }
        }
      },
      { $sort: { totalTime: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'tasks',
          localField: '_id',
          foreignField: '_id',
          as: 'task'
        }
      },
      { $unwind: '$task' },
      {
        $project: {
          taskTitle: '$task.title',
          taskCategory: '$task.category',
          totalTime: 1,
          sessions: 1
        }
      }
    ]);

    // Calculate streak (consecutive days with at least one work session)
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    let streakDays = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < 365; i++) { // Max check 1 year
      checkDate.setDate(checkDate.getDate() - 1);
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const daySession = await FocusSession.findOne({
        userId,
        sessionType: 'work',
        startAt: { $gte: dayStart, $lte: dayEnd }
      });

      if (daySession) {
        streakDays++;
      } else {
        break; // Streak broken
      }
    }

    // Productivity heatmap (last 365 days)
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const heatmapData = await FocusSession.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          sessionType: 'work',
          startAt: { $gte: yearAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startAt' }
          },
          value: { $sum: '$durationSec' }
        }
      }
    ]);

    // Convert to minutes for heatmap
    const heatmap = heatmapData.map(day => ({
      date: day._id,
      value: Math.round(day.value / 60) // Convert to minutes
    }));

    res.json({
      success: true,
      data: {
        overview: {
          ...stats,
          streakDays,
          totalFocusHours: Math.round(stats.totalFocusTime / 3600 * 10) / 10,
          averageSessionMinutes: Math.round(stats.averageSessionLength / 60),
          completionRate: stats.totalSessions ? 
            Math.round((1 - stats.interruptedSessions / stats.totalSessions) * 100) : 100
        },
        dailyStats,
        topTasks,
        heatmap,
        period: {
          start,
          end,
          days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const session = await FocusSession.findOne({
      _id: id,
      userId
    }).populate('taskId', 'title category').lean();

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching session'
    });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID'
      });
    }

    const session = await FocusSession.findOneAndDelete({
      _id: id,
      userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // If it was a work session, recalculate task duration
    if (session.taskId && session.sessionType === 'work') {
      const totalDuration = await FocusSession.aggregate([
        { 
          $match: { 
            taskId: session.taskId, 
            sessionType: 'work' 
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$durationSec' } 
          } 
        }
      ]);

      const totalMinutes = Math.round((totalDuration[0]?.total || 0) / 60);
      await Task.findByIdAndUpdate(session.taskId, { 
        actualDuration: totalMinutes 
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting session'
    });
  }
};

// Cleanup function to handle server restarts
export const cleanupActiveSessions = () => {
  activeSessions.clear();
};
