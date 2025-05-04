import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import { setWsClients, publishToMqtt } from './mqttClient.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  setWsClients(clients);

  console.log('🌐 Cliente WebSocket conectado');

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.topic && data.message) {
        publishToMqtt(data.topic, data.message);
      }
    } catch (e) {
      console.error('❌ Mensaje malformado:', e.message);
    }
  });

  ws.on('close', () => {
    clients = clients.filter((c) => c !== ws);
    setWsClients(clients);
    console.log('🔌 Cliente WebSocket desconectado');
  });
});

const PORT = 4001;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket escuchando en ws://localhost:${PORT}`);
});
