const { admin, db } = require('../config/firebaseAdmin');
const { validateUser, validateUserUpdate } = require('../models/userModel');
const { 
  validatePasswordReset, 
  validateChangePassword,
  validateRefreshToken,
  validateSecurityLog,
  validateLogout 
} = require('../models/authModel');
const logger = require('../utils/logger');
const axios = require('axios');

class AuthController {
  constructor() {
    // Optionally bind methods if needed elsewhere
  }

  /**
   * Verify user credentials using Firebase REST API
   */
  async verifyCredentials(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format',
          code: 'INVALID_EMAIL'
        });
      }

      // Get Firebase API key from environment
      const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY;
      
      if (!FIREBASE_API_KEY) {
        logger.error('Firebase API key not configured');
        return res.status(500).json({
          error: 'Authentication service configuration error',
          code: 'SERVER_ERROR'
        });
      }

      try {
        // Use Firebase Identity Toolkit REST API to verify email/password
        const response = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          {
            email: email,
            password: password,
            returnSecureToken: true
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        const { 
          localId, 
          email: userEmail, 
          idToken, 
          refreshToken, 
          expiresIn 
        } = response.data;

        logger.info('User credentials verified successfully via Firebase REST API', {
          userId: localId,
          email: email
        });

        // Get or create user profile in Firestore
        let userProfile = await this.getOrCreateUserProfile(localId, userEmail);

        // Return user details and tokens
        res.json({
          message: 'Login successful',
          user: {
            uid: localId,
            email: userEmail,
            role: userProfile.role,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            phoneNumber: userProfile.phoneNumber,
            assignedSites: userProfile.assignedSites || [],
            isActive: userProfile.isActive
          },
          token: idToken,
          refreshToken: refreshToken,
          expiresIn: expiresIn
        });

      } catch (firebaseError) {
        // Call the fixed arrow function version
        await this.handleFirebaseError(firebaseError, res, email);
      }

    } catch (error) {
      logger.error('Unexpected error in verifyCredentials', {
        error: error.message,
        stack: error.stack,
        email: req.body.email
      });
      
      res.status(500).json({
        error: 'Authentication service temporarily unavailable',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }

  /**
   * Get or create user profile in Firestore
   */
  async getOrCreateUserProfile(uid, email) {
    try {
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (userDoc.exists) {
        return userDoc.data();
      }

      const userRecord = await admin.auth().getUser(uid);
      const newUserProfile = {
        uid: uid,
        email: email,
        role: userRecord.customClaims?.role || 'technician',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').doc(uid).set(newUserProfile);
      logger.info('New user profile created in Firestore', { userId: uid, email: email });

      return newUserProfile;

    } catch (error) {
      logger.error('Error creating user profile', { userId: uid, error: error.message });
      return {
        uid: uid,
        email: email,
        role: 'technician',
        isActive: true,
        assignedSites: []
      };
    }
  }

  /**
   * Handle Firebase REST API errors
   * Converted to arrow function to preserve `this` binding
   */
  handleFirebaseError = async (error, res, email) => {
    const errorCode = error.response?.data?.error?.message;
    
    logger.warn('Firebase authentication failed', {
      errorCode: errorCode,
      email: email,
      status: error.response?.status
    });

    switch (errorCode) {
      case 'EMAIL_NOT_FOUND':
      case 'INVALID_PASSWORD':
      case 'INVALID_EMAIL':
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });

      case 'USER_DISABLED':
        return res.status(401).json({
          error: 'User account has been disabled',
          code: 'USER_DISABLED'
        });

      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return res.status(429).json({
          error: 'Too many failed attempts. Please try again later.',
          code: 'TOO_MANY_ATTEMPTS'
        });

      case 'OPERATION_NOT_ALLOWED':
        return res.status(403).json({
          error: 'Password sign-in is disabled for this project',
          code: 'OPERATION_NOT_ALLOWED'
        });

      default:
        if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
          logger.error('Firebase service unavailable', {
            error: error.message,
            status: error.response?.status
          });
          return res.status(503).json({
            error: 'Authentication service temporarily unavailable',
            code: 'SERVICE_UNAVAILABLE'
          });
        }

        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
    }
  };

  /**
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (!userDoc.exists) {
        const newUser = {
          uid: req.user.uid,
          email: req.user.email,
          role: req.user.role,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await db.collection('users').doc(req.user.uid).set(newUser);
        return res.json({ user: newUser });
      }

      res.json({ user: userDoc.data() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res, next) {
    try {
      const { error, value } = validateUserUpdate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      await db.collection('users').doc(req.user.uid).update({ ...value, updatedAt: new Date() });
      const updatedUser = await db.collection('users').doc(req.user.uid).get();

      logger.info('User profile updated', { userId: req.user.uid });
      res.json({ message: 'Profile updated successfully', user: updatedUser.data() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign role to user (Admin only)
   */
  async assignRole(req, res, next) {
    try {
      const { userId, role } = req.body;
      if (!['technician', 'supervisor', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role', code: 'INVALID_ROLE' });
      }

      await admin.auth().setCustomUserClaims(userId, { role });
      await db.collection('users').doc(userId).update({ role, updatedAt: new Date() });

      logger.info('User role assigned', { adminId: req.user.uid, userId, role });
      res.json({ message: 'Role assigned successfully', userId, role });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users (Admin only)
   */
  async getUsers(req, res, next) {
    try {
      const snapshot = await db.collection('users').get();
      const users = snapshot.docs.map(doc => doc.data());
      res.json({ users, total: users.length });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { error, value } = validateRefreshToken(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const { refreshToken } = value;

      // Get Firebase API key from environment
      const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY;
      
      if (!FIREBASE_API_KEY) {
        return res.status(500).json({
          error: 'Authentication service configuration error',
          code: 'SERVER_ERROR'
        });
      }

      try {
        // Use Firebase REST API to refresh token
        const response = await axios.post(
          `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
          {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
          },
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        const { 
          id_token: idToken, 
          refresh_token: newRefreshToken, 
          expires_in: expiresIn,
          user_id: userId 
        } = response.data;

        // Get user profile
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
          return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        const user = userDoc.data();

        logger.info('Token refreshed successfully', {
          userId,
          email: user.email
        });

        res.json({
          message: 'Token refreshed successfully',
          token: idToken,
          refreshToken: newRefreshToken,
          expiresIn,
          user: {
            uid: userId,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            assignedSites: user.assignedSites || []
          }
        });

      } catch (firebaseError) {
        logger.error('Firebase token refresh failed', {
          error: firebaseError.response?.data?.error?.message || firebaseError.message
        });

        return res.status(401).json({
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(req, res, next) {
    try {
      const { error, value } = validatePasswordReset(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const { email } = value;

      // Get Firebase API key from environment
      const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY;
      
      if (!FIREBASE_API_KEY) {
        return res.status(500).json({
          error: 'Authentication service configuration error',
          code: 'SERVER_ERROR'
        });
      }

      try {
        // Use Firebase REST API to send password reset email
        await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
          {
            requestType: 'PASSWORD_RESET',
            email: email
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        // Log password reset request
        await db.collection('securityLogs').add({
          event: 'password_reset_requested',
          email: email,
          timestamp: new Date(),
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        logger.info('Password reset email sent', { email });

        // Return generic success message (for security)
        res.json({
          message: 'If an account exists with this email, a password reset link has been sent.',
          code: 'RESET_EMAIL_SENT'
        });

      } catch (firebaseError) {
        // Even if Firebase returns an error, we return success for security reasons
        logger.warn('Password reset attempt', {
          email,
          error: firebaseError.response?.data?.error?.message
        });

        res.json({
          message: 'If an account exists with this email, a password reset link has been sent.',
          code: 'RESET_EMAIL_SENT'
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   */
  async changePassword(req, res, next) {
    try {
      // User must be authenticated to change password
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHENTICATED'
        });
      }

      const { error, value } = validateChangePassword(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const { currentPassword, newPassword } = value;
      const { uid, email } = req.user;

      // Get Firebase API key from environment
      const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY;
      
      if (!FIREBASE_API_KEY) {
        return res.status(500).json({
          error: 'Authentication service configuration error',
          code: 'SERVER_ERROR'
        });
      }

      try {
        // First, verify current password by trying to sign in
        const verifyResponse = await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
          {
            email: email,
            password: currentPassword,
            returnSecureToken: true
          }
        );

        // If verification successful, update password
        const idToken = verifyResponse.data.idToken;

        await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${FIREBASE_API_KEY}`,
          {
            idToken: idToken,
            password: newPassword,
            returnSecureToken: true
          }
        );

        // Log password change
        await db.collection('securityLogs').add({
          event: 'password_changed',
          userId: uid,
          email: email,
          timestamp: new Date(),
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        logger.info('Password changed successfully', { userId: uid, email });

        res.json({
          message: 'Password changed successfully',
          code: 'PASSWORD_CHANGED'
        });

      } catch (firebaseError) {
        const errorCode = firebaseError.response?.data?.error?.message;
        
        if (errorCode === 'INVALID_PASSWORD') {
          return res.status(401).json({
            error: 'Current password is incorrect',
            code: 'INVALID_CURRENT_PASSWORD'
          });
        }

        logger.error('Password change failed', {
          userId: uid,
          error: errorCode || firebaseError.message
        });

        return res.status(400).json({
          error: 'Password change failed',
          code: 'PASSWORD_CHANGE_FAILED'
        });
      }

    } catch (error) {
      next(error);
    }
  }

  /**
   * Log security event from frontend
   */
  async logSecurityEvent(req, res, next) {
    try {
      const { error, value } = validateSecurityLog(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const securityLog = {
        ...value,
        timestamp: new Date(),
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user?.uid || value.userId
      };

      // Store in Firestore
      await db.collection('securityLogs').add(securityLog);

      logger.info('Security event logged', {
        event: securityLog.event,
        userId: securityLog.userId,
        email: securityLog.email
      });

      res.status(201).json({
        message: 'Security event logged successfully',
        timestamp: securityLog.timestamp
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * User logout (optional backend tracking)
   */
  async logout(req, res, next) {
    try {
      const { error, value } = validateLogout(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      if (req.user) {
        // Log logout event
        await db.collection('securityLogs').add({
          event: 'user_logout',
          userId: req.user.uid,
          email: req.user.email,
          reason: value.reason || 'user_initiated',
          deviceId: value.deviceId,
          timestamp: new Date(),
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        logger.info('User logged out', {
          userId: req.user.uid,
          email: req.user.email,
          reason: value.reason
        });
      }

      // Note: JWT tokens are stateless, so we can't invalidate them
      // In a production system, you might want to implement a token blacklist
      // or use refresh token rotation

      res.json({
        message: 'Logout successful',
        code: 'LOGOUT_SUCCESS'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's security logs (User can see their own, Admin can see all)
   */
  async getSecurityLogs(req, res, next) {
    try {
      const { limit = 50, offset = 0, startDate, endDate } = req.query;
      const { uid, role } = req.user;

      let query = db.collection('securityLogs');

      // Regular users can only see their own logs
      if (role !== 'admin') {
        query = query.where('userId', '==', uid);
      }

      // Apply date filters if provided
      if (startDate) {
        query = query.where('timestamp', '>=', new Date(startDate));
      }
      if (endDate) {
        query = query.where('timestamp', '<=', new Date(endDate));
      }

      query = query.orderBy('timestamp', 'desc')
                   .limit(parseInt(limit))
                   .offset(parseInt(offset));

      const snapshot = await query.get();
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Format timestamp for display
        timestamp: doc.data().timestamp?.toDate().toISOString()
      }));

      // Get total count for pagination
      let totalCount = 0;
      if (role !== 'admin') {
        const countQuery = db.collection('securityLogs').where('userId', '==', uid);
        if (startDate) countQuery.where('timestamp', '>=', new Date(startDate));
        if (endDate) countQuery.where('timestamp', '<=', new Date(endDate));
        const countSnapshot = await countQuery.get();
        totalCount = countSnapshot.size;
      } else {
        const countQuery = db.collection('securityLogs');
        if (startDate) countQuery.where('timestamp', '>=', new Date(startDate));
        if (endDate) countQuery.where('timestamp', '<=', new Date(endDate));
        const countSnapshot = await countQuery.get();
        totalCount = countSnapshot.size;
      }

      res.json({
        logs,
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
