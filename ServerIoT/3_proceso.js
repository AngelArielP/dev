const { MongoClient } = require('mongodb');
const { config } = require('dotenv');
const proceso4 = require('./4_proceso'); // 👈 proceso4 se importa aquí
const { enviarTelegram } = require("./notificador");

config();

let mongoClient;
let realtimeDB;

async function initMongo() {
  if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) return;

  const uri = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.IP_PROD}:${process.env.PORT_MONGO}`;
  mongoClient = new MongoClient(uri);

  try {
    await mongoClient.connect();
    realtimeDB = mongoClient.db('RealtimePlanta1');
    console.log("✅ Conectado a MongoDB RealtimePlanta1 (proceso3)");
  } catch (err) {
    console.error("❌ Error conectando a MongoDB en Proceso3:", err.message);
    await enviarTelegram(`❌ Error conectando a MongoDB en Proceso3: ${err.message}`);
    throw err; // Muy importante relanzarlo para que se detenga el flujo
  }
}
function normalizarTag(tag) {
  return (tag || '').trim().toUpperCase();
}
module.exports = async function proceso3({ maquina, nombreColeccion }) {
  console.log(`▶️ Ejecutando proceso 3 (limpieza de duplicados) para máquina: ${maquina}`);

  await initMongo();
  const collection = realtimeDB.collection(nombreColeccion);
  const documentos = await collection.find({ maquina }).sort({ timestamp: 1 }).toArray();

  if (documentos.length === 0) {
    console.warn(`[${maquina}] ⚠️ No se encontraron documentos para analizar.`);
    await proceso4({ maquina, nombreColeccion });
    return;
  }

  const maquinaTag = normalizarTag(`${maquina}_L2`);
  const tieneTagL2 = documentos.some(doc => doc.data.some(d => normalizarTag(d.tag) === maquinaTag));

  if (!tieneTagL2) {
    console.log(`[${maquina}] 🚫 No se encontró el tag ${maquina}_L2, omitiendo limpieza de duplicados.`);
    await proceso4({ maquina, nombreColeccion });
    return;
  }

  let lastValue = null;
  const documentosAEliminar = [];
  let firstZeroFound = false;

  for (const doc of documentos) {
    const sensor = doc.data.find(d => normalizarTag(d.tag) === maquinaTag);
    const sensorValue = sensor ? sensor.value : null;

    if (sensorValue === 0) {
      if (firstZeroFound) {
        documentosAEliminar.push(doc._id);
      } else {
        firstZeroFound = true;
      }
    } else {
      firstZeroFound = false;
    }

    if (sensorValue === lastValue) {
      documentosAEliminar.push(doc._id);
    } else {
      lastValue = sensorValue;
    }
  }

  if (documentosAEliminar.length > 0) {
    const result = await collection.deleteMany({ _id: { $in: documentosAEliminar } });
    console.log(`[${maquina}] 🔥 Eliminados ${result.deletedCount} documentos duplicados.`);
  } else {
    console.log(`[${maquina}] ✅ No se encontraron duplicados.`);
  }

  await proceso4({ maquina, nombreColeccion });
};