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

const router = express.Router();

// GET  /api/complaints/hotspots  — MUST be before /:id route
router.get('/hotspots', getHotspots);

// OTP routes
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// CRUD
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.post('/', createComplaint);
router.patch('/:id', updateComplaint);
router.post('/:id/upvote', upvoteComplaint);
router.delete('/:id', deleteComplaint);

export default router;
