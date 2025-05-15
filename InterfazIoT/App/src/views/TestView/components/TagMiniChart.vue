<template>
  <div class="kpi-line">
    <div class="kpi-card">
      <apexchart class="apexchart" v-if="seriesData.length" type="line" width="100%" height="60" :options="chartOptions"
        :series="[{ name: tag, data: seriesData }]" />
      <div v-else class="no-data">Caragando ....</div>
    </div>

  </div>

</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import ApexChart from 'vue3-apexcharts';
import { connectWebSocket, onMessage } from '@/services/wsService';

const props = defineProps({
  tag: String
});

const seriesData = ref([]);
const buffer = ref([]);
let intervalId;

onMounted(() => {
  connectWebSocket();

  onMessage((data) => {
    if (data.topic === "/topic/flexy/2233-0701-24/data") {
      try {
        const payload = JSON.parse(data.message);

        const puntos = Array.isArray(payload)
          ? payload.filter(p => p.tag === props.tag)
          : [payload].filter(p => p.tag === props.tag);

        buffer.value.push(...puntos);
      } catch (e) {
        console.error("❌ Error al parsear MQTT:", e);
      }
    }
  });

  let lastValue = null; // ⬅️ Guarda el último valor agregado

  intervalId = setInterval(() => {
    if (!buffer.value.length) return;

    const local = [...buffer.value];
    buffer.value = [];

    local.forEach(p => {
      const y = Number(p.value);
      const x = new Date(p.time || p.timestamp);

      if (!isNaN(y)) {
        // ✅ Solo agregamos si es distinto del anterior
        if (lastValue !== y) {
          lastValue = y;
          seriesData.value.push({ x, y });
          if (seriesData.value.length > 50) seriesData.value.shift();
        }
      }
    });
  }, 3000);

});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

const formatter = (value) =>
  new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

const chartOptions = {
  chart: {
    id: 'sparkline',
    sparkline: { enabled: true },
    animations: {
      enabled: true,
      easing: "linear",
      dynamicAnimation: { speed: 300 }
    }
  },
  stroke: { curve: 'smooth', width: 2 },
  tooltip: {
    enabled: true,
    y: {
      formatter // 👈 usa el formateador
    }
  },
  xaxis: {
    type: 'datetime'
  },
  yaxis: {
    show: false,
    labels: {
      formatter
    }
  }
};

</script>

<style scoped>
.kpi-card {
  border-radius: 12px;
  color: rgb(12, 4, 4);
  background-color: #19875433;
  min-width: 8rem;
  margin:1rem;
}

.kpi-line {
  width: 10px;
}

.no-data {
  font-size: 12px;
  color: gray;
  text-align: center;
}

.apexchart {
  width: 100%;
  margin-top: auto;
}
</style>