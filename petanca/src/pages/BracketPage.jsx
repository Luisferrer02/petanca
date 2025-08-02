// src/pages/BracketPage.jsx
import React, { useEffect, useState } from 'react';
import { get, post } from '../api/client';
import Navbar from '../components/Navbar';

export default function BracketPage({ token }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  async function loadMatches() {
    try {
      const data = await get('/matches', token);
      setMatches(Array.isArray(data) ? data : data.matches || []);
    } catch (err) {
      console.error('Error cargando bracket:', err);
      setMatches([]);
    }
  }

  async function handleGenerate() {
    if (!window.confirm('¿Regenerar bracket? Se perderán los actuales.')) return;
    await post('/matches/generate', {}, token);
    loadMatches();
  }

  // Agrupar partidos por ronda
  const grouped = matches.reduce((acc, m) => {
    acc[m.round] = acc[m.round] || [];
    acc[m.round].push(m);
    return acc;
  }, {});
  const rounds = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  if (rounds.length === 0) {
    return (
      <>
        <Navbar onLogout={() => window.location.reload()} />
        <div style={{ padding: 16, fontFamily: 'monospace' }}>
          <button onClick={handleGenerate}>Generar Bracket</button>
          <pre>
{`----------------------------------------
|   Aún no hay bracket. Click arriba   |
|  para generarlo y verlo aquí.        |
----------------------------------------`}
          </pre>
        </div>
      </>
    );
  }

  const maxRound = Math.max(...rounds);
  const semisRound = maxRound - 1;

  // Etiquetas dinámicas
  function roundLabel(r) {
    if (r === 0) return 'Prevía';
    const dist = maxRound - r;
    switch (dist) {
      case 0: return 'Final';
      case 1: return 'Semifinal';
      case 2: return 'Cuartos';
      case 3: return 'Octavos';
      case 4: return 'Dieciseisavos';
      default: return `Ronda ${r}`;
    }
  }

  // Construir secciones en orden, incluyendo Tercer Puesto
  const sections = [];

  // Prevía (ronda 0)
  if (grouped[0]) {
    sections.push({
      label: roundLabel(0),
      matches: grouped[0].sort((a, b) => a.sequence - b.sequence)
    });
  }

  rounds.forEach(r => {
    if (r === 0) return;
    const roundMatches = grouped[r].sort((a, b) => a.sequence - b.sequence);

    if (r === semisRound) {
      // Semifinales
      const semis = roundMatches.slice(0, 2);
      sections.push({ label: roundLabel(r), matches: semis });

      // Tercer puesto 
      const third = roundMatches.slice(2);
      if (third.length) {
        sections.push({ label: 'Tercer Puesto', matches: third });
      }
    } else if (r === maxRound) {
      // Final
      sections.push({ label: roundLabel(r), matches: roundMatches });
    } else {
      // Rondas intermedias (Cuartos, Octavos…)
      sections.push({ label: roundLabel(r), matches: roundMatches });
    }
  });

  // Mostrar nombre de equipo o placeholder con etiqueta correcta
  const dispName = (m, side, isThird) => {
    const team = side === 'A' ? m.teamA : m.teamB;
    if (team && team.name) return team.name;

    const parent = side === 'A' ? m.parentMatchA : m.parentMatchB;
    if (parent) {
      const who = isThird ? 'Perdedor' : 'Ganador';
      // Aquí usamos roundLabel(parent.round), que para parent.round= semisRound devolverá "Semifinal"
      return `${who} ${roundLabel(parent.round)}.${parent.sequence}`;
    }
    return 'N/A';
  };

  return (
    <>
      <Navbar onLogout={() => window.location.reload()} />
      <div style={{ padding: 16, fontFamily: 'monospace' }}>
        <button
          onClick={handleGenerate}
          style={{
            marginBottom: 16,
            padding: '0.5rem 1.5rem',
            background: '#2563EB',
            color: '#FFF',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Generar Bracket
        </button>

        <pre>
{sections.map(sec => {
  const isThird = sec.label === 'Tercer Puesto';
  const header = `${sec.label}\n${'-'.repeat(30)}\n`;
  const body = sec.matches
    .map(m => {
      const A = dispName(m, 'A', isThird).padEnd(20);
      const B = dispName(m, 'B', isThird).padEnd(20);
      return ` • ${A} vs ${B} [${m.score.a}-${m.score.b}]`;
    })
    .join('\n');
  return header + body;
}).join('\n\n')}
        </pre>
      </div>
    </>
  );
}
