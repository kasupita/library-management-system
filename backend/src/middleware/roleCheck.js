const pool = require('../config/database');

// Security definer function equivalent - checks role without RLS recursion
const hasRole = async (userId, role) => {
  const [rows] = await pool.query(
    'SELECT 1 FROM user_roles WHERE user_id = ? AND role = ?',
    [userId, role]
  );
  return rows.length > 0;
};

const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      // Check if user has any of the allowed roles
      for (const role of allowedRoles) {
        if (await hasRole(req.user.id, role)) {
          return next();
        }
      }

      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions. Required roles: ' + allowedRoles.join(', ') 
      });
    } catch (error) {
      next(error);
    }
  };
};

const isAdmin = requireRole('admin');
const isLibrarian = requireRole('admin', 'librarian');
const isHodOrAbove = requireRole('admin', 'librarian', 'hod');

module.exports = { requireRole, isAdmin, isLibrarian, isHodOrAbove, hasRole };
