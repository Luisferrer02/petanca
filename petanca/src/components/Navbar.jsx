// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './components.css';

export default function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <Link to="/teams">Equipos</Link>
        <Link to="/bracket">Bracket</Link>
        <Link to="/matches">Control Partidos</Link>
        <Link to="/mail">Mail</Link>
      </div>
      <button onClick={onLogout} className="logout-button">Salir</button>
    </nav>
  );
}
