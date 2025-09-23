import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getProfile,
  updateProfile
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();


const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('settings.timezone')
    .optional()
    .isString()
    .withMessage('Timezone must be a string'),
  body('settings.focusDefaults.work')
    .optional()
    .isInt({ min: 1, max: 180 })
    .withMessage('Work duration must be between 1 and 180 minutes'),
  body('settings.focusDefaults.shortBreak')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Short break must be between 1 and 60 minutes'),
  body('settings.focusDefaults.longBreak')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Long break must be between 1 and 60 minutes')
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, profileUpdateValidation, updateProfile);

export default router;