// server.js
require('dotenv').config();
const express = require('express');
const { connectMongo } = require('./service/db.js');
const { enviarTelegram } = require('./helper/notificador.js'); // 👈 Agregamos esto
const { DateTime } = require('luxon');

const app = express();
app.use(express.json());

let dbs;

connectMongo()
  .then(databases => {
    dbs = databases;

    const PORT = process.env.PORT || 4000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      const address = server.address();
      console.log(`🚀 API escuchando en ${address.address}:${address.port}`);
    });
  })
  .catch(async (error) => {
    console.error("🚨 No se pudo iniciar la API:", error.message);
    await enviarTelegram(`🚨 *Error crítico al iniciar API*: ${error.message}`);
  });


// Endpoint GET
app.get('/api/:db/:collection', async (req, res) => {
    const { db, collection } = req.params;
    const { desde, hasta, page = 1, limit = 100, tag, maquina } = req.query;
  
    const ahoraEnMexico = DateTime.now().setZone('America/Mexico_City');
    console.log(ahoraEnMexico.toISO());
  
    try {
      const database = dbs[db];
      if (!database) return res.status(400).json({ error: "Base de datos no encontrada" });
  
      const mongoCollection = database.collection(collection);
  
      let filter = {};
  
      if (db === 'RealtimePlanta1') {
        // SOLO en RealtimePlanta1 filtramos por timestamp y tag
        if (desde || hasta) {
          filter.timestamp = {};
          if (desde) filter.timestamp.$gte = new Date(desde);
          if (hasta) filter.timestamp.$lte = new Date(hasta);
        }
        if (tag) {
          filter["data.tag"] = tag;
        }
        if (maquina) {
          filter.maquina = maquina;
        }
      } else if (db === 'CiclosPlanta1') {
        // SOLO en CiclosPlanta1 filtramos por maquina
        if (maquina) {
          filter = { maquina: maquina }; // 🔥 Aquí filtro limpio SOLO por maquina
        } else {
          filter = {}; // No filtro nada si no piden maquina
        }
      }
  
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const docs = await mongoCollection.find(filter)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ fechaCreacion: -1 }) // Si no hay timestamp, ordena por fechaCreacion
        .toArray();
  
      res.json(docs);
    } catch (error) {
      console.error("❌ Error en GET:", error.message);
      await enviarTelegram(`❌ *Error en GET*:\nDB: ${db}\nCollection: ${collection}\nError: ${error.message}`);
      res.status(500).json({ error: "Error consultando la colección" });
    }
  });
  
  

// Endpoint POST
app.post('/api/:db/:collection', async (req, res) => {
  const { db, collection } = req.params;
  const data = req.body;

  try {
    const database = dbs[db];
    if (!database) return res.status(400).json({ error: "Base de datos no encontrada" });

    const result = await database.collection(collection).insertOne(data);
    res.json({ message: "✅ Documento insertado", id: result.insertedId });
  } catch (error) {
    console.error("❌ Error en POST:", error.message);
    await enviarTelegram(`❌ *Error en POST*:\nDB: ${db}\nCollection: ${collection}\nError: ${error.message}`);
    res.status(500).json({ error: "Error insertando en la colección" });
  }
});
