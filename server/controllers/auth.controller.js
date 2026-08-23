import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser } from '../models/user.model.js';
import { smsService } from '../services/sms.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// @desc    Admin / Officer Login
// @route   POST /api/auth/admin/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    // req.user is set in auth.middleware.js
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
export const logout = (req, res) => {
  // Since we use localStorage on the frontend, the server just needs to return success.
  // If we were using httpOnly cookies, we'd clear the cookie here.
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// ---- Mock OTP & Google Logins for Hackathon ----
const authOtpCodes = new Map();

// @desc    Send Auth OTP
// @route   POST /api/auth/otp/send
export const sendAuthOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  
  const isDev = process.env.DEV_MODE === 'true';
  const code = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  
  authOtpCodes.set(phone, code);
  
  try {
    await smsService.sendSms(phone, `Your Kopargaon Smart City auth code is: ${code}`);
    res.json({ success: true, message: `OTP sent to ${phone}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP via SMS gateway' });
  }
};

// @desc    Verify Auth OTP & Login
// @route   POST /api/auth/otp/verify
export const verifyAuthOtp = (req, res) => {
  const { phone, otp, role } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
  
  if (authOtpCodes.get(phone) !== otp) {
    return res.status(401).json({ error: 'Invalid OTP' });
  }
  
  authOtpCodes.delete(phone);

  const user = {
    id: `CITIZEN-${Date.now()}`,
    name: 'Citizen (Verified)',
    email: `${phone}@citizen.local`, // Fallback for components requiring email
    phone,
    role: role || 'Citizen'
  };

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user
  });
};

// @desc    Mock Google Login Redirect
// @route   GET /api/auth/google
export const googleLoginMock = (req, res) => {
  const role = req.query.role || 'Business';
  
  const user = {
    id: `BIZ-${Date.now()}`,
    name: 'Demo Investor',
    email: 'investor@example.com',
    role
  };

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/login?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
};
