let socket = null;
let messageHandlers = [];

export function connectWebSocket(url = "ws://localhost:4001") {
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("✅ Conectado al WebSocket del backend");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    //console.log("📨 Mensaje recibido del backend:", data);
    messageHandlers.forEach((handler) => handler(data));
  };

  socket.onerror = (error) => {
    console.error("❌ Error en WebSocket:", error);
  };

  socket.onclose = () => {
    console.warn("🔌 WebSocket cerrado");
  };
}

export function sendMessageToMqtt(topic, message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ topic, message }));
  } else {
    console.warn("⚠️ WebSocket no está listo para enviar");
  }
}

export function onMessage(handler) {
  messageHandlers.push(handler);
}
