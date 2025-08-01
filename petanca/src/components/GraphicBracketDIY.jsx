// petanca/src/components/GraphicBracketDIY.jsx
import React, { useRef, useEffect, useState } from 'react';
import './graphicBracketDIY.css';

/**
 * rounds: array de arrays de partidos,
 * cada partido tiene {_id, teamA, teamB, court, score: {a,b}, winner, round}
 */
export default function GraphicBracketDIY({ rounds, token, onResultUpdated }) {
  const containerRef = useRef(null);
  const [lines, setLines] = useState([]);

  // Dibuja las líneas SVG entre ganadores y su siguiente match
  useEffect(() => {
    if (!containerRef.current) return;
    const conns = [];
    const contRect = containerRef.current.getBoundingClientRect();
    const cells = {};
    containerRef.current
      .querySelectorAll('[data-match]')
      .forEach(el => (cells[el.dataset.match] = el));

    rounds.forEach((col, ci) => {
      col.forEach(m => {
        if (!m.winner) return;
        const next = rounds[ci + 1];
        if (!next) return;
        // buscar match de próxima ronda que tenga a este winner
        const nm = next.find(
          nm =>
            (nm.teamA?._id?.toString() === m.winner.toString()) ||
            (nm.teamB?._id?.toString() === m.winner.toString())
        );
        if (!nm) return;

        const a = cells[m._id].getBoundingClientRect();
        const b = cells[nm._id].getBoundingClientRect();
        conns.push({
          x1: a.right - contRect.left,
          y1: a.top + a.height / 2 - contRect.top,
          x2: b.left - contRect.left,
          y2: b.top + b.height / 2 - contRect.top,
        });
      });
    });

    setLines(conns);
  }, [rounds]);

  return (
    <div className="graphic-diy" ref={containerRef}>
      {rounds.map((col, ci) => (
        <div key={ci} className="round-col">
          {/* Podrías traducir índices a “Octavos”, “Cuartos”, etc. */}
          <h3 className="round-title">Ronda {ci + 1}</h3>
          {col.map(m => {
            // Sólo mostrar si hay al menos un equipo o es la primera ronda
            const first = ci === 0;
            const nameA =
              m.teamA?.name ?? (first && m.teamB ? 'N/A' : '?');
            const nameB =
              m.teamB?.name ?? (first && m.teamA ? 'N/A' : '?');
            if (!m.teamA && !m.teamB && !first) return null;

            return (
              <div
                key={m._id}
                className={`cell status-${m.status}`}
                data-match={m._id}
              >
                <div className="cell-header">
                  <span>{nameA}</span>
                  <span>{nameB}</span>
                </div>
                <div className="cell-score">
                  <span>{m.score.a}</span>
                  <span>{m.score.b}</span>
                </div>
                {m.court != null && (
                  <div className="cell-court">Pista {m.court}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <svg className="lines-svg">
        {lines.map((l, i) => (
          <polyline
            key={i}
            points={`${l.x1},${l.y1} ${l.x1 + 20},${l.y1} ${l.x2 -
              20},${l.y2} ${l.x2},${l.y2}`}
            stroke="#6B7280"
            fill="none"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}
