const { validationResult } = require('express-validator');
const assetService = require('../services/assetService');
const { success, paginated, created, error } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, category_id, location_id, asset_status, condition_status, sort_by, sort_order } = req.query;
    const result = await assetService.getAll({ page, limit, search, category_id, location_id, asset_status, condition_status, sort_by, sort_order });
    return paginated(res, result.assets, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const asset = await assetService.getById(req.params.id);
    return success(res, asset);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE, errors.array());
    }
    const asset = await assetService.create({ ...req.body, created_by: req.user.id });
    return created(res, asset);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE, errors.array());
    }
    const asset = await assetService.update(req.params.id, { ...req.body, updated_by: req.user.id });
    return success(res, asset, 'Asset updated successfully');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await assetService.delete(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await assetService.getCategories();
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const category = await assetService.createCategory(req.body);
    return created(res, category);
  } catch (err) {
    next(err);
  }
};

const getLocations = async (req, res, next) => {
  try {
    const locations = await assetService.getLocations();
    return success(res, locations);
  } catch (err) {
    next(err);
  }
};

const createLocation = async (req, res, next) => {
  try {
    const location = await assetService.createLocation(req.body);
    return created(res, location);
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await assetService.getHistory(req.params.id, { page, limit });
    return paginated(res, result.history, result.pagination);
  } catch (err) {
    next(err);
  }
};

const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', HTTP_STATUS.BAD_REQUEST);
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    await assetService.update(req.params.id, { photo_url: photoUrl, updated_by: req.user.id });
    return success(res, { photo_url: photoUrl }, 'Photo uploaded successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, getCategories, createCategory, getLocations, createLocation, getHistory, uploadPhoto };