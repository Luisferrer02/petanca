// src/models/index.js
const Admin        = require('./admin');
const Team         = require('./team');
const Match        = require('./match');
const Notification = require('./notification');

// Opcional: si quieres exponer los modelos
module.exports = { Admin, Team, Match, Notification };
