const partService = require('../services/partService');
const { successResponse, errorResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../utils/constants');

class PartController {
  // ==================== PARTS CRUD ====================

  async getAllParts(req, res) {
    try {
      const result = await partService.getAllParts({ ...req.query, user: req.user });
      return successResponse(res, HTTP_STATUS.OK, 'Parts retrieved successfully', result);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async getPartById(req, res) {
    try {
      const part = await partService.getPartById(req.params.id);
      return successResponse(res, HTTP_STATUS.OK, 'Part retrieved successfully', part);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async createPart(req, res) {
    try {
      const part = await partService.createPart(req.body, req.user.id);
      return successResponse(res, HTTP_STATUS.CREATED, 'Part created successfully', part);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async updatePart(req, res) {
    try {
      const part = await partService.updatePart(req.params.id, req.body, req.user.id);
      return successResponse(res, HTTP_STATUS.OK, 'Part updated successfully', part);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async adjustStock(req, res) {
    try {
      const part = await partService.adjustStock(req.params.id, req.body, req.user.id);
      return successResponse(res, HTTP_STATUS.OK, 'Stock adjusted successfully', part);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  // ==================== RESERVATIONS ====================

  async reservePart(req, res) {
    try {
      const reservation = await partService.reservePart(req.body, req.user.id);
      return successResponse(res, HTTP_STATUS.CREATED, 'Part reserved successfully', reservation);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async cancelReservation(req, res) {
    try {
      const reservation = await partService.cancelReservation(req.params.id, req.user.id);
      return successResponse(res, HTTP_STATUS.OK, 'Reservation cancelled successfully', reservation);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async getReservationsByRepair(req, res) {
    try {
      const reservations = await partService.getReservationsByRepair(req.params.repairRequestId);
      return successResponse(res, HTTP_STATUS.OK, 'Reservations retrieved successfully', reservations);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  // ==================== CONSUMPTIONS ====================

  async consumePart(req, res) {
    try {
      const consumption = await partService.consumePart(req.body, req.user.id);
      return successResponse(res, HTTP_STATUS.CREATED, 'Part consumed successfully', consumption);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async getConsumptionsByRepair(req, res) {
    try {
      const consumptions = await partService.getConsumptionsByRepair(req.params.repairRequestId);
      return successResponse(res, HTTP_STATUS.OK, 'Consumptions retrieved successfully', consumptions);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(req, res) {
    try {
      const result = await partService.getTransactions(req.query);
      return successResponse(res, HTTP_STATUS.OK, 'Transactions retrieved successfully', result);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  // ==================== ALERTS ====================

  async getStockAlerts(req, res) {
    try {
      const alerts = await partService.getStockAlerts();
      return successResponse(res, HTTP_STATUS.OK, 'Stock alerts retrieved successfully', alerts);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  // ==================== REFERENCE DATA ====================

  async getCategories(req, res) {
    try {
      const categories = await partService.getCategories();
      return successResponse(res, HTTP_STATUS.OK, 'Categories retrieved successfully', categories);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async createCategory(req, res) {
    try {
      const category = await partService.createCategory(req.body);
      return successResponse(res, HTTP_STATUS.CREATED, 'Category created successfully', category);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async getLocations(req, res) {
    try {
      const locations = await partService.getLocations();
      return successResponse(res, HTTP_STATUS.OK, 'Locations retrieved successfully', locations);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async createLocation(req, res) {
    try {
      const location = await partService.createLocation(req.body);
      return successResponse(res, HTTP_STATUS.CREATED, 'Location created successfully', location);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async getSuppliers(req, res) {
    try {
      const suppliers = await partService.getSuppliers();
      return successResponse(res, HTTP_STATUS.OK, 'Suppliers retrieved successfully', suppliers);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async createSupplier(req, res) {
    try {
      const supplier = await partService.createSupplier(req.body);
      return successResponse(res, HTTP_STATUS.CREATED, 'Supplier created successfully', supplier);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  // ==================== REPORTS ====================

  async getInventoryReport(req, res) {
    try {
      const report = await partService.getInventoryReport();
      return successResponse(res, HTTP_STATUS.OK, 'Inventory report retrieved successfully', report);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  async getRepairPartsReport(req, res) {
    try {
      const report = await partService.getRepairPartsReport(req.query);
      return successResponse(res, HTTP_STATUS.OK, 'Repair parts report retrieved successfully', report);
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

module.exports = new PartController();