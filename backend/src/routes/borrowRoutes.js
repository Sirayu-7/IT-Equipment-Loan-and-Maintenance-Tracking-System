const express = require('express');
const router = express.Router();
const borrowController = require('../controllers/borrowController');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', borrowController.getAll);
router.get('/overdue', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), borrowController.getOverdueItems);
router.get('/:id', borrowController.getById);

router.post('/', borrowController.create);
router.put('/:id/submit', borrowController.submit);
router.put('/:id/approve', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.APPROVER), borrowController.approve);
router.put('/:id/reject', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.APPROVER), borrowController.reject);
router.put('/:id/borrow-confirm', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), borrowController.confirmBorrow);
router.put('/:id/return', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), borrowController.returnAssets);
router.put('/:id/cancel', borrowController.cancel);

module.exports = router;