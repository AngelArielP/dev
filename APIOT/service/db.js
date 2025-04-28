// db.js
require('dotenv').config();
const { MongoClient } = require('mongodb');
const { enviarTelegram } = require('../helper/notificador'); // 👈 Agregamos esto

let client;
let databases = {};

async function connectMongo() {
  if (client && client.topology && client.topology.isConnected()) {
    return databases;
  }

  const uri = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.IP_PROD}:${process.env.PORT_MONGO}`;
  client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    databases = {
      Datacruda: client.db('Datacruda'),
      RealtimePlanta1: client.db('RealtimePlanta1'),
      CiclosPlanta1: client.db('CiclosPlanta1')
    };

    return databases;
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error.message);
    await enviarTelegram(`❌ *Error conectando a MongoDB*: ${error.message}`);
    throw error;
  }
}

module.exports = { connectMongo };
