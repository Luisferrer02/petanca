// src/routes/matches.js
const express = require('express');
const verifyToken = require('../middlewares/auth');
const matchController = require('../controllers/match');
const {
  closeTournamentValidators,
  resultValidators,
  notifyValidators
} = require('../validators/matchValidators');

const router = express.Router();
router.use(verifyToken);

// Listar partidos
router.get('/', matchController.getMatches);

// Cerrar inscripciones y generar bracket
router.post(
  '/generate',
  closeTournamentValidators,
  matchController.closeAndGenerate
);

// Registrar resultado
router.post(
  '/:id/result',
  resultValidators,
  matchController.postResult
);

module.exports = router;
