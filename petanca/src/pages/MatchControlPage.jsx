// src/pages/MatchControlPage.jsx
import React, { useEffect, useState } from "react";
import { get, post } from "../api/client";
import Navbar from "../components/Navbar";
import "./matchControlPage.css";

export default function MatchControlPage({ token }) {
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [viewHistory, setViewHistory] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  async function loadMatches() {
    try {
      const data = await get("/matches", token);
      setMatches(Array.isArray(data) ? data : data.matches || []);
    } catch (err) {
      console.error("Error cargando matches:", err);
      setMatches([]);
    }
  }

  const handleResult = async (m) => {
    const { a, b } = scores[m._id] ?? { a: m.score.a, b: m.score.b };
    // Validación frontend
    if (a < 0 || b < 0) {
      alert("La puntuación no puede ser negativa");
      return;
    }
    if (a === 0 && b === 0) {
      alert("No se puede guardar un marcador 0-0");
      return;
    }
    await post(`/matches/${m._id}/result`, { score: { a, b } }, token);
    loadMatches();
  };

  const handleNotify = async (m) => {
    await post(`/notify/${m._id}`, {}, token);
  };

  // Agrupar todos los partidos por ronda
  const groupedAll = matches.reduce((acc, m) => {
    (acc[m.round] = acc[m.round] || []).push(m);
    return acc;
  }, {});

  const rounds = Object.keys(groupedAll)
    .map(Number)
    .sort((a, b) => a - b);
  const totalRounds = rounds.length;
  const maxRound = rounds[rounds.length - 1] ?? 1;
  const semisRound = maxRound - 1;

  // Etiqueta de ronda para mostrar
  function roundLabel(r) {
    const idx = rounds.indexOf(r);
    const dist = totalRounds - idx - 1;
    switch (dist) {
      case 0:
        return "Final";
      case 1:
        return "Semifinal";
      case 2:
        return "Cuartos";
      case 3:
        return "Octavos";
      case 4:
        return "Dieciseisavos";
      default:
        return `Ronda ${r}`;
    }
  }

  // 3 partidos activos con pista
  const active = matches
    .filter(
      (m) =>
        (m.status === "pending" || m.status === "in_progress") &&
        m.court != null &&
        m.teamA &&
        m.teamB
    )
    .sort((a, b) => a.court - b.court)
    .slice(0, 3);

  // 3 siguientes sin pista
  const upcoming = matches
    .filter(
      (m) =>
        m.status === "pending" &&
        m.court == null &&
        m.teamA &&
        m.teamB
    )
    .sort((a, b) => a.round - b.round || a.sequence - b.sequence)
    .slice(0, 3);

  // Historial de partidos terminados
  const history = matches
    .filter((m) => m.status === "done")
    .sort((a, b) => a.round - b.round || a.sequence - b.sequence);

  // Selección de la lista según la vista
  const list = viewHistory ? history : [...active, ...upcoming];

  return (
    <>
      <Navbar onLogout={() => window.location.reload()} />

      <div className="match-control-container">
        <button
          className="toggle-view-btn"
          onClick={() => setViewHistory((v) => !v)}
        >
          {viewHistory ? "Ver partidos activos" : "Ver historial de partidos"}
        </button>

        {list.length === 0 ? (
          <div className="placeholder">
            {viewHistory
              ? "No hay partidos en el historial"
              : "No hay partidos activos"}
          </div>
        ) : (
          list.map((m) => {
            const isActive = !viewHistory && m.court != null;
            const cur = scores[m._id] ?? { a: m.score.a, b: m.score.b };

            // Detectar tercer puesto
            const semisMatches = groupedAll[semisRound] || [];
            const isThird =
              !viewHistory &&
              m.round === semisRound &&
              semisMatches.length === 3 &&
              m.sequence === semisMatches.length;

            const label = isThird ? "Tercer Puesto" : roundLabel(m.round);

            return (
              <div key={m._id} className="match-card">
                <div className="match-info">
                  <div>
                    <strong>{label}</strong> – {m.teamA.name} vs{" "}
                    {m.teamB.name}
                  </div>
                  {isActive && <span>Pista {m.court}</span>}
                  {!isActive && !viewHistory && <span>Próximamente</span>}
                </div>

                {viewHistory ? (
                  // Historial: solo marcador
                  <div className="match-info">
                    <span>
                      Marcador: {m.score.a}–{m.score.b}
                    </span>
                  </div>
                ) : isActive ? (
                  // Activo: inputs + botones
                  <div className="match-controls">
                    <input
                      type="number"
                      min={0}
                      value={cur.a}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [m._id]: { ...cur, a: +e.target.value },
                        }))
                      }
                      className="score-input"
                    />
                    <input
                      type="number"
                      min={0}
                      value={cur.b}
                      onChange={(e) =>
                        setScores((s) => ({
                          ...s,
                          [m._id]: { ...cur, b: +e.target.value },
                        }))
                      }
                      className="score-input"
                    />
                    <button
                      onClick={() => handleResult(m)}
                      className="btn-finish"
                    >
                      {m.status === "in_progress" ? "Finalizar" : "Guardar"}
                    </button>
                    <button
                      onClick={() => handleNotify(m)}
                      className="btn-notify"
                    >
                      Avisar
                    </button>
                  </div>
                ) : (
                  // Próximos: solo “Avisar”
                  <div className="match-controls">
                    <button
                      onClick={() => handleNotify(m)}
                      className="btn-notify"
                    >
                      Avisar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
