import express from 'express';
import {
  startSession,
  endSession,
  getUserSessions,
  getSessionById
} from '../Controllers/FocusMate.controller.js';

const FocusMate = express.Router();


router.post('/start', startSession);
router.post('/end', endSession);
router.get('/user/:userId', getUserSessions);
router.get('/:sessionId', getSessionById);

export default FocusMate;
