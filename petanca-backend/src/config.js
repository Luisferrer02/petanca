require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
  headUpMinutes: parseInt(process.env.HEAD_UP_MINUTES, 10) || 10,
textbeltApiKey: process.env.TEXTBELT_API_KEY,
gmailUser: process.env.GMAIL_USER,
gmailPass: process.env.GMAIL_PASS,
};
