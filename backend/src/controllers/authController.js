const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { success, error } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE, errors.array());
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return error(res, 'Validation failed', HTTP_STATUS.UNPROCESSABLE, errors.array());
    }

    const { current_password, new_password } = req.body;
    const result = await authService.changePassword(req.user.id, current_password, new_password);
    return success(res, result, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return error(res, 'Refresh token is required', HTTP_STATUS.BAD_REQUEST);
    }
    const result = await authService.refreshToken(refresh_token);
    return success(res, result, 'Token refreshed successfully');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  // With JWT, logout is handled client-side by discarding the token
  return success(res, null, 'Logged out successfully');
};

module.exports = { login, getProfile, changePassword, refreshToken, logout };