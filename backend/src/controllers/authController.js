const { admin, db } = require('../config/firebaseAdmin');
const { validateUser, validateUserUpdate } = require('../models/userModel');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      
      if (!userDoc.exists) {
        // Create user profile if it doesn't exist
        const newUser = {
          uid: req.user.uid,
          email: req.user.email,
          role: req.user.role,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('users').doc(req.user.uid).set(newUser);
        
        return res.json({
          user: newUser
        });
      }

      res.json({
        user: userDoc.data()
      });

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

      await db.collection('users').doc(req.user.uid).update({
        ...value,
        updatedAt: new Date()
      });

      const updatedUser = await db.collection('users').doc(req.user.uid).get();

      logger.info('User profile updated', {
        userId: req.user.uid
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser.data()
      });

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
        return res.status(400).json({
          error: 'Invalid role',
          code: 'INVALID_ROLE'
        });
      }

      // Update user role in Firebase Auth custom claims
      await admin.auth().setCustomUserClaims(userId, { role });

      // Update user role in Firestore
      await db.collection('users').doc(userId).update({
        role,
        updatedAt: new Date()
      });

      logger.info('User role assigned', {
        adminId: req.user.uid,
        userId,
        role
      });

      res.json({
        message: 'Role assigned successfully',
        userId,
        role
      });

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

      res.json({
        users,
        total: users.length
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();