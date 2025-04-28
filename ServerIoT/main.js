  require('dotenv').config();

  const proceso1 = require("./1_proceso");
  const { enviarTelegram } = require("./notificador"); // 👈 usamos notificador.js

  async function ejecutarProceso(nombre, funcion) {
    try {
      await funcion();
    } catch (error) {
      console.error(`❌ Fallo en ${nombre}:`, error.message);
      await enviarTelegram(`⚠️ Falló el ${nombre}: ${error.message}`);
    }
  }

  async function main() {
    await ejecutarProceso("Proceso 1", proceso1);
    console.log("🏁 Todos los procesos han sido ejecutados.");
  }

  main();
