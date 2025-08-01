// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { port, mongoUri } = require('./config');
const errorHandler = require('./middlewares/errorHandler');
const { frontendUrl } = require('./config');

const corsOptions = {
  origin: frontendUrl,            // sólo permite peticiones desde tu frontend
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 200        // para navegadores legacy
};



// Carga todos los modelos
require('./models');

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const matchRoutes = require('./routes/match');
const notifyRoutes = require('./routes/notify');
const adminRoutes = require('./routes/admin');

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);


mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    app.listen(port, () =>
      console.log(`Servidor escuchando en http://localhost:${port}`)
    );
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
  });

  require('./utils/scheduler');