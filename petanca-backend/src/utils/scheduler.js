// src/utils/scheduler.js
const cron = require('node-cron');
const Match = require('../models/match');
const Team = require('../models/team');
const Notification = require('../models/notification');
const { headUpMinutes } = require('../config');
const { sendEmail } = require('../utils/handleMails'); 

// Programa un job que corre cada minuto
cron.schedule('* * * * *', async () => {
  const now = new Date();
  const upcoming = new Date(now.getTime() + headUpMinutes * 60000);

  // Busca matches pendientes que empiezan en el rango [now, upcoming]
  const matches = await Match.find({
    status: 'pending',
    headUpNotified: false,
    startTime: { $gte: now, $lte: upcoming }
  });

  for (const match of matches) {
    // Envía aviso al equipo A (y podrías hacer lo mismo para equipoB si quieres)
    const team = await Team.findById(match.teamA);
    const court = match.court;
    const msg = `¡Hola ${team.name}! En breve te tocará jugar en la pista ${court}.`;

    await sendEmail({
      to: team.contact.email,
      subject: 'Prepárate: próximamente tu turno',
      text: msg
    });
    // Guarda registro de notificación
    await Notification.create({ match: match._id, team: team._id, type: 'auto' });

    // Marca como notificado para no repetir
    match.headUpNotified = true;
    await match.save();
  }
}, {
  timezone: 'Europe/Madrid'
});

