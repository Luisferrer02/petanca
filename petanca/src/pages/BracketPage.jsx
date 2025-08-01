// src/pages/BracketPage.jsx
import React, { useEffect, useState } from 'react';
import { get, post } from '../api/client';
import Navbar from '../components/Navbar';

export default function BracketPage({ token }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => { loadMatches(); }, []);

  async function loadMatches() {
    try {
      const data = await get('/matches', token);
      setMatches(Array.isArray(data) ? data : data.matches || []);
    } catch {
      setMatches([]);
    }
  }

  async function handleGenerate() {
    if (!window.confirm('¿Regenerar bracket?')) return;
    await post('/matches/generate', {}, token);
    loadMatches();
  }

  // Agrupar por ronda
  const grouped = matches.reduce((acc, m) => {
    (acc[m.round] = acc[m.round] || []).push(m);
    return acc;
  }, {});
  const rounds = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  if (!rounds.length) {
    return (
      <>
        <Navbar onLogout={() => window.location.reload()} />
        <div style={{ padding: 16, fontFamily: 'monospace' }}>
          <button onClick={handleGenerate}>Generar Bracket</button>
          <pre>Aún no hay bracket.</pre>
        </div>
      </>
    );
  }

  // Construir secciones según # de partidos
  const sections = [];
  rounds.forEach(r => {
    const ms = (grouped[r] || []).sort((a, b) => a.sequence - b.sequence);
    const cnt = ms.length;

    if (cnt === 16) {
      sections.push({ label: 'Dieciseisavos', matches: ms });
    } else if (cnt === 8) {
      sections.push({ label: 'Octavos', matches: ms });
    } else if (cnt === 4) {
      sections.push({ label: 'Cuartos', matches: ms });
    } else if (cnt === 3) {
      // Semifinal + Tercer Puesto
      sections.push({ label: 'Semifinal', matches: ms.slice(0, 2) });
      sections.push({ label: 'Tercer Puesto', matches: ms.slice(2) });
    } else if (cnt === 2) {
      sections.push({ label: 'Final', matches: ms });
    } else {
      sections.push({ label: `Ronda ${r}`, matches: ms });
    }
  });

  // Mostrar nombre o placeholder
  const dispName = (m, side, isThird) => {
    // Si el equipo ya está asignado, mostrarlo
    const team = side === 'A' ? m.teamA : m.teamB;
    if (team?.name) return team.name;

    // Si es partido de 3er puesto, placeholder
    if (isThird) {
      const parent = side === 'A' ? m.parentMatchA : m.parentMatchB;
      return `Perdedor Semifinal.${parent?.sequence ?? (side === 'A' ? 1 : 2)}`;
    }

    // Placeholder ganador normal
    const parent = side === 'A' ? m.parentMatchA : m.parentMatchB;
    if (parent?.sequence != null) {
      // Determinar etiqueta de ronda del padre
      const pcnt = (grouped[parent.round] || []).length;
      let pname;
      switch (pcnt) {
        case 16: pname = 'Dieciseisavos'; break;
        case 8:  pname = 'Octavos'; break;
        case 4:  pname = 'Cuartos'; break;
        case 2:  pname = 'Semifinal'; break;
        default: pname = `Ronda ${parent.round}`;
      }
      return `Ganador ${pname}.${parent.sequence}`;
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
