// src/validators/authValidators.js
const { body } = require('express-validator');

// Validaciones para login
const loginValidators = [
  body('username')
    .notEmpty().withMessage('El usuario es requerido'),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
];

module.exports = { loginValidators };
