const { body } = require('express-validator');

const createAssetValidation = [
  body('asset_code').notEmpty().withMessage('Asset code is required'),
  body('asset_name').notEmpty().withMessage('Asset name is required'),
  body('category_id').optional().isInt().withMessage('Category must be an integer'),
  body('location_id').optional().isInt().withMessage('Location must be an integer'),
  body('purchase_date').optional().isDate().withMessage('Invalid date format'),
  body('warranty_end_date').optional().isDate().withMessage('Invalid date format'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('asset_status').optional().isIn(['available','reserved','borrowed','under_repair','pending_repair','lost','damaged','retired']),
  body('condition_status').optional().isIn(['new','good','fair','poor','damaged']),
];

const updateAssetValidation = [
  body('asset_name').optional().notEmpty().withMessage('Asset name cannot be empty'),
  body('category_id').optional().isInt().withMessage('Category must be an integer'),
  body('location_id').optional().isInt().withMessage('Location must be an integer'),
  body('purchase_date').optional().isDate().withMessage('Invalid date format'),
  body('warranty_end_date').optional().isDate().withMessage('Invalid date format'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('asset_status').optional().isIn(['available','reserved','borrowed','under_repair','pending_repair','lost','damaged','retired']),
  body('condition_status').optional().isIn(['new','good','fair','poor','damaged']),
];

module.exports = { createAssetValidation, updateAssetValidation };