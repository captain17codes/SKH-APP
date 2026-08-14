import jwt from 'jsonwebtoken';
import { userModel } from '../models/user.model.js';
import { otpService } from '../services/otp.service.js';

const generateTokenAndSetCookie = (res, user) => {
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret_kopargaon',
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return token;
};

export const authController = {
  // Mobile OTP Login
  sendOtp: async (req, res) => {
    try {
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ error: 'Phone number is required' });

      const result = await otpService.sendOtp(phone);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  verifyOtp: (req, res) => {
    try {
      const { phone, otp, role = 'Citizen' } = req.body;
      if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

      const isValid = otpService.verifyOtp(phone, otp);
      if (!isValid) return res.status(401).json({ error: 'Invalid or expired OTP' });

      // Find or create user
      let user = userModel.findUserByPhone(phone);
      if (!user) {
        user = userModel.createUser({
          phone,
          role,
          phone_verified: true,
          name: 'Citizen ' + phone.substring(phone.length - 4) // simple fallback name
        });
      }

      generateTokenAndSetCookie(res, user);
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, avatar: user.avatar } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Admin Email/Password Login
  adminLogin: (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const user = userModel.findUserByEmail(email);
      if (!user || !['Administrator', 'Business'].includes(user.role) || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      generateTokenAndSetCookie(res, user);
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, avatar: user.avatar } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Google OAuth callback logic is mostly handled by passport, but we set the cookie here
  googleCallbackHandler: (req, res) => {
    const user = req.user;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    if (!user) return res.redirect(`${clientUrl}/login?error=oauth_failed`);

    generateTokenAndSetCookie(res, user);

    // Redirect to correct dashboard on the frontend
    if (user.role === 'Administrator') return res.redirect(`${clientUrl}/dashboard`);
    if (user.role === 'Business') return res.redirect(`${clientUrl}/business/dashboard`);
    return res.redirect(`${clientUrl}/citizen/dashboard`);
  },

  // Get current session
  me: (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      // req.user is attached by auth.middleware.js (which decodes JWT)
      const user = userModel.findUserById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      res.json({ user: { id: user.id, name: user.name, role: user.role, avatar: user.avatar, department: user.department } });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  logout: (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out' });
  }
};
