// ecosystem.config.js
require('dotenv').config(); // 👈 Carga aquí las variables del .env para PM2

module.exports = {
  apps: [
    {
      name: 'APIOT',
      script: './APIOT/server.js',
      env: {
        NODE_ENV: 'production',
        TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        MONGO_INITDB_ROOT_USERNAME: process.env.MONGO_INITDB_ROOT_USERNAME,
        MONGO_INITDB_ROOT_PASSWORD: process.env.MONGO_INITDB_ROOT_PASSWORD,
        PORT_MONGO: process.env.PORT_MONGO,
        IP_PROD: process.env.IP_PROD
      }
    },
    {
      name: 'SERVERIOT',
      script: './ServerIoT/main.js',
      env: {
        NODE_ENV: 'production',
        TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
        TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
        MONGO_INITDB_ROOT_USERNAME: process.env.MONGO_INITDB_ROOT_USERNAME,
        MONGO_INITDB_ROOT_PASSWORD: process.env.MONGO_INITDB_ROOT_PASSWORD,
        PORT_MONGO: process.env.PORT_MONGO,
        IP_PROD: process.env.IP_PROD
      }
    }
  ]
};
