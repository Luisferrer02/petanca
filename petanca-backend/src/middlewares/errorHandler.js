// src/middlewares/errorHandler.js

/**
 * Middleware para capturar errores y formatear la respuesta
 * Debe ir después de todas las rutas
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  res.status(statusCode).json({
    error: true,
    message
  });
}

module.exports = errorHandler;
