const repairService = require('../services/repairService');
const { success, paginated, created, error } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, status, priority, assigned_to, asset_id, sort_by, sort_order } = req.query;
    const result = await repairService.getAll({ page, limit, search, status, priority, assigned_to, asset_id, sort_by, sort_order, user: req.user });
    return paginated(res, result.repair_requests, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const request = await repairService.getById(req.params.id);
    return success(res, request);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await repairService.create(req.body, req.user.id);
    return created(res, result);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, comment } = req.body;
    if (!status) {
      return error(res, 'Status is required', HTTP_STATUS.BAD_REQUEST);
    }
    const result = await repairService.updateStatus(req.params.id, req.user.id, status, comment);
    return success(res, result, 'Status updated');
  } catch (err) {
    next(err);
  }
};

const close = async (req, res, next) => {
  try {
    const { resolution, cost_actual } = req.body;
    const result = await repairService.close(req.params.id, req.user.id, resolution, cost_actual);
    return success(res, result, 'Repair closed');
  } catch (err) {
    next(err);
  }
};

const assign = async (req, res, next) => {
  try {
    const { technician_id } = req.body;
    if (!technician_id) {
      return error(res, 'Technician ID is required', HTTP_STATUS.BAD_REQUEST);
    }
    const result = await repairService.assign(req.params.id, req.user.id, technician_id);
    return success(res, result, 'Technician assigned');
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await repairService.cancel(req.params.id, req.user.id, reason);
    return success(res, result, 'Repair cancelled');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, updateStatus, close, assign, cancel };
