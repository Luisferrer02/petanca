// src/components/GraphicBracket.jsx
import React from 'react';
import { Bracket } from 'react-brackets';
import { post } from '../api/client';
import './graphicBracket.css';  // Asegúrate de que solo defina .seed, .seed-court, .seed-score, .round-title

/**
 * rounds: array de arrays de partidos,
 *  cada partido tiene { _id, teamA, teamB, court, score, startTime }
 */
export default function GraphicBracket({ rounds, token, onResultUpdated }) {
  // Convertimos al formato que espera react-brackets
  const data = rounds.map((roundMatches, i) => ({
    title: `Ronda ${i+1}`,
    seeds: roundMatches.map(m => {
      const isFirst = i === 0;
      const nameA = m.teamA?.name ?? (isFirst && m.teamB ? 'N/A' : '?');
      const nameB = m.teamB?.name ?? (isFirst && m.teamA ? 'N/A' : '?');
      return {
        id: m._id,
        teams: [{ name: nameA }, { name: nameB }],
        date: m.startTime,
        court: m.court,
        score: [m.score.a, m.score.b]
      };
    })
  }));

  // Al editar un seed (avanzar marcador)
  const handleUpdate = async (seedId, newScore) => {
    await post(`/matches/${seedId}/result`, {
      score: { a: newScore[0], b: newScore[1] }
    }, token);
    onResultUpdated();
  };

  return (
    <div className="graphic-bracket">
      <Bracket
        rounds={data}
        onMatchUpdate={handleUpdate}
        roundTitleComponent={({title}) => <h3 className="round-title">{title}</h3>}
        seedComponent={({seed}) => (
          <div className="seed">
            <div>{seed.teams[0].name} vs {seed.teams[1].name}</div>
            {seed.court && <div className="seed-court">Pista {seed.court}</div>}
            <div className="seed-score">{seed.score[0]}–{seed.score[1]}</div>
          </div>
        )}
      />
    </div>
  );
}
