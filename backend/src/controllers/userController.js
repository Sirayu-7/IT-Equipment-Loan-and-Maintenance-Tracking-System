const { validationResult } = require('express-validator');
const userService = require('../services/userService');
const { success, paginated, created, error } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, status, department_id, role_id, sort_by, sort_order } = req.query;
    const result = await userService.getAll({ page, limit, search, status, department_id, role_id, sort_by, sort_order });
    return paginated(res, result.users, result.pagination);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await userService.getById(req.params.id);
    return success(res, user);
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
    const user = await userService.create(req.body);
    return created(res, user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    return success(res, user, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await userService.delete(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const roles = await userService.getRoles();
    return success(res, roles);
  } catch (err) {
    next(err);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const permissions = await userService.getPermissions();
    return success(res, permissions);
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const roles = await userService.createRole(req.body, req.body.permission_ids);
    return created(res, roles);
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const roles = await userService.updateRole(req.params.id, req.body, req.body.permission_ids);
    return success(res, roles, 'Role updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const result = await userService.deleteRole(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const departments = await userService.getDepartments();
    return success(res, departments);
  } catch (err) {
    next(err);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const dept = await userService.createDepartment(req.body);
    return created(res, dept);
  } catch (err) {
    next(err);
  }
};

const updateDepartment = async (req, res, next) => {
  try {
    const dept = await userService.updateDepartment(req.params.id, req.body);
    return success(res, dept, 'Department updated');
  } catch (err) {
    next(err);
  }
};

const deleteDepartment = async (req, res, next) => {
  try {
    const result = await userService.deleteDepartment(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, getRoles, getPermissions, createRole, updateRole, deleteRole, getDepartments, createDepartment, updateDepartment, deleteDepartment };