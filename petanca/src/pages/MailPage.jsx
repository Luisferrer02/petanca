// src/pages/MailPage.jsx
import React, { useEffect, useState } from 'react'
import { get, post } from '../api/client'
import Navbar from '../components/Navbar'
import './mailPage.css'

export default function MailPage({ token }) {
  const [teams, setTeams] = useState([])
  const [teamId, setTeamId] = useState('')
  const [res, setRes] = useState(null)

  useEffect(() => {
    loadTeams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTeams])

  async function loadTeams() {
    try {
      const data = await get('/teams', token)
      const arr = Array.isArray(data) ? data : data.teams ?? []
      setTeams(arr)
      if (arr.length > 0) setTeamId(arr[0]._id)
    } catch (err) {
      console.error('Error cargando equipos:', err)
      setTeams([])
    }
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!teamId) return
    try {
      const r = await post('/mail/send', { teamId }, token)
      setRes(r)
    } catch (err) {
      console.error('Error al enviar mail:', err)
      setRes({ ok: false, message: 'Error de red' })
    }
  }

  return (
    <>
      <Navbar onLogout={() => window.location.reload()} />
      <div className="mail-page">
        <h2>Enviar Aviso a Equipo</h2>

        {teams.length === 0 ? (
          <div className="placeholder">No hay equipos disponibles</div>
        ) : (
          <form onSubmit={handleSend} className="mail-form">
            <div className="form-group">
              <label>Selecciona equipo:</label>
              <select
                value={teamId}
                onChange={e => setTeamId(e.target.value)}
                className="form-select"
              >
                {teams.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="send-mail-btn">
              Enviar Aviso
            </button>
          </form>
        )}

        {res && (
          <pre className="response-box">
            {JSON.stringify(res, null, 2)}
          </pre>
        )}
      </div>
    </>
  )
}
