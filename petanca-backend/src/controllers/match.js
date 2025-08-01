// src/controllers/match.js
const { validationResult } = require("express-validator");
const Team        = require("../models/team");
const Match       = require("../models/match");
const Notification = require("../models/notification");
const { sendEmail } = require("../utils/handleMails");

/**
 * GET /api/matches
 */
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("teamA", "name")
      .populate("teamB", "name")
      .populate("parentMatchA", "round sequence")
      .populate("parentMatchB", "round sequence")
      .sort({ round: 1, sequence: 1 });
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener partidos" });
  }
};

/**
 * POST /api/matches/generate
 * Genera dinámicamente todas las rondas y añade partido de tercer puesto.
 */
exports.closeAndGenerate = async (req, res) => {
  try {
    // 0) Limpiar bracket anterior
    await Match.deleteMany({});

    // 1) Cargar y barajar equipos (Fisher–Yates)
    const teams = await Team.find();
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const n = teams.length;
    const m = 2 ** Math.floor(Math.log2(n)); // potencia de 2 ≤ n
    const d = n - m;                         // play-ins
    const direct = m - d;                    // cupos directos

    // 2) Play-in (ronda 0)
    const prelim = [];
    if (d > 0) {
      for (let i = 0; i < d; i++) {
        const A = teams[direct + i];
        const B = teams[n - 1 - i];
        const pm = await Match.create({
          round:    0,
          sequence: i + 1,
          teamA:    A._id,
          teamB:    B ? B._id : null,
          court:    null,
          status:   "pending",
          score:    { a:0, b:0 },
          parentMatchA: null,
          parentMatchB: null
        });
        if (!B) {
          pm.status = "done";
          pm.winner = A._id;
          await pm.save();
        }
        prelim.push(pm);
      }
    }

    // 3) Entradas a Ronda 1
    let entries = [];
    // directos
    for (let i = 0; i < direct; i++) {
      entries.push({ team: teams[i]._id, matchId: null });
    }
    // ganadores de prelim
    for (const pm of prelim) {
      entries.push({ team: pm.winner || null, matchId: pm._id });
    }

    // 4) Generar rondas 1…Final
    const courts = [1,2,3];
    const matchesByRound = {};
    let round = 1;

    while (entries.length > 1) {
      let seq = 1;
      const thisRound = [];
      const nextEntries = [];

      for (let i = 0; i < entries.length; i += 2) {
        const L = entries[i], R = entries[i+1];
        const mdoc = await Match.create({
          round,
          sequence:     seq++,
          teamA:        L.team  || null,
          teamB:        R.team  || null,
          court:        round === 1 ? courts.shift()||null : null,
          status:       "pending",
          score:        { a:0, b:0 },
          parentMatchA: L.matchId,
          parentMatchB: R.matchId
        });
        thisRound.push(mdoc);

        // avanzar byes en la primera ronda
        if (round === 1 && (!L.team || !R.team)) {
          const winner = L.team || R.team;
          mdoc.status = "done";
          mdoc.winner = winner;
          await mdoc.save();
          nextEntries.push({ team: winner, matchId: mdoc._id });
        } else {
          nextEntries.push({ team: null, matchId: mdoc._id });
        }
      }

      matchesByRound[round] = thisRound;
      entries = nextEntries;
      round++;
    }

    // 5) Determinar Semifinal y Final
    const finalRound = round - 1;
    const semisRound = round - 2;
    const semis = matchesByRound[semisRound] || [];

    // 6) Partido de Tercer Puesto en la ronda de Semis
    if (semis.length === 2) {
      await Match.create({
        round:        semisRound,
        sequence:     semis.length + 1,
        teamA:        null,
        teamB:        null,
        court:        null,
        status:       "pending",
        score:        { a:0, b:0 },
        parentMatchA: semis[0]._id,
        parentMatchB: semis[1]._id
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error al generar torneo:", err);
    res.status(500).json({ message: "Error al generar torneo" });
  }
};

/**
 * POST /api/matches/:id/result
 * - Propaga ganador a su hijo.
 * - Si es Semifinal, propaga perdedor al Tercer Puesto.
 * - Si es Final, marca campeón.
 * - Reasigna pista liberada.
 */
exports.postResult = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { id } = req.params;
    const { score } = req.body;
    const match = await Match.findById(id);
    if (!match) 
      return res.status(404).json({ message: "Partido no encontrado" });

    const wasDone = match.status === "done";

    // Actualizar resultado
    match.score  = { a: score.a, b: score.b };
    match.status = "done";
    match.winner = score.a >= score.b ? match.teamA : match.teamB;
    const loser  = score.a >= score.b ? match.teamB : match.teamA;
    await match.save();

    if (!wasDone) {
      // 1) Determinar máximo de rondas
      const agg = await Match.aggregate([
        { $group: { _id: null, maxRound: { $max: "$round" } } }
      ]);
      const maxRound = agg[0]?.maxRound ?? match.round;
      const semisRound = maxRound - 1;

      // 2) Si es la Final, marcar campeón
      if (match.round === maxRound) {
        await Team.updateMany({}, { $set: { champion: false } });
        await Team.findByIdAndUpdate(match.winner, { $set: { champion: true } });
      }

      // 3) Propagar ganador al siguiente match
      let child = await Match.findOne({ parentMatchA: match._id });
      let slot = "teamA";
      if (!child) {
        child = await Match.findOne({ parentMatchB: match._id });
        slot = "teamB";
      }
      if (child) {
        child[slot] = match.winner;
        await child.save();
      }

      // 4) Si es Semifinal, propagar perdedor al Tercer Puesto
      if (match.round === semisRound) {
        console.log(`Procesando semifinal ${match._id}, perdedor: ${loser}`);
        
        // Buscar el partido de tercer puesto específicamente
        // El tercer puesto está en la misma ronda que las semifinales pero con sequence mayor
        const thirdPlaceMatch = await Match.findOne({
          round: semisRound,
          sequence: { $gt: 2 }, // sequence > 2 (después de las dos semifinales)
          $or: [
            { parentMatchA: match._id },
            { parentMatchB: match._id }
          ]
        });

        if (thirdPlaceMatch) {
          console.log(`Encontrado partido de tercer puesto: ${thirdPlaceMatch._id}`);
          
          // Determinar en qué slot colocar al perdedor
          if (thirdPlaceMatch.parentMatchA && thirdPlaceMatch.parentMatchA.toString() === match._id.toString()) {
            console.log(`Asignando perdedor ${loser} a teamA del tercer puesto`);
            thirdPlaceMatch.teamA = loser;
          } else if (thirdPlaceMatch.parentMatchB && thirdPlaceMatch.parentMatchB.toString() === match._id.toString()) {
            console.log(`Asignando perdedor ${loser} a teamB del tercer puesto`);
            thirdPlaceMatch.teamB = loser;
          }
          
          await thirdPlaceMatch.save();
          console.log(`Tercer puesto actualizado: teamA=${thirdPlaceMatch.teamA}, teamB=${thirdPlaceMatch.teamB}`);
        } else {
          console.log('No se encontró partido de tercer puesto');
        }
      }

      // 5) Reasignar pista liberada al siguiente match listo
      const next = await Match.findOne({
        status: "pending",
        teamA:  { $ne: null },
        teamB:  { $ne: null },
        court:  null
      }).sort({ round: 1, sequence: 1 });
      if (next) {
        next.court = match.court;
        await next.save();
      }
    }

    res.json({ ok: true, edited: wasDone });
  } catch (err) {
    console.error("Error al registrar resultado:", err);
    res.status(500).json({ message: "Error al registrar resultado" });
  }
};

/**
 * POST /api/notify/:matchId
 */
exports.manualNotify = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId);
    if (!match || match.status !== "in_progress")
      return res.status(400).json({ message: "Partido no en progreso" });

    const team = await Team.findById(match.teamA);
    await sendEmail({
      to:      team.contact.email,
      subject: "Prepárate: tu turno pronto",
      text:    `¡Hola ${team.name}! En breve te tocará jugar en la pista ${match.court}.`
    });
    await Notification.create({
      match: match._id,
      team:  team._id,
      type:  "manual"
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error en notificación manual:", err);
    res.status(500).json({ message: "Error en notificación manual" });
  }
};