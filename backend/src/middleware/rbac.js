const { HTTP_STATUS } = require('../utils/constants');
const { error } = require('../utils/response');

/**
 * Middleware to check if user has at least one of the required roles.
 * Usage: authorize('super_admin', 'it_admin')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roles) {
      return error(res, 'Access denied. No role information.', HTTP_STATUS.FORBIDDEN);
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return error(res, 'Forbidden. You do not have permission to perform this action.', HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
};

/**
 * Middleware to check if user has a specific permission.
 * Usage: requirePermission('assets.create')
 */
const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return error(res, 'Access denied. No permission information.', HTTP_STATUS.FORBIDDEN);
    }

    // Super admin always has all permissions
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    const hasPermission = requiredPermissions.some(
      perm => req.user.permissions.includes(perm)
    );

    if (!hasPermission) {
      return error(res, 'Forbidden. Insufficient permissions.', HTTP_STATUS.FORBIDDEN);
    }

    next();
  };
};

/**
 * Middleware to check if the user owns the resource or is an admin.
 */
const isOwnerOrAdmin = (paramUserIdField = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Access denied.', HTTP_STATUS.FORBIDDEN);
    }

    const isAdmin = req.user.roles.some(
      role => ['super_admin', 'it_admin'].includes(role)
    );

    const targetUserId = parseInt(req.params[paramUserIdField]);
    const isOwner = req.user.id === targetUserId;

    if (isAdmin || isOwner) {
      return next();
    }

    return error(res, 'Forbidden. You can only access your own data.', HTTP_STATUS.FORBIDDEN);
  };
};

module.exports = { authorize, requirePermission, isOwnerOrAdmin };