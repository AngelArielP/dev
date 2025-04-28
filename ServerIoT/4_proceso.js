const { MongoClient } = require('mongodb');
const { DateTime } = require('luxon');
const { config } = require('dotenv');
const { enviarTelegram } = require("./notificador");

config();

let mongoClient;
let realtimeDB;
let ciclosDB;

async function initMongo() {
  if (mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) return;

  const uri = `mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@${process.env.IP_PROD}:${process.env.PORT_MONGO}`;
  mongoClient = new MongoClient(uri);

  try {
    await mongoClient.connect();
    realtimeDB = mongoClient.db('RealtimePlanta1');
    ciclosDB = mongoClient.db('CiclosPlanta1');
    console.log("✅ Conectado a MongoDB RealtimePlanta1 y CiclosPlanta1 (proceso4)");
  } catch (err) {
    console.error("❌ Error conectando a MongoDB en Proceso4:", err.message);
    await enviarTelegram(`❌ Error conectando a MongoDB en Proceso4: ${err.message}`);
    throw err;
  }
}

module.exports = async function proceso4({ maquina, nombreColeccion }) {
  console.log(`▶️ Ejecutando proceso 4 (conteo de ciclos TOTAL + estadística de tiempos) para máquina: ${maquina}`);

  await initMongo();

  const collection = realtimeDB.collection(nombreColeccion);

  const today = DateTime.now().setZone('America/Mexico_City').startOf('day');
  const tomorrow = today.plus({ days: 1 });

  const documentos = await collection.find({
    maquina: maquina,
    timestamp: {
      $gte: today.toUTC().toJSDate(),
      $lt: tomorrow.toUTC().toJSDate()
    }
  }).sort({ timestamp: 1 }).toArray();

  let totalOnes = 0;
  let lastSensorValue = 0;
  let fechacicloinicial = null;
  let fechaciclofinal = null;

  const tiemposEntreCiclos = []; // 🔥 Lista para guardar tiempos

  let lastCicloTimestamp = null;

  for (const [index, doc] of documentos.entries()) {
    const sensor = doc.data.find(d => d.tag === `${maquina}_L2`);
    if (!sensor) continue;

    const sensorValue = Number(sensor.value);

    if (sensorValue === 1 && lastSensorValue === 0) {
      totalOnes++;

      // 🔥 Guardar tiempos entre ciclos
      if (lastCicloTimestamp) {
        const tiempoMs = doc.timestamp.getTime() - lastCicloTimestamp.getTime(); // Diferencia en ms
        tiemposEntreCiclos.push(tiempoMs);
      }

      lastCicloTimestamp = doc.timestamp; // Guardar para el siguiente
    }

    lastSensorValue = sensorValue;

    if (index === 0) {
      fechacicloinicial = doc.timestamp.toISOString();
    }
    fechaciclofinal = doc.timestamp.toISOString();
  }

  // 🔥 Cálculo de estadísticas:
  let promedioTiempoEntreCiclos = null;
  let minimoTiempoEntreCiclos = null;
  let maximoTiempoEntreCiclos = null;

  if (tiemposEntreCiclos.length > 0) {
    const suma = tiemposEntreCiclos.reduce((a, b) => a + b, 0);
    promedioTiempoEntreCiclos = suma / tiemposEntreCiclos.length;
    minimoTiempoEntreCiclos = Math.min(...tiemposEntreCiclos);
    maximoTiempoEntreCiclos = Math.max(...tiemposEntreCiclos);
  }

  const fechaCreacion = today.toJSDate();
  const nombreColeccionCiclos = `ciclosplanta1_${today.toFormat('yyyy_MM_dd')}`;
  const collectionCiclos = ciclosDB.collection(nombreColeccionCiclos);

  const payload = {
    maquina,
    contadorCiclos: totalOnes,
    fechaInicioCiclo: fechacicloinicial,
    fechaFinCiclo: fechaciclofinal,
    fechaCreacion,
    tiempoPromedioCicloSegundos: promedioTiempoEntreCiclos ? promedioTiempoEntreCiclos / 1000 : null,
    tiempoMinimoCicloSegundos: minimoTiempoEntreCiclos ? minimoTiempoEntreCiclos / 1000 : null,
    tiempoMaximoCicloSegundos: maximoTiempoEntreCiclos ? maximoTiempoEntreCiclos / 1000 : null
  };
  


  const existing = await collectionCiclos.findOne({
    maquina,
    fechaCreacion: { $gte: today.toJSDate(), $lt: tomorrow.toJSDate() }
  });

  if (existing) {
    await collectionCiclos.updateOne({ _id: existing._id }, { $set: payload });
    console.log(`[${maquina}] 🔄 Registro actualizado en ${nombreColeccionCiclos}.`);
  } else {
    await collectionCiclos.insertOne(payload);
    console.log(`[${maquina}] ➕ Registro creado en ${nombreColeccionCiclos}.`);
  }
};
