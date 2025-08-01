// src/routes/auth.js
const express = require('express');
const authController = require('../controllers/auth');
const { loginValidators } = require('../validators/authValidators');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  loginValidators,
  authController.login
);

module.exports = router;
