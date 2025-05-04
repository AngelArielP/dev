import mqtt from 'mqtt';

let wsClients = [];

const mqttClient = mqtt.connect('mqtt://tools.ewonsupport.biz:1883', {
  clientId: 'node-bridge-' + Math.random().toString(16).slice(2, 8),
  clean: true,
});

mqttClient.on('connect', () => {
  console.log('✅ Conectado al broker MQTT de Ewon');
  mqttClient.subscribe('/topic/flexy/2233-0701-24/data', (err) => {
    if (err) console.error('❌ Error al suscribirse:', err);
    else console.log('📥 Suscrito al topic de Ewon');
  });
});

mqttClient.on('message', (topic, message) => {
  console.log(`📨 Mensaje desde MQTT (${topic}): ${message.toString()}`);
  wsClients.forEach((ws) => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify({ topic, message: message.toString() }));
    }
  });
});

export function setWsClients(clients) {
  wsClients = clients;
}

export function publishToMqtt(topic, message) {
  mqttClient.publish(topic, message);
}
