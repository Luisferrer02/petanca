// src/pages/TeamsPage.jsx
import React, { useEffect, useState } from 'react';
import { get, post, del } from '../api/client';
import Navbar from '../components/Navbar';
import './teamsPage.css';

export default function TeamsPage({ token }) {
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    name: '',
    players: ['', '', ''],
    contact: { email: '' }
  });

  // 1) cargar al montar
  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTeams]);

  async function loadTeams() {
    try {
      const data = await get('/teams', token);
      const list = Array.isArray(data) ? data : data.teams || [];
      setTeams(list);
    } catch (err) {
      console.error('Error cargando equipos:', err);
      // Si es no autorizado, ya estamos redirigiendo
      if (!err.message.includes('No autorizado')) {
        alert(`Error cargando equipos:\n${err.message}`);
      }
      setTeams([]);
    }
  }

  // 2) crear y recargar
  async function handleCreate(e) {
    e.preventDefault();
    try {
      await post('/teams', form, token);
      setForm({ name: '', players: ['', '', ''], contact: { email: '' } });
      loadTeams();
    } catch (err) {
      console.error('Error creando equipo:', err);
      alert(`No se pudo crear el equipo:\n${err.message}`);
    }
  }

  // 3) borrar y recargar
  async function handleDelete(id) {
    try {
      await del(`/teams/${id}`, token);
      loadTeams();
    } catch (err) {
      console.error('Error borrando equipo:', err);
      alert(`No se pudo borrar el equipo:\n${err.message}`);
    }
  }

  return (
    <>
      <Navbar onLogout={() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }} />

      <div className="teams-container">
        <button onClick={loadTeams} className="btn-refresh">
          ↻ Recargar equipos
        </button>

        <h2 className="teams-title">Equipos</h2>
        <form onSubmit={handleCreate} className="teams-form">
          <input
            className="form-input"
            placeholder="Nombre equipo"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          />
          {form.players.map((p, i) => (
            <input
              key={i}
              className="form-input"
              placeholder={`Jugador ${i + 1}`}
              value={form.players[i]}
              onChange={e => {
                const arr = [...form.players];
                arr[i] = e.target.value;
                setForm(prev => ({ ...prev, players: arr }));
              }}
            />
          ))}
          <input
            className="form-input"
            placeholder="Email contacto"
            value={form.contact.email}
            onChange={e =>
              setForm(prev => ({ ...prev, contact: { email: e.target.value } }))
            }
          />
          <button type="submit" className="btn-add">
            Añadir
          </button>
        </form>

        {teams.length === 0 ? (
          <div className="placeholder">Aún no hay equipos.</div>
        ) : (
          <ul className="teams-list">
            {teams.map(t => (
              <li key={t._id} className="team-item">
                <span className="team-name">{t.name}</span>
                <button
                  onClick={() => handleDelete(t._id)}
                  className="btn-delete"
                >
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
