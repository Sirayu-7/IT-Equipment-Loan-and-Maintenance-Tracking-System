const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.getAll);
router.get('/roles', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.getRoles);
router.get('/permissions', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.getPermissions);
router.get('/departments', userController.getDepartments);
router.get('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.getById);

router.post('/', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.create);
router.post('/roles', authorize(ROLES.SUPER_ADMIN), userController.createRole);
router.post('/departments', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.createDepartment);

router.put('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.update);
router.put('/roles/:id', authorize(ROLES.SUPER_ADMIN), userController.updateRole);
router.put('/departments/:id', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), userController.updateDepartment);

router.delete('/:id', authorize(ROLES.SUPER_ADMIN), userController.remove);
router.delete('/roles/:id', authorize(ROLES.SUPER_ADMIN), userController.deleteRole);
router.delete('/departments/:id', authorize(ROLES.SUPER_ADMIN), userController.deleteDepartment);

module.exports = router;