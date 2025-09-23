import express from 'express';
import { body, query } from 'express-validator';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  toggleComplete,
  archiveTask,
  bulkUpdate,
  getTaskStats
} from '../controllers/taskController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid ISO8601 date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag cannot exceed 30 characters'),
  body('estimatedDuration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Estimated duration must be a non-negative integer')
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('priority')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Priority must be between 1 and 5'),
  body('dueDate')
    .optional()
    .custom((value) => {
      if (value === null) return true; // Allow null to clear due date
      if (!value) return true; // Allow empty string
      return new Date(value).toString() !== 'Invalid Date';
    })
    .withMessage('Due date must be a valid date or null'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean'),
  body('archived')
    .optional()
    .isBoolean()
    .withMessage('Archived must be a boolean')
];

const getTasksValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('completed')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Completed must be true or false'),
  query('priority')
    .optional()
    .custom((value) => {
      const priorities = Array.isArray(value) ? value : [value];
      return priorities.every(p => ['1', '2', '3', '4', '5'].includes(p));
    })
    .withMessage('Priority must be between 1 and 5'),
  query('sort')
    .optional()
    .matches(/^(title|createdAt|updatedAt|dueDate|priority):(asc|desc)$/)
    .withMessage('Sort must be in format field:order (e.g., createdAt:desc)')
];

// Routes
router.get('/', getTasksValidation, getTasks);
router.get('/stats', getTaskStats);
router.get('/:id', getTask);
router.post('/', createTaskValidation, createTask);
router.put('/:id', updateTaskValidation, updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/toggle', toggleComplete);
router.post('/:id/archive', archiveTask);
router.post('/bulk-update', bulkUpdate);

export default router;