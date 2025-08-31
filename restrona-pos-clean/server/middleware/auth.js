const { auth } = require('../config/firebase');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'No authorization token provided'
      });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
};

const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated'
        });
      }

      // Get user data from Firestore to check role
      const { db } = require('../config/firebase');
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      
      if (!userDoc.exists) {
        return res.status(403).json({
          error: 'User not found',
          message: 'User data not found in database'
        });
      }

      const userData = userDoc.data();
      const userRole = userData.role;

      if (!roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required roles: ${roles.join(', ')}. User role: ${userRole}`
        });
      }

      req.userData = userData;
      next();
    } catch (error) {
      console.error('Role verification error:', error);
      return res.status(500).json({
        error: 'Role verification failed',
        message: 'Internal server error'
      });
    }
  };
};

const requirePermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated'
        });
      }

      // Get user data from Firestore to check permissions
      const { db } = require('../config/firebase');
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      
      if (!userDoc.exists) {
        return res.status(403).json({
          error: 'User not found',
          message: 'User data not found in database'
        });
      }

      const userData = userDoc.data();
      const userPermissions = userData.permissions || [];

      const hasPermission = permissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required permissions: ${permissions.join(', ')}`
        });
      }

      req.userData = userData;
      next();
    } catch (error) {
      console.error('Permission verification error:', error);
      return res.status(500).json({
        error: 'Permission verification failed',
        message: 'Internal server error'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission
};
