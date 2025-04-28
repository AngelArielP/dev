const mqtt = require('mqtt');
const { MongoClient } = require('mongodb');
const { config } = require('dotenv');
const { DateTime } = require('luxon'); // 👈 cambiamos a Luxon
const proceso2 = require('./2_proceso');
const { enviarTelegram } = require("./notificador");

// Cargar .env
config();

const groupTags = ["OIMA2", "OIMA3", "OIMA4", "OIMA5", "HuskyA", "HuskyB", "HuskyC", "HuskyD", "HuskyE", "HuskyF", "HuskyG", "WM1", "WM2", "WM3"];

let mongoClient;
let mongoDB;

async function initMongo() {
    const user = process.env.MONGO_INITDB_ROOT_USERNAME;
    const pass = process.env.MONGO_INITDB_ROOT_PASSWORD;
    const port = process.env.PORT_MONGO;
    const host = process.env.IP_PROD;

    const uri = `mongodb://${user}:${pass}@${host}:${port}`;
    mongoClient = new MongoClient(uri);

    try {
        await mongoClient.connect();
        await mongoClient.db('admin').command({ ping: 1 });
        mongoDB = mongoClient.db('Datacruda');
        console.log("✅ Conectado a MongoDB Datacruda");
    } catch (err) {
        console.error("❌ Error conectando a MongoDB:", err.message);
        await enviarTelegram(`❌ Error conectando a MongoDB en Proceso1: ${err.message}`);
        throw err;
    }
}

// Insertar en Datacruda
async function insertMessageAndTriggerRealtime(topic, payload) {
    console.log("▶️ Ejecutando proceso 1");

    let data;
    try {
        data = JSON.parse(payload.toString());
    } catch (err) {
        console.error("❌ Error al decodificar JSON:", err.message);
        return;
    }

    const collectionName = topic.replace(/\//g, "_").replace(/-/g, "_");
    const collection = mongoDB.collection(collectionName);

    const now = DateTime.now().setZone('America/Mexico_City');

    // ❗️Aquí manualmente restamos 6 horas
    const nowMenos6h = now.minus({ hours: 6 });

    // Creamos el Date corregido
    const fechaCorrecta = nowMenos6h.toJSDate();

    data.forEach(d => {
        d.time = now.toISO({ suppressMilliseconds: false, includeOffset: true }); // Esto sigue normal
    });

    const doc = {
        timestamp: fechaCorrecta,               // 👈 ya corregido manualmente
        fecha: now.startOf('day').toJSDate(),    // día correcto en Date
        topic,
        data
    };
    try {
        await collection.insertOne(doc);
        console.log(`   ✅ Insertado en Datacruda (${collectionName})`);
        await proceso2(doc);
    } catch (err) {
        console.error(`❌ Error insertando en Datacruda:`, err.message);
        await enviarTelegram(`❌ Error insertando en Datacruda (${collectionName}): ${err.message}`);
    }
}

module.exports = async function proceso1() {
    await initMongo();

    const mqttClient = mqtt.connect('mqtt://tools.ewonsupport.biz:1883', {
        clientId: 'NodeMQTTClient',
        keepalive: 60
    });

    mqttClient.on('connect', () => {
        console.log('   ✅ Conectado al broker MQTT');
        mqttClient.subscribe('/topic/flexy/2233-0701-24/data', err => {
            if (err) console.error('❌ Error suscribiendo al topic:', err.message);
        });
    });

    mqttClient.on('message', async (topic, payload) => {
        await insertMessageAndTriggerRealtime(topic, payload);
    });

    mqttClient.on('error', async (error) => {
        console.error('❌ Error MQTT:', error.message);
        await enviarTelegram(`❌ Error MQTT en Proceso1: ${error.message}`);
        mqttClient.end();
    });

    await new Promise(() => { });
};
