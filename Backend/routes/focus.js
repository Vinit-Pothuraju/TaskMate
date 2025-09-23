import express from 'express';
import { body, query } from 'express-validator';
import {
  startSession,
  endSession,
  getActiveSession,
  getSessions,
  getAnalytics,
  getSessionById,
  deleteSession
} from '../controllers/focusController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const startSessionValidation = [
  body('taskId')
    .optional()
    .isMongoId()
    .withMessage('Task ID must be a valid MongoDB ObjectId'),
  body('sessionType')
    .optional()
    .isIn(['work', 'shortBreak', 'longBreak'])
    .withMessage('Session type must be work, shortBreak, or longBreak'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 240 })
    .withMessage('Estimated duration must be between 1 and 240 minutes')
];

const endSessionValidation = [
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Session ID must be a valid MongoDB ObjectId'),
  body('interrupted')
    .optional()
    .isBoolean()
    .withMessage('Interrupted must be a boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const getSessionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date'),
  query('taskId')
    .optional()
    .isMongoId()
    .withMessage('Task ID must be a valid MongoDB ObjectId'),
  query('sessionType')
    .optional()
    .isIn(['work', 'shortBreak', 'longBreak'])
    .withMessage('Session type must be work, shortBreak, or longBreak')
];

const getAnalyticsValidation = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO8601 date'),
  query('period')
    .optional()
    .isIn(['1d', '7d', '30d', '90d', '1y'])
    .withMessage('Period must be one of: 1d, 7d, 30d, 90d, 1y')
];

// Routes
router.post('/start', startSessionValidation, startSession);
router.post('/end', endSessionValidation, endSession);
router.get('/active', getActiveSession);
router.get('/analytics', getAnalyticsValidation, getAnalytics);
router.get('/sessions', getSessionsValidation, getSessions);
router.get('/sessions/:id', getSessionById);
router.delete('/sessions/:id', deleteSession);

export default router;

// backend/src/middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid ID format';
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = { message, statusCode: 409 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// backend/src/middlewares/logger.js
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    
    console.log(`${method} ${url} ${statusCode} - ${duration}ms`);
  });
  
  next();
};