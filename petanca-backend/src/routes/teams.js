// src/routes/teams.js
const express = require('express');
const verifyToken = require('../middlewares/auth');
const teamController = require('../controllers/teams');
const {
  createTeamValidators,
  deleteTeamValidators
} = require('../validators/teamValidators');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken);

// Listar equipos
router.get('/', teamController.getTeams);

// Crear equipo
router.post(
  '/',
  createTeamValidators,
  teamController.createTeam
);

// Eliminar equipo
router.delete(
  '/:id',
  deleteTeamValidators,
  teamController.deleteTeam
);

module.exports = router;
