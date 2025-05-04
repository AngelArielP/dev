<template>
  <section class="mqtt-container">
    <h2>🔗 MQTT vía WebSocket</h2>
    <div v-if="lastRawPayload.length" class="raw-message">
      <label>🧾 Último mensaje recibido (JSON):</label>
      <pre class="scrollable-json">{{ lastRawPayload }}</pre>
    </div>


    <div class="selector-chart">
      <label for="tagSelect">Seleccionar tag para graficar:</label>
      <select v-model="selectedTag" id="tagSelect">
        <option disabled value="">-- Selecciona un tag --</option>
        <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
      </select>

      <apexchart v-if="selectedTag" width="100%" height="300" type="line" :options="chartOptions"
        :series="chartSeries" />
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ApexCharts from 'vue3-apexcharts';
import { connectWebSocket, onMessage } from '@/services/wsService';

const selectedTag = ref('');
const tagData = ref({}); // Estructura: { tag: [ { x, y }, ... ] }
const topic = "/topic/flexy/2233-0701-24/data";
const lastRawPayload = ref('');

// Obtener lista de tags en tiempo real
const availableTags = computed(() => Object.keys(tagData.value));

// Serie actual para el gráfico
const chartSeries = computed(() => {
  return selectedTag.value
    ? [{ name: selectedTag.value, data: tagData.value[selectedTag.value] || [] }]
    : [];
});

// Opciones para ApexCharts
const chartOptions = {
  chart: {
    id: "mqtt-real-time",
    animations: {
      enabled: true,
      easing: "linear",
      dynamicAnimation: { speed: 300 }
    },
    toolbar: { show: false },
    zoom: { enabled: false }
  },
  xaxis: {
    type: "datetime"
  },
  yaxis: {
    decimalsInFloat: 2
  },
  title: {
    text: "Serie de tiempo en vivo",
    align: "left",
    style: { color: "#fff" }
  },
  theme: { mode: "dark" },
  colors: ["#4CAF50"], // ✅ Aquí defines el color (verde)
  markers: {
    size: 6,
    colors: ["#4CAF50"], // ✅ Color de los puntos
    strokeColors: "#fff",
    strokeWidth: 2,
    hover: {
      size: 8
    }
  }
};

onMounted(() => {
  connectWebSocket();

  onMessage((data) => {
    if (data.topic === topic) {
      try {
        const payload = JSON.parse(data.message); // <- debe ser un array
        lastRawPayload.value = JSON.stringify(payload, null, 2); // 👈 se almacena para mostrarlo

        payload.forEach(({ tag, value, time }) => {
          const y = Number(value);
          const x = new Date(time);

          if (!isNaN(y)) {
            if (!tagData.value[tag]) tagData.value[tag] = [];
            tagData.value[tag].push({ x, y });

            // Limitar puntos a 30
            if (tagData.value[tag].length > 30) {
              tagData.value[tag].shift();
            }
          }
        });
      } catch (err) {
        console.error("❌ Error al parsear mensaje MQTT:", err);
      }
    }
  });
});
</script>

<style scoped>
.mqtt-container {
  max-width: 94%;
  margin: 30px auto;
  padding: 20px;
  border-radius: 10px;
  background-color: #1e1e1e;
  color: #fff;
  font-family: 'Segoe UI', sans-serif;
}

.selector-chart {
  margin-top: 30px;
}

.selector-chart label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
}

.selector-chart select {
  padding: 8px;
  border-radius: 5px;
  margin-bottom: 20px;
  background-color: #2a2a2a;
  color: #fff;
  border: none;
}

.raw-message {
  margin-top: 30px;
}

.raw-message label {
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.scrollable-json {
  background-color: #2a2a2a;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #dcdcdc;
  max-height: 250px;       /* 👈 Altura fija */
  overflow-y: auto;        /* 👈 Scroll vertical */
  font-size: 14px;
  line-height: 1.4;
}

</style>
