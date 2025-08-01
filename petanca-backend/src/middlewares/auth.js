// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

/**
 * Middleware para verificar JWT en la cabecera Authorization
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('🔑 authHeader:', authHeader);

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  const token = parts[1];
  jwt.verify(token, jwtSecret, (err, decoded) => {
    console.log('🛡️ jwt.verify err=', err, ' decoded=', decoded);
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }
    req.user = { id: decoded.id, username: decoded.username };
    next();
  });
}

module.exports = verifyToken;
