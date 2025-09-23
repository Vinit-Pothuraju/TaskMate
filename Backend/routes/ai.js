import express from 'express';
import { body, query } from 'express-validator';
import {
  getSuggestions,
  generateSuggestions,
  provideFeedback
} from '../controllers/aiController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const dateValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO8601 date')
];

const feedbackValidation = [
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
  body('helpful')
    .optional()
    .isBoolean()
    .withMessage('Helpful must be a boolean')
];

// Routes
router.get('/suggestions', dateValidation, getSuggestions);
router.post('/generate', async (req, res) => {
  try {
    const suggestion = await generateSuggestions(req.userId);
    res.json({
      success: true,
      message: 'Suggestions generated successfully',
      data: { suggestion }
    });
  } catch (error) {
    console.error('Generate suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating suggestions'
    });
  }
});
router.post('/feedback/:date', feedbackValidation, provideFeedback);

export default router;
