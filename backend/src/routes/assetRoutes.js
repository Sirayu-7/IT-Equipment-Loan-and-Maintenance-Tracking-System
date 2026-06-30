const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { createAssetValidation, updateAssetValidation } = require('../validators/assetValidator');

const { ROLES } = require('../utils/constants');

router.use(authenticate);

router.get('/', assetController.getAll);
router.get('/categories', assetController.getCategories);
router.get('/locations', assetController.getLocations);
router.get('/:id', assetController.getById);
router.get('/:id/history', assetController.getHistory);

router.post('/', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), createAssetValidation, assetController.create);
router.put('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), updateAssetValidation, assetController.update);
router.delete('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), assetController.remove);

router.post('/categories', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), assetController.createCategory);
router.post('/locations', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), assetController.createLocation);

router.post('/:id/photo', authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN), upload.single('photo'), assetController.uploadPhoto);

module.exports = router;