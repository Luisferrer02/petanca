// src/utils/handleMails.js
// Envío de correos con Gmail usando OAuth2

const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// Configura el cliente OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Establece el token de refresco
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

/**
 * Envía un e-mail usando Gmail OAuth2
 * @param {object} mailData
 * @param {string} mailData.to      - Dirección de destino
 * @param {string} mailData.subject - Asunto del correo
 * @param {string} mailData.text    - Cuerpo del correo (texto plano)
 */
async function sendEmail({ to, subject, text }) {
  try {
    // Obtén un access token válido
    const accessTokenResponse = await oauth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token || accessTokenResponse;

    // Configura el transporter de Nodemailer con OAuth2
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken
      }
    });

    // Opciones del correo
    const mailOptions = {
      from: process.env.EMAIL,
      to,
      subject,
      text
    };

    // Envío
    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('Error en envío de email (OAuth2):', error);
    throw error;
  }
}

module.exports = { sendEmail };
