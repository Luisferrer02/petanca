// src/routes/notify.js
const express = require('express');
const verifyToken = require('../middlewares/auth');
const matchController = require('../controllers/match');
const { notifyValidators } = require('../validators/matchValidators');

const router = express.Router();
router.use(verifyToken);

// Notificación manual
router.post(
  '/:matchId',
  notifyValidators,
  matchController.manualNotify
);

module.exports = router;

