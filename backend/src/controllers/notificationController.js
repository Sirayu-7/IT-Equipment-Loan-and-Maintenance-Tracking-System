const notificationService = require('../services/notificationService');
const { success, paginated } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, is_read } = req.query;
    const result = await notificationService.getByUser(req.user.id, { page, limit, is_read });
    return paginated(res, result.notifications, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    return success(res, { count });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getUnreadCount, markAsRead, markAllAsRead };