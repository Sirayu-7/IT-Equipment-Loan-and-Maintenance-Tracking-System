const borrowService = require('../services/borrowService');
const { success, paginated, created, error } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, status, requester_id, priority, sort_by, sort_order } = req.query;
    const result = await borrowService.getAll({ page, limit, search, status, requester_id, priority, sort_by, sort_order, user: req.user });
    return paginated(res, result.borrow_requests, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const request = await borrowService.getById(req.params.id);
    return success(res, request);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await borrowService.create(req.body, req.user.id);
    return created(res, result);
  } catch (err) {
    next(err);
  }
};

const submit = async (req, res, next) => {
  try {
    const result = await borrowService.submit(req.params.id, req.user.id);
    return success(res, result, 'Request submitted for approval');
  } catch (err) {
    next(err);
  }
};

const approve = async (req, res, next) => {
  try {
    const result = await borrowService.approve(req.params.id, req.user.id, req.body.notes);
    return success(res, result, 'Request approved');
  } catch (err) {
    next(err);
  }
};

const reject = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return error(res, 'Rejection reason is required', HTTP_STATUS.BAD_REQUEST);
    }
    const result = await borrowService.reject(req.params.id, req.user.id, reason);
    return success(res, result, 'Request rejected');
  } catch (err) {
    next(err);
  }
};

const confirmBorrow = async (req, res, next) => {
  try {
    const result = await borrowService.confirmBorrow(req.params.id, req.user.id);
    return success(res, result, 'Borrow confirmed');
  } catch (err) {
    next(err);
  }
};

const returnAssets = async (req, res, next) => {
  try {
    const result = await borrowService.returnAssets(req.params.id, req.user.id, req.body);
    return success(res, result, 'Return processed');
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const result = await borrowService.cancel(req.params.id, req.user.id);
    return success(res, result, 'Request cancelled');
  } catch (err) {
    next(err);
  }
};

const getOverdueItems = async (req, res, next) => {
  try {
    const items = await borrowService.getOverdueItems();
    return success(res, items);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, submit, approve, reject, confirmBorrow, returnAssets, cancel, getOverdueItems };