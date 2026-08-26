import express from 'express';
import { submitFeedback, getProjectFeedback, getFeedbackStats } from '../controllers/feedback.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', submitFeedback); // Open for citizens, but controller checks `req.user` if passed
router.get('/project/:projectId', getProjectFeedback);
router.get('/stats', getFeedbackStats);

export default router;
