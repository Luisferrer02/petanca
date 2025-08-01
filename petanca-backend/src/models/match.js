// src/models/match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  round:    { type: Number, required: true },
  sequence: { type: Number, required: true },    // ← número dentro de la ronda
  teamA:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamB:    { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  court:    { type: Number, default: null },
  status:   { type: String, enum: ['pending','in_progress','done','bye'], default: 'pending' },
  score:    { a: { type: Number, default: 0 }, b: { type: Number, default: 0 } },
  winner:   { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  playedAt: { type: Date, default: null },
  startTime:{ type: Date, default: Date.now },
  headUpNotified: { type: Boolean, default: false },
  parentMatchA: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
  parentMatchB: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null }
});

module.exports = mongoose.model('Match', matchSchema);
