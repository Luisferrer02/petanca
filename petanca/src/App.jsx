// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import TeamsPage from './pages/TeamsPage';
import BracketPage from './pages/BracketPage';
import MailPage from './pages/MailPage';
import ProtectedRoute from './components/ProtectedRoute';
import MatchControlPage from './pages/MatchControlPage';

export default function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={tok => { setToken(tok); localStorage.setItem('token', tok); }} />} />
        <Route path="/teams" element={
          <ProtectedRoute token={token}>
            <TeamsPage token={token} />
          </ProtectedRoute>
        }/>
        <Route path="/bracket" element={
          <ProtectedRoute token={token}>
            <BracketPage token={token} />
          </ProtectedRoute>
        }/>
        <Route path="/matches" element={
          <ProtectedRoute token={token}>
            <MatchControlPage token={token} />
          </ProtectedRoute>
        }/>
        <Route path="/mail" element={
          <ProtectedRoute token={token}>
            <MailPage token={token} />
          </ProtectedRoute>
        }/>
        <Route path="*" element={<Navigate to={token ? "/teams" : "/login"} replace/>} />
      </Routes>
    </Router>
  );
}
