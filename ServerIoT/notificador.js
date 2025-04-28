// notificador.js
require('dotenv').config();
const axios = require('axios');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  throw new Error("🚨 Variables de entorno TELEGRAM_TOKEN o TELEGRAM_CHAT_ID no definidas.");
}

const TELEGRAM_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

async function enviarTelegram(mensaje) {
  try {
    await axios.post(TELEGRAM_URL, {
      chat_id: TELEGRAM_CHAT_ID,
      text: mensaje,
    });
    console.log("📩 Notificación enviada a Telegram.");
  } catch (error) {
    console.error("⚠️ Error enviando notificación a Telegram:", error.message);
  }
}

module.exports = { enviarTelegram };
