/* ==========================================================================
   AUTHENTICATION & ROLE AUTHORIZATION MIDDLEWARE (middleware/auth.js)
   --------------------------------------------------------------------------
   Verifies Bearer token, fetches active user, and enforces role access:
   - ADMIN: Full access to Customer & Product CRUD
   - STAFF: Read/search access for billing + Quick-Add customer
   ========================================================================== */

const { getCollection, ObjectId } = require('../mongodb');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer token_')) {
      const parts = authHeader.split('_');
      if (parts.length >= 3) {
        userId = parts[2];
      }
    }

    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    const usersCol = getCollection('users');
    const user = await usersCol.findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session token. User account not found.'
      });
    }

    const role = (user.role && String(user.role).toUpperCase() === 'ADMIN') ? 'ADMIN' : 'STAFF';
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role
    };

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: err.message
    });
  }
}

// Role Guard: require one of the specified roles
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = String(req.user.role).toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Administrator privileges required for this action. Your role (${userRole}) is not permitted.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
