const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verifyEmail', authController.verifyEmail);
router.post('/resendCode', authController.resendVerificationCode);
router.get('/status', authController.getRegistrationStatus);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/:token', authController.validateResetToken);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/logout', authController.logout);
router.post('/abortRegistration', authController.abortRegistration);

module.exports = router;