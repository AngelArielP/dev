const { MongoClient } = require('mongodb');
const { config } = require('dotenv');
const { DateTime } = require('luxon');
const { enviarTelegram } = require("./notificador");

config();

// ⚙️ Datos de conexión
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
    console.log("✅ Conectado a MongoDB en procesoWM");
  } catch (err) {
    console.error("❌ Error conectando a MongoDB en procesoWM:", err.message);
    await enviarTelegram(`❌ Error conectando a MongoDB en procesoWM: ${err.message}`);
    throw err;
  }
}

module.exports = async function procesoWM(doc) {
  console.log("▶️ Ejecutando procesoWM (procesando datos de máquinas WM)");

  await initMongo();

  const { data = [], timestamp } = doc;

  const fechaMexico = DateTime.fromJSDate(new Date(timestamp)).setZone('America/Mexico_City');
  const nombreColeccion = `realtime_data_${fechaMexico.toFormat('yyyy_MM_dd')}`;

  const groups = {
    WM1: [],
    WM2: [],
    WM3: []
  };

  for (const item of data) {
    const cleanTag = (item.tag || '').trim().toUpperCase();
    const value = item.value;

    if (cleanTag.startsWith('WM1')) {
      groups.WM1.push({ tag: cleanTag, value });
    } else if (cleanTag.startsWith('WM2')) {
      groups.WM2.push({ tag: cleanTag, value });
    } else if (cleanTag.startsWith('WM3')) {
      groups.WM3.push({ tag: cleanTag, value });
    }
  }

  const realtimeCollection = realtimeDB.collection(nombreColeccion);

  for (const [group, values] of Object.entries(groups)) {
    if (values.length === 0) {
      console.warn(`⚠️ No se encontraron datos para ${group}`);
      continue;
    }

    const nuevoDoc = {
      maquina: group,
      timestamp,
      data: values
    };

    try {
      await realtimeCollection.insertOne(nuevoDoc);
      console.log(`✅ Insertado en ${nombreColeccion}: Máquina ${group} (${values.length} tags)`);
    } catch (err) {
      console.error(`❌ Error insertando ${group}:`, err.message);
      await enviarTelegram(`❌ Error insertando máquina ${group} en procesoWM: ${err.message}`);
    }
  }
};
