// src/validators/match.js
const { param, body } = require('express-validator');

// Validar cierre de inscripciones (no body required)
const closeTournamentValidators = []; // no input

// Validar registro de resultado
const resultValidators = [
  param('id')
    .isMongoId().withMessage('ID de partido inválido'),
  body('score.a')
    .isInt({ min: 0 }).withMessage('Puntuación de A debe ser un número entero ≥ 0'),
  body('score.b')
    .isInt({ min: 0 }).withMessage('Puntuación de B debe ser un número entero ≥ 0')
];

// Validar notificación manual
const notifyValidators = [
  param('matchId')
    .isMongoId().withMessage('ID de partido inválido')
];

module.exports = {
  closeTournamentValidators,
  resultValidators,
  notifyValidators
};
