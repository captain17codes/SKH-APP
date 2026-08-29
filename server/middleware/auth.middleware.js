import jwt from 'jsonwebtoken';
import { getUserById } from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, JWT_SECRET);

      req.user = await getUserById(decoded.userId);

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error('[AUTH ERROR]', error.message);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const optionalProtect = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = await getUserById(decoded.userId);
    } catch (error) {
      // Continue without user
      req.user = null;
    }
  }
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated' 
      });
    }

    const userRole = req.user.role;
    // Normalize role checks (e.g. 'Admin' <-> 'Administrator')
    const normalizedUserRole = userRole === 'Admin' ? 'Administrator' : userRole;
    
    const isAuthorized = roles.some(role => {
      const normalizedAllowedRole = role === 'Admin' ? 'Administrator' : role;
      return userRole === role || normalizedUserRole === normalizedAllowedRole;
    });

    if (!isAuthorized) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    next();
  };
};
