import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  upvoteComplaint,
  deleteComplaint,
  getHotspots,
  uploadPhotos
} from '../controllers/complaint.controller.js';

const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/complaints/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `complaint-${Date.now()}-${Math.floor(Math.random() * 1000000)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG, WEBP image formats are supported'), false);
    }
  }
});

// GET /api/complaints/hotspots — MUST be before /:id route
router.get('/hotspots', getHotspots);

// POST /api/complaints/upload — Multipart photo upload (max 5 photos)
router.post('/upload', upload.array('photos', 5), uploadPhotos);

// CRUD
router.get('/', getAllComplaints);
router.get('/:id', getComplaintById);
router.post('/', createComplaint);
router.patch('/:id', updateComplaint);
router.post('/:id/upvote', upvoteComplaint);
router.delete('/:id', deleteComplaint);

export default router;
