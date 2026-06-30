const dashboardService = require('../services/dashboardService');
const { success } = require('../utils/response');

const getAdminSummary = async (req, res, next) => {
  try {
    const { department_id, date_from, date_to } = req.query;
    const summary = await dashboardService.getAdminSummary({ department_id, date_from, date_to, user: req.user });
    return success(res, summary);
  } catch (err) {
    next(err);
  }
};

const getAssetStatusDistribution = async (req, res, next) => {
  try {
    const distribution = await dashboardService.getAssetStatusDistribution();
    return success(res, distribution);
  } catch (err) {
    next(err);
  }
};

const getBorrowTrends = async (req, res, next) => {
  try {
    const { days = 30, department_id } = req.query;
    const trends = await dashboardService.getBorrowTrends({ days, department_id });
    return success(res, trends);
  } catch (err) {
    next(err);
  }
};

const getRepairTrends = async (req, res, next) => {
  try {
    const { days = 30, department_id } = req.query;
    const trends = await dashboardService.getRepairTrends({ days, department_id });
    return success(res, trends);
  } catch (err) {
    next(err);
  }
};

const getAssetsByCategory = async (req, res, next) => {
  try {
    const categories = await dashboardService.getAssetsByCategory();
    return success(res, categories);
  } catch (err) {
    next(err);
  }
};

const getOverdueItems = async (req, res, next) => {
  try {
    const items = await dashboardService.getOverdueItems();
    return success(res, items);
  } catch (err) {
    next(err);
  }
};

const getLatestActivities = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const activities = await dashboardService.getLatestActivities({ limit, user: req.user });
    return success(res, activities);
  } catch (err) {
    next(err);
  }
};

const getWarrantyExpiringSoon = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const assets = await dashboardService.getWarrantyExpiringSoon({ days });
    return success(res, assets);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAdminSummary, getAssetStatusDistribution, getBorrowTrends, getRepairTrends, getAssetsByCategory, getOverdueItems, getLatestActivities, getWarrantyExpiringSoon };