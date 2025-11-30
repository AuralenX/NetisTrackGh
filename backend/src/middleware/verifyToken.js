const { admin } = require('../config/firebaseAdmin');
const logger = require('../utils/logger');

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        code: 'MISSING_TOKEN'
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.role || 'technician' // Default role
    };

    logger.info(`User authenticated: ${req.user.email}`, { userId: req.user.uid });
    next();
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

module.exports = verifyToken;