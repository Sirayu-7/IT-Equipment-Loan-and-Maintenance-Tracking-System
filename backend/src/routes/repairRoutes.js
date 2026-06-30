const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', repairController.getAll);
router.get('/:id', repairController.getById);

router.post('/', repairController.create);
router.put('/:id/status', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.IT_TECHNICIAN), repairController.updateStatus);
router.put('/:id/close', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.IT_TECHNICIAN), repairController.close);
router.put('/:id/assign', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), repairController.assign);
router.put('/:id/cancel', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), repairController.cancel);

module.exports = router;
