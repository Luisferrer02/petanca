// src/controllers/teams.js
const { validationResult } = require('express-validator');
const Team = require('../models/team');

// GET /api/teams — Listar todos los equipos
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener equipos' });
  }
};

// POST /api/teams — Crear un nuevo equipo
exports.createTeam = async (req, res) => {
  console.log('⤵️ POST /api/teams body:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, players, contact } = req.body;
  try {
    const team = new Team({ name, players, contact });
    await team.save();
    res.status(201).json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear equipo' });
  }
};

// DELETE /api/teams/:id — Eliminar un equipo
exports.deleteTeam = async (req, res) => {
  const { id } = req.params;
  try {
    const team = await Team.findByIdAndDelete(id);
    if (!team) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    res.json({ message: 'Equipo eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar equipo' });
  }
};
