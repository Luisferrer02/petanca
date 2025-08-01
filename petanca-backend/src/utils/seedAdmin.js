// src/utils/seedAdmin.js
// Script para crear la cuenta admin inicial si no existe
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');
const { mongoUri } = require('../config');

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    console.error('ERROR: Debes definir ADMIN_USERNAME y ADMIN_PASSWORD en tu .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  let admin = await Admin.findOne({ username });
  if (admin) {
    console.log(`La cuenta admin '${username}' ya existe.`);
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    admin = new Admin({ username, passwordHash });
    await admin.save();
    console.log(`Cuenta admin '${username}' creada correctamente.`);
  }

  mongoose.disconnect();
}

seedAdmin().catch(err => {
  console.error('Error al seedear admin:', err);
  process.exit(1);
});

/*
  Añadir en package.json:

  "scripts": {
    "seed-admin": "node src/utils/seedAdmin.js"
  }

  Y en tu .env:
  ADMIN_USERNAME=admin
  ADMIN_PASSWORD=tu_contraseña_segura
*/
