import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByEmail, createUser } from '../models/user.model.js';
import { smsService } from '../services/sms.service.js';
import { query } from '../config/db.js';
import { OAuth2Client } from 'google-auth-library';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

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

// @desc    Send Auth OTP
// @route   POST /api/auth/otp/send
export const sendAuthOtp = async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  
  const isDev = process.env.DEV_MODE === 'true';
  const code = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
  
  try {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await query(
      `INSERT INTO otp_codes (phone, otp, expires_at) VALUES ($1, $2, $3) 
       ON CONFLICT (phone) DO UPDATE SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at`,
      [phone, code, expiresAt]
    );

    await smsService.sendSms(phone, `Your Kopargaon Smart City auth code is: ${code}`);
    res.json({ success: true, message: `OTP sent to ${phone}` });
  } catch (error) {
    console.error('OTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP or save to database' });
  }
};

// @desc    Verify Auth OTP & Login
// @route   POST /api/auth/otp/verify
export const verifyAuthOtp = async (req, res) => {
  const { phone, otp, role } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });
  
  try {
    const otpResult = await query('SELECT otp, expires_at FROM otp_codes WHERE phone = $1', [phone]);
    
    if (otpResult.rows.length === 0 || otpResult.rows[0].otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }
    
    if (new Date() > new Date(otpResult.rows[0].expires_at)) {
      return res.status(401).json({ error: 'OTP Expired' });
    }
    
    await query('DELETE FROM otp_codes WHERE phone = $1', [phone]);

    // Create user if not exists
    let userResult = await query('SELECT * FROM users WHERE phone = $1', [phone]);
    let user;

    if (userResult.rows.length === 0) {
      const newUser = {
        id: `CITIZEN-${Date.now()}`,
        name: 'Citizen (Verified)',
        email: `${phone}@citizen.local`,
        phone,
        role: role || 'Citizen',
        password_hash: null
      };
      user = await createUser(newUser);
    } else {
      user = userResult.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, phone: user.phone },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Internal Server Error during OTP verification' });
  }
};

// @desc    Google OAuth Verify Endpoint
// @route   POST /api/auth/google/verify
export const googleVerify = async (req, res) => {
  const { credential, role } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential required' });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, name, sub } = payload;
    let user = await getUserByEmail(email);

    if (!user) {
      const newUser = {
        id: `GOOGLE-${sub}`,
        name,
        email,
        phone: null,
        role: role || 'Business',
        password_hash: null
      };
      user = await createUser(newUser);
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ success: true, token, user });
  } catch (error) {
    console.error('Google verification error:', error);
    res.status(401).json({ error: 'Invalid Google credential' });
  }
};
