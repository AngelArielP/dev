const mqtt = require('mqtt');
const { DateTime } = require('luxon');
const { config } = require('dotenv');
config();

// ⚙️ Configuración
const MQTT_BROKER = 'mqtt://tools.ewonsupport.biz:1883';
const MQTT_TOPIC = '/topic/flexy/2233-0701-24/data';
const LISTEN_TIME_MS = 30000; // ⏳ Tiempo a escuchar en ms (30s)

// Tags de agrupamiento
const groupTags = ["OIMA2", "OIMA3", "OIMA4", "OIMA5", "HuskyA", "HuskyB", "HuskyC", "HuskyD", "HuskyE", "HuskyF", "HuskyG", "WM1", "WM2", "WM3"];

const foundGroups = {};
groupTags.forEach(tag => foundGroups[tag] = []);
foundGroups["Other"] = [];

console.log(`🔎 Conectando a broker MQTT para escuchar durante ${LISTEN_TIME_MS/1000} segundos...`);

const mqttClient = mqtt.connect(MQTT_BROKER, {
  clientId: 'MQTTVerificadorClient',
  keepalive: 60
});

mqttClient.on('connect', () => {
  console.log('✅ Conectado al broker MQTT');
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (err) console.error('❌ Error suscribiendo:', err.message);
  });
});

mqttClient.on('message', (topic, payload) => {
  let data;
  try {
    data = JSON.parse(payload.toString());
  } catch (err) {
    console.error('❌ Error decodificando mensaje:', err.message);
    return;
  }

  for (const item of data) {
    const cleanTag = (item.tag || '').trim().toUpperCase();

    let matched = false;
    for (const prefix of groupTags) {
      if (cleanTag.startsWith(prefix.toUpperCase())) {
        foundGroups[prefix].push(cleanTag);
        matched = true;
        break;
      }
    }
    if (!matched) {
      foundGroups["Other"].push(cleanTag);
    }
  }
});

// ⏰ Finalizar después de LISTEN_TIME_MS
setTimeout(() => {
  mqttClient.end();
  console.log('🛑 Tiempo de escucha terminado.');
  
  console.log('\n📋 Resultado de Tags detectados por grupo:');
  for (const [group, tags] of Object.entries(foundGroups)) {
    const uniqueTags = [...new Set(tags)];
    console.log(`\n🔹 ${group}: (${uniqueTags.length} tags)`);
    uniqueTags.forEach(tag => console.log(`   - ${tag}`));
  }

  process.exit(0);
}, LISTEN_TIME_MS);

mqttClient.on('error', (error) => {
  console.error('❌ Error en conexión MQTT:', error.message);
  mqttClient.end();
});
