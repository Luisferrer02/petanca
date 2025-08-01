// src/validators/teamValidators.js
const { body, param } = require('express-validator');

// Validación al crear un equipo
const createTeamValidators = [
  body('name')
    .notEmpty().withMessage('El nombre del equipo es obligatorio'),
  body('players')
    .isArray({ min: 3, max: 3 })
    .withMessage('Debe haber exactamente 3 jugadores'),
  body('players.*')
    .notEmpty().withMessage('Nombre de jugador no puede estar vacío'),
  body('contact')
    .custom(value => {
      if (!value.email && !value.phone) {
        throw new Error('Debe proporcionar email o teléfono');
      }
      return true;
    })
];

// Validación al eliminar un equipo
const deleteTeamValidators = [
  param('id')
    .isMongoId().withMessage('ID de equipo inválido')
];

module.exports = {
  createTeamValidators,
  deleteTeamValidators
};
