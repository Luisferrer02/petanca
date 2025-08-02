// src/controllers/match.js
const { validationResult } = require("express-validator");
const Team                = require("../models/team");
const Match               = require("../models/match");
const Notification        = require("../models/notification");
const { sendEmail }       = require("../utils/handleMails");

/**
 * GET /api/matches
 */
exports.getMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("teamA", "name contact")
      .populate("teamB", "name contact")
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

    // 1) Cargar y barajar equipos
    const teams = await Team.find();
    for (let i = teams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const n      = teams.length;
    const m      = 2 ** Math.floor(Math.log2(n)); // potencia de 2 ≤ n
    const d      = n - m;                         // play-ins
    const direct = m - d;                         // plazas directas

    // 2) Play-in (ronda 0)
    const courts = [1, 2, 3]; 
    const prelim  = [];
    if (d > 0) {
      for (let i = 0; i < d; i++) {
        const A      = teams[direct + i];
        const B      = teams[n - 1 - i];
        const court0 = courts.shift() || null;

        const pm = await Match.create({
          round:    0,
          sequence: i + 1,
          teamA:    A._id,
          teamB:    B ? B._id : null,
          court:    court0,
          status:   "pending",
          score:    { a: 0, b: 0 },
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

    // 3) Entradas a Ronda 1 con orden de siembra
    const seeds   = teams.slice(0, direct).map(t => t._id);
    const winners = prelim.map(pm => pm.winner);
    const bracketPositions = [];
    for (let i = 1; i <= m/2; i++) {
      bracketPositions.push(i, m + 1 - i);
    }
    let entries = bracketPositions.map(pos => {
      if (pos <= direct) {
        return { team: seeds[pos - 1], matchId: null };
      } else {
        const wi = pos - direct - 1;
        const pm = prelim[wi];
        return { team: winners[wi] || null, matchId: pm._id };
      }
    });

    // 4) Generar rondas 1…Final
    const matchesByRound = {};
    let round = 1;
    while (entries.length > 1) {
      let seq = 1;
      const thisRound   = [];
      const nextEntries = [];
      for (let i = 0; i < entries.length; i += 2) {
        const L      = entries[i];
        const R      = entries[i+1];
        const court1 = courts.shift() || null;

        const mdoc = await Match.create({
          round,
          sequence:     seq++,
          teamA:        L.team || null,
          teamB:        R.team || null,
          court:        court1,
          status:       "pending",
          score:        { a: 0, b: 0 },
          parentMatchA: L.matchId,
          parentMatchB: R.matchId
        });
        thisRound.push(mdoc);
        nextEntries.push({ team: null, matchId: mdoc._id });

        // **Envío automático** justo al asignar la pista
        if (court1) {
          const teamsToNotify = await Team.find({
            _id: { $in: [mdoc.teamA, mdoc.teamB] }
          });
          for (const t of teamsToNotify) {
            try {
              await sendEmail({
                to:      t.contact.email,
                subject: "Tu partido tiene pista asignada",
                text:    `¡Hola ${t.name}! Tu próximo partido está en la pista ${court1}.`
              });
            } catch (e) {
              console.error("Error enviando aviso automático:", e);
            }
            await Notification.create({
              match: mdoc._id,
              team:  t._id,
              type:  "auto"
            });
          }
        }
      }
      matchesByRound[round] = thisRound;
      entries = nextEntries;
      round++;
    }

    // 5) Tercer puesto junto a Semifinales
    const finalRound = round - 1;
    const semisRound = round - 2;
    const semis      = matchesByRound[semisRound] || [];
    if (semis.length === 2) {
      await Match.create({
        round:        semisRound,
        sequence:     3,  // tras las 2 semis
        teamA:        null,
        teamB:        null,
        court:        null,
        status:       "pending",
        score:        { a: 0, b: 0 },
        parentMatchA: semis[0]._id,
        parentMatchB: semis[1]._id
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error al generar torneo:", err);
    return res.status(500).json({ message: "Error al generar torneo" });
  }
};

/**
 * POST /api/matches/:id/result
 * Propaga ganadores, perdedores de semifinal, marca campeón y reasigna pista.
 */
exports.postResult = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) 
    return res.status(400).json({ errors: errors.array() });

  try {
    const { id }    = req.params;
    const { score } = req.body;
    const match     = await Match.findById(id);
    if (!match) 
      return res.status(404).json({ message: "Partido no encontrado" });

    const wasDone = match.status === "done";
    match.score  = { a: score.a, b: score.b };
    match.status = "done";
    match.winner = score.a >= score.b ? match.teamA : match.teamB;
    const loser  = score.a >= score.b ? match.teamB : match.teamA;
    await match.save();

    if (!wasDone) {
      // recalcular rondas
      const agg = await Match.aggregate([
        { $group: { _id:null, maxRound:{ $max:"$round" } } }
      ]);
      const maxRound  = agg[0]?.maxRound ?? match.round;
      const semisRound = maxRound - 1;
      const freedCourt = match.court;

      // si es final, marcar champion
      if (match.round === maxRound) {
        await Team.updateMany({}, { champion: false });
        await Team.findByIdAndUpdate(match.winner, { champion: true });
      }

      // propagar ganador
      let child = await Match.findOne({ parentMatchA: match._id });
      let slot  = "teamA";
      if (!child) {
        child = await Match.findOne({ parentMatchB: match._id });
        slot  = "teamB";
      }
      if (child) {
        child[slot] = match.winner;
        await child.save();
      }

      // propagar perdedor de semifinal al tercer puesto
      if (match.round === semisRound) {
        const third = await Match.findOne({
          round: semisRound,
          sequence: 3,
          $or: [
            { parentMatchA: match._id },
            { parentMatchB: match._id }
          ]
        });
        if (third) {
          const f = third.parentMatchA.equals(match._id) ? "teamA" : "teamB";
          third[f] = loser;
          await third.save();
        }
      }

      // reasignar pista y enviar aviso automático
      const next = await Match.findOne({
        status: "pending",
        teamA:  { $ne:null },
        teamB:  { $ne:null },
        court:  null
      }).sort({ round:1, sequence:1 });
      if (next) {
        next.court = freedCourt;
        await next.save();
        const teamsToNotify = await Team.find({
          _id: { $in: [ next.teamA, next.teamB ] }
        });
        for (const t of teamsToNotify) {
          try {
            await sendEmail({
              to:      t.contact.email,
              subject: "Tu partido tiene pista asignada",
              text:    `¡Hola ${t.name}! Ahora te toca en pista ${freedCourt}.`
            });
          } catch (e) {
            console.error("Error aviso auto:", e);
          }
          await Notification.create({
            match: next._id,
            team:  t._id,
            type:  "auto"
          });
        }
      }
    }

    return res.json({ ok: true, edited: wasDone });
  } catch (err) {
    console.error("Error al registrar resultado:", err);
    return res.status(500).json({ message: "Error al registrar resultado" });
  }
};

/**
 * POST /api/notify/:matchId
 * Notificación manual flexible:
 *  - Si tiene pista: “tu partido comienza ahora”
 *  - Si no: “pronto tu turno”
 */
exports.manualNotify = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId)
      .populate("teamA", "name contact")
      .populate("teamB", "name contact");
    if (!match)
      return res.status(404).json({ message: "Partido no encontrado" });

    if (match.status === "done")
      return res.status(400).json({ message: "Partido ya finalizado" });

    const hasCourt = match.court != null;
    const subject  = hasCourt
      ? "Tu partido comienza ahora"
      : "Próximamente tu turno";
    const textBase = hasCourt
      ? `¡Hola NAME! Tu partido arranca en la pista ${match.court} ahora.`
      : `¡Hola NAME! Pronto te tocará jugar; te avisaremos cuando tenga pista.`;

    for (const t of [match.teamA, match.teamB]) {
      try {
        const text = textBase.replace("NAME", t.name);
        if (t.contact.email) {
          await sendEmail({ to: t.contact.email, subject, text });
        }
        await Notification.create({
          match: match._id,
          team:  t._id,
          type:  "manual"
        });
      } catch (e) {
        console.error("Error al notificar manualmente:", e);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Error en notificación manual:", err);
    return res.status(500).json({ message: "Error en notificación manual" });
  }
};
