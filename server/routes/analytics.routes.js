import express from 'express';
import { getMetrics, getProjectStats, getComplaintStats } from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Analytics endpoints (Admin/Officer access only)
router.get('/metrics', protect, authorize('Admin', 'Officer'), getMetrics);
router.get('/projects', protect, authorize('Admin', 'Officer'), getProjectStats);
router.get('/complaints', protect, authorize('Admin', 'Officer'), getComplaintStats);

export default router;
