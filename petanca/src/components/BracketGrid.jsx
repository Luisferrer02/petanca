// petanca/src/components/BracketGrid.jsx

import React, { useEffect, useRef, useState } from 'react';
import './bracketGrid.css';

export default function BracketGrid({ rounds, token, onResultUpdated }) {
  const containerRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [positions, setPositions] = useState({});

  // 1) Calcula las "filas" de cada partido
  function computePositions() {
    const pos = {};
    // primera ronda: posiciones impares 1,3,5...
    rounds[0].forEach((m, i) => { pos[m._id] = i * 2 + 1; });
    // rondas sucesivas
    for (let r = 1; r < rounds.length; r++) {
      rounds[r].forEach(m => {
        const parents = rounds[r-1].filter(p =>
          [p.teamA?._id, p.teamB?._id].some(id =>
            id && (id.toString() === m.teamA?._id?.toString() || id.toString() === m.teamB?._id?.toString())
          )
        );
        if (parents.length === 2) {
          pos[m._id] = (pos[parents[0]._id] + pos[parents[1]._id]) / 2;
        } else if (parents.length === 1) {
          pos[m._id] = pos[parents[0]._id];
        } else {
          // sin participantes, lo ponemos al final
          pos[m._id] = Math.max(...Object.values(pos)) + 2;
        }
      });
    }
    setPositions(pos);
    return pos; // Return the computed positions
  }

  // 2) Dibuja líneas
  useEffect(() => {
    if (!containerRef.current) return;
    
    const pos = computePositions(); // Get positions directly
    const rect = containerRef.current.getBoundingClientRect();
    const newLines = [];

    rounds.forEach((col, ci) => {
      col.forEach(m => {
        if (!m.winner) return;
        const next = rounds[ci+1]?.find(nm =>
          nm.teamA?._id?.toString() === m.winner.toString() ||
          nm.teamB?._id?.toString() === m.winner.toString()
        );
        if (!next) return;
        const aEl = containerRef.current.querySelector(`[data-id='${m._id}']`);
        const bEl = containerRef.current.querySelector(`[data-id='${next._id}']`);
        if (!aEl || !bEl) return;
        const a = aEl.getBoundingClientRect();
        const b = bEl.getBoundingClientRect();
        newLines.push({
          x1: a.right - rect.left,
          y1: a.top + a.height/2 - rect.top,
          x2: b.left - rect.left,
          y2: b.top + b.height/2 - rect.top
        });
      });
    });

    setLines(newLines);
  }, [rounds]); // Remove positions from dependencies

  // 3) decide tamaño de filas y columnas
  const allRows = Object.values(positions);
  const maxRow = allRows.length ? Math.ceil(Math.max(...allRows)) : 1;
  const totalCols = rounds.length || 1;
  const rowHeight = `${100 / maxRow}vh`;
  const colWidth  = `${100 / totalCols}vw`;

  return (
    <div
      className="bracket-grid"
      ref={containerRef}
      style={{
        gridAutoRows: rowHeight,
        gridAutoColumns: colWidth
      }}
    >
      {rounds.map((col, ci) => (
        <div key={ci} className="col">
          {col.map(m => {
            if (ci > 0 && !m.teamA && !m.teamB) return null;
            const nameA = m.teamA?.name ?? (ci===0 && m.teamB ? 'N/A' : '?');
            const nameB = m.teamB?.name ?? (ci===0 && m.teamA ? 'N/A' : '?');
            return (
              <div
                key={m._id}
                className="match-cell"
                data-id={m._id}
                style={{ gridRowStart: positions[m._id] }}
              >
                <div className="mc-row">
                  <span className="mc-team">{nameA}</span>
                  <span className="mc-score">{m.score.a}</span>
                </div>
                <div className="mc-row">
                  <span className="mc-team">{nameB}</span>
                  <span className="mc-score">{m.score.b}</span>
                </div>
                {m.court != null && (
                  <div className="mc-court">Pista {m.court}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <svg className="lines-svg">
        {lines.map((l,i) => (
          <polyline
            key={i}
            points={`${l.x1},${l.y1} ${l.x1+20},${l.y1} ${l.x2-20},${l.y2} ${l.x2},${l.y2}`}
            stroke="#6B7280"
            fill="none"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
}