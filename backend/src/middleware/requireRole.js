const logger = require('../utils/logger');

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role permission denied', {
        userId: req.user.uid,
        userRole,
        requiredRoles: allowedRoles
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};

// Role definitions
const ROLES = {
  TECHNICIAN: 'technician',
  SUPERVISOR: 'supervisor',
  ADMIN: 'admin'
};

module.exports = { requireRole, ROLES };