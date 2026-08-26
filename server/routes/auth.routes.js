import express from 'express';
import { login, getMe, logout, sendAuthOtp, verifyAuthOtp, googleLoginMock } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/admin/login', login);
router.post('/login', login); // Alias

// Citizen OTP login
router.post('/otp/send', sendAuthOtp);
router.post('/otp/verify', verifyAuthOtp);

// Business Google OAuth Mock
router.get('/google', googleLoginMock);

router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;
