const express = require('express');
const router = express.Router();
const partController = require('../controllers/partController');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');
const {
  createPartValidation,
  updatePartValidation,
  stockAdjustValidation,
  reservePartValidation,
  consumePartValidation,
} = require('../validators/partValidator');

// Parts CRUD
router.get('/', authenticate, partController.getAllParts);
router.get('/categories', authenticate, partController.getCategories);
router.get('/locations', authenticate, partController.getLocations);
router.get('/suppliers', authenticate, partController.getSuppliers);
router.get('/stock-alerts', authenticate, partController.getStockAlerts);
router.get('/transactions', authenticate, partController.getTransactions);
router.get('/reports/inventory', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), partController.getInventoryReport);
router.get('/reports/repair-parts', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), partController.getRepairPartsReport);
router.get('/:id', authenticate, partController.getPartById);

router.post('/', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), createPartValidation, partController.createPart);
router.post('/categories', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), partController.createCategory);
router.post('/locations', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), partController.createLocation);
router.post('/suppliers', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), partController.createSupplier);

router.put('/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), updatePartValidation, partController.updatePart);
router.put('/:id/stock-adjust', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.INVENTORY_OFFICER), stockAdjustValidation, partController.adjustStock);

// Reservations
router.get('/reservations/repair/:repairRequestId', authenticate, partController.getReservationsByRepair);
router.post('/reservations', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.IT_TECHNICIAN, ROLES.INVENTORY_OFFICER), reservePartValidation, partController.reservePart);
router.delete('/reservations/:id', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.IT_TECHNICIAN, ROLES.INVENTORY_OFFICER), partController.cancelReservation);

// Consumptions
router.get('/consumptions/repair/:repairRequestId', authenticate, partController.getConsumptionsByRepair);
router.post('/consumptions', authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.IT_ADMIN, ROLES.IT_TECHNICIAN, ROLES.INVENTORY_OFFICER), consumePartValidation, partController.consumePart);

module.exports = router;