// src/routes/admin.js (clear endpoint)
const express = require('express');
const verifyToken = require('../middlewares/auth');
const Team = require('../models/team');
const Match = require('../models/match');
const Notification = require('../models/notification');

const router = express.Router();
router.use(verifyToken);

// POST /api/admin/clear — Reinicia torneo borrando datos (equipos, partidos, notificaciones)
router.post('/clear', async (req, res) => {
  try {
    await Team.deleteMany({});
    await Match.deleteMany({});
    await Notification.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al limpiar datos' });
  }
});

module.exports = router;
