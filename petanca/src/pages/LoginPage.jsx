// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { post } from '../api/client';
import { useNavigate } from 'react-router-dom';
import './loginPage.css';

export default function LoginPage({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const handle = async e => {
    e.preventDefault();
    const res = await post('/auth/login', { username: user, password: pass });
    if (res.token) {
      onLogin(res.token);
      nav('/teams');
    } else {
      setErr(res.message || 'Error');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handle} className="login-form">
        <h1 className="form-title">Login Admin</h1>
        {err && <div className="error-message">{err}</div>}
        <div className="form-group">
          <input
            type="text"
            placeholder="Usuario"
            value={user}
            onChange={e => setUser(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Contraseña"
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="form-input"
          />
        </div>
        <button type="submit" className="submit-button">
          Entrar
        </button>
      </form>
    </div>
  );
}
