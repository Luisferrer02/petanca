// src/models/team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  players: { type: [String], validate: [arr => arr.length === 3, 'Se requieren 3 jugadores'] },
  contact: {
    email: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  createdAt: { type: Date, default: Date.now },
  champion: { type: Boolean, default: false }    // ← Nuevo campo
});

module.exports = mongoose.model('Team', teamSchema);
