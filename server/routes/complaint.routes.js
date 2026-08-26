import express from 'express';
import {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  upvoteComplaint,
  deleteComplaint,
  getHotspots,
  sendOtp,
  verifyOtp
} from '../controllers/complaint.controller.js';

import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET  /api/complaints/hotspots  — MUST be before /:id route
router.get('/hotspots', getHotspots);

// OTP routes
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// CRUD
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.post('/', createComplaint); // Open for citizens

// Protected routes (Admin / Officers only)
router.patch('/:id', protect, authorize('Admin', 'Officer'), updateComplaint);
router.post('/:id/upvote', upvoteComplaint); // Open for citizens to upvote
router.delete('/:id', protect, authorize('Admin'), deleteComplaint);

export default router;
