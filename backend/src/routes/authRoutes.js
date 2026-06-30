const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const { loginValidation, changePasswordValidation } = require('../validators/authValidator');

router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', authenticate, authController.getProfile);
router.put('/change-password', authenticate, changePasswordValidation, authController.changePassword);

module.exports = router;