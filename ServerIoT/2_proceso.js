const { MongoClient } = require('mongodb');
const { config } = require('dotenv');
const proceso3 = require('./3_proceso');
const { enviarTelegram } = require("./notificador");
const { DateTime } = require('luxon'); // 👈 cambiado a Luxon

// Cargar .env
config();

const groupTags = ["OIMA2", "OIMA3", "OIMA4", "OIMA5", "HuskyA", "HuskyB", "HuskyC", "HuskyD", "HuskyE", "HuskyF", "HuskyG", "WM1", "WM2", "WM3"];

let mongoClient;
let realtimeDB;

async function initMongo() {
  if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) {
    return;
  }

  const user = process.env.MONGO_INITDB_ROOT_USERNAME;
  const pass = process.env.MONGO_INITDB_ROOT_PASSWORD;
  const port = process.env.PORT_MONGO;
  const host = process.env.IP_PROD;

  const uri = `mongodb://${user}:${pass}@${host}:${port}`;
  mongoClient = new MongoClient(uri);

  try {
    await mongoClient.connect();
    await mongoClient.db('admin').command({ ping: 1 });
    realtimeDB = mongoClient.db('RealtimePlanta1');
    console.log(" ✅ Conectado a MongoDB RealtimePlanta1");
  } catch (err) {
    console.error("❌ Error conectando a MongoDB:", err.message);
    await enviarTelegram(`❌ Error conectando a MongoDB en Proceso2: ${err.message}`);
    throw err;
  }
}
module.exports = async function proceso2(doc) {
  console.log("▶️ Ejecutando proceso 2 (agrupando datos para Realtime)");

  await initMongo();

  const { data = [], timestamp } = doc;

  const groups = {};
  groupTags.forEach(tag => groups[tag] = []);
  groups["Other"] = [];

  for (const item of data) {
    const tag = item.tag || '';
    const value = item.value;
    let matched = false;

    for (const prefix of groupTags) {
      if (tag.startsWith(prefix)) {
        groups[prefix].push({ tag, value });
        matched = true;
        break;
      }
    }
    if (!matched) {
      groups["Other"].push({ tag, value });
    }
  }

  const fechaMexico = DateTime.fromJSDate(new Date(timestamp)).setZone('America/Mexico_City');
  const nombreColeccion = `realtime_data_${fechaMexico.toFormat('yyyy_MM_dd')}`;

  for (const [group, values] of Object.entries(groups)) {
    if (values.length === 0) continue;

    const realtimeCollection = realtimeDB.collection(nombreColeccion);

    const nuevoDoc = {
      maquina: group,
      timestamp,
      data: values
    };

    try {
      await realtimeCollection.insertOne(nuevoDoc);
      console.log(` ✅ Insertado en ${nombreColeccion}: Máquina ${group} (${values.length} tags)`);
      await proceso3({ maquina: group, nombreColeccion });
    } catch (err) {
      console.error(`❌ Error insertando en Realtime:`, err.message);
      await enviarTelegram(`❌ Error insertando en Realtime (proceso2): ${err.message}`);
    }
  }
};