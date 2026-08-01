const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const authValidation = require('../validations/auth.validation');

const router = express.Router();

router.post('/login', validate(authValidation.login), authController.login);
// Register is restricted: only authenticated admins can create users.
// Use the /users endpoint (users:create) for regular user management.
router.post('/register', authenticate, authorize('users:create'), validate(authValidation.register), authController.register);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
