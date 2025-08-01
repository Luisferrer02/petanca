// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import './components.css';

export default function ProtectedRoute({ token, children }) {
  return token ? children : <Navigate to="/login" replace />;
}
