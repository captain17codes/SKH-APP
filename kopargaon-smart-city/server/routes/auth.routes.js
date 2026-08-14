import express from 'express';
import passport from 'passport';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { userModel } from '../models/user.model.js';

const router = express.Router();

// --- OTP Flow ---
router.post('/otp/send', authController.sendOtp);
router.post('/otp/verify', authController.verifyOtp);

// --- Admin Login ---
router.post('/admin/login', authController.adminLogin);

// --- Google OAuth ---
// The frontend will link to /api/auth/google?role=Citizen or Business
router.get('/google', (req, res, next) => {
  const role = req.query.role || 'Citizen';
  
  if (process.env.DEV_MODE === 'true') {
    // In dev mode, immediately redirect to a mock callback to skip real Google OAuth
    return res.redirect(`/api/auth/google/dev-callback?role=${role}`);
  }

  const state = Buffer.from(JSON.stringify({ role })).toString('base64');
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state 
  })(req, res, next);
});

// DEV_MODE Mock Callback
router.get('/google/dev-callback', (req, res) => {
  const role = req.query.role || 'Citizen';
  
  // Actually create the user in the mock DB so /auth/me can find them
  const user = userModel.createUser({
    name: 'Dev Google User',
    role: role,
    google_id: `mock-google-${Date.now()}`,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  });
  
  req.user = user;
  
  // Hand off to the real callback handler
  return authController.googleCallbackHandler(req, res);
});

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=true' }),
  authController.googleCallbackHandler
);

// --- Session Management ---
router.get('/me', requireAuth, authController.me);
router.post('/logout', authController.logout);

export default router;
