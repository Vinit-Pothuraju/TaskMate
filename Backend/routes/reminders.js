import express from 'express';
import { body, query } from 'express-validator';
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder
} from '../controllers/reminderController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const createReminderValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  body('when')
    .isISO8601()
    .withMessage('When must be a valid ISO8601 date'),
  body('recurring.enabled')
    .optional()
    .isBoolean()
    .withMessage('Recurring enabled must be a boolean'),
  body('recurring.pattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'custom'])
    .withMessage('Recurring pattern must be daily, weekly, monthly, or custom'),
  body('recurring.endDate')
    .optional()
    .isISO8601()
    .withMessage('Recurring end date must be a valid ISO8601 date')
];

const updateReminderValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  body('when')
    .optional()
    .isISO8601()
    .withMessage('When must be a valid ISO8601 date'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean')
];

// Routes
router.get('/', getReminders);
router.post('/', createReminderValidation, createReminder);
router.put('/:id', updateReminderValidation, updateReminder);
router.delete('/:id', deleteReminder);

export default router;