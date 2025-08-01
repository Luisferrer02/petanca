// src/models/notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  match:  { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  team:   { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  type:   { type: String, enum: ['auto','manual'], required: true },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
