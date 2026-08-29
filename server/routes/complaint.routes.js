import express from 'express';
import {
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  upvoteComplaint,
  deleteComplaint,
  getHotspots,
  sendOtp,
  verifyOtp
} from '../controllers/complaint.controller.js';

import { protect, optionalProtect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET  /api/complaints/hotspots  — MUST be before /:id route
router.get('/hotspots', getHotspots);

// OTP routes
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// User-specific complaints route (Authenticated Citizen)
router.get('/my', protect, getMyComplaints);

// CRUD
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.post('/', optionalProtect, createComplaint); // Open for citizens (with optional JWT auth)

// Protected routes (Admin / Officers only)
router.patch('/:id', protect, authorize('Admin', 'Officer'), updateComplaint);
router.post('/:id/upvote', upvoteComplaint); // Open for citizens to upvote
router.delete('/:id', protect, authorize('Admin'), deleteComplaint);

export default router;
