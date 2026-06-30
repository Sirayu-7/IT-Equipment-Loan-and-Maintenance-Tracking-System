const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/admin-summary', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.APPROVER), dashboardController.getAdminSummary);
router.get('/asset-status', dashboardController.getAssetStatusDistribution);
router.get('/borrow-trends', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), dashboardController.getBorrowTrends);
router.get('/repair-trends', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), dashboardController.getRepairTrends);
router.get('/assets-by-category', dashboardController.getAssetsByCategory);
router.get('/overdue-items', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), dashboardController.getOverdueItems);
router.get('/latest-activities', dashboardController.getLatestActivities);
router.get('/warranty-expiring-soon', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), dashboardController.getWarrantyExpiringSoon);

module.exports = router;