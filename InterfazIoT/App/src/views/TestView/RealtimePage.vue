<template>
  <section>
    <div class="header-controls">
      <div>
        <label for="vista">👁️ Vista:</label>
        <select v-model="selectedView" id="vista">
          <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div>
        <label for="updateRate">⏱️ Actualización:</label>
        <select v-model="updateInterval" id="updateRate">
          <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>

      <div v-if="['maquinas', 'slider-individual'].includes(selectedView)">
        <label for="machineSelect">🏭 Máquina:</label>
        <select v-model="selectedMachine" id="slider-individual">
          <option v-for="maquina in machineOptions" :key="maquina" :value="maquina">
            {{ maquina === 'todas' ? '🔁 Todas' : maquina }}
          </option>
        </select>
      </div>

      <div class="info-bar">
        <span>🧠 <strong>{{ totalTags }}</strong> tags</span>
        <span>📊 <strong>{{ totalPoints }}</strong> puntos</span>
      </div>
    </div>

    <!-- Vista: todos, status, L1/L2 -->
    <div class="chart-grid" v-if="['todos', 'status', 'l1l2'].includes(selectedView)">
      <div v-for="tag in filteredTags" :key="tag" class="chart-card" @click="openModal(tag)">
        <h3>{{ tag }}</h3>
        <font-awesome-icon icon="circle-info" class="info-icon" @click.stop="openModal(tag)" />
        <apexchart width="100%" height="250" type="line" :options="getChartOptions(tag)"
          :series="[{ name: tag, data: tagData[tag] }]" />
      </div>
    </div>

    <!-- Vista agrupada por máquina (slider horizontal) -->
    <div v-if="selectedView === 'maquinas'">
      <div v-for="(tags, maquina) in visibleGroupedMachines" :key="maquina" class="maquina-section">
        <h3>{{ maquina }}</h3>
        <div class="slider-container">
          <div class="slider-track">
            <div v-for="tag in tags" :key="tag" class="chart-card small" @click="openModal(tag)">
              <h4>{{ tag }}</h4>
              <font-awesome-icon icon="circle-info" class="info-icon" @click.stop="openModal(tag)" />
              <apexchart width="300" height="220" type="line" :options="getChartOptions(tag)"
                :series="[{ name: tag, data: tagData[tag] }]" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista tipo carrusel individual por máquina -->
    <div v-if="selectedView === 'slider-individual'">
      <div v-for="(tags, maquina) in visibleGroupedMachines" :key="maquina" class="maquina-section">
        <h3>{{ maquina }}</h3>
        <div class="chart-card individual" @click="openModal(getCurrentTag(maquina, tags))">
          <div class="carousel-controls">
            <!-- Izquierda -->
            <button class="arrow-btn" @click.stop="prevTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'arrow-left']" />
            </button>
            <div class="carousel-chart">
              <h4>{{ getCurrentTag(maquina, tags) }}</h4>
              <apexchart width="100%" height="250" type="line" :options="getChartOptions(getCurrentTag(maquina, tags))"
                :series="[{ name: getCurrentTag(maquina, tags), data: tagData[getCurrentTag(maquina, tags)] || [] }]" />
            </div>
            <!-- Derecha -->
            <button class="arrow-btn" @click.stop="nextTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'arrow-right']" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal popup -->
    <div v-if="modalTag" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2>{{ modalTag }}</h2>

        <!-- Componente dinámico -->
        <ModalTagDetail v-if="modalTag" :tag="modalTag" :data="tagData[modalTag]" :datosMaquina="datosMaquina"
          @close="modalTag = null" />

        <button class="close-btn" @click="closeModal">Cerrar</button>
      </div>
    </div>

  </section>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import ApexCharts from 'vue3-apexcharts';
import { connectWebSocket, onMessage } from '@/services/wsService';
import ModalTagDetail from '@/views/TestView/components/ModalTagDetail.vue';

const modalTag = ref(null);
const closeModal = () => modalTag.value = null;

const selectedView = ref('slider-individual');
const selectedMachine = ref('todas');
const datosMaquina = ref([]);

const openModal = (tag) => {
  modalTag.value = tag;

  const maquina = tag.split('_')[0];
  datosMaquina.value = Object.keys(tagData.value)
    .filter(t => t.startsWith(maquina))
    .map(t => ({
      tag: t,
      y: tagData.value[t].at(-1)?.y ?? 0
    }));
};

const machineOptions = computed(() => {
  return ['todas', ...Object.keys(groupedByMachine.value)];
});

const visibleGroupedMachines = computed(() => {
  if (selectedMachine.value === 'todas') return groupedByMachine.value;

  const selected = groupedByMachine.value[selectedMachine.value];
  return selected ? { [selectedMachine.value]: selected } : {};
});
const getMachineData = (tag) => {
  const match = tag.match(/^([A-Za-z0-9]+)[._]/);
  const maquina = match ? match[1] : null;

  if (!maquina) return null;

  // Aquí usas los últimos valores que tengas por máquina
  // Asegúrate de tener esta estructura preprocesada
  const tagsDeMaquina = Object.entries(tagData.value)
    .filter(([t]) => t.startsWith(maquina))
    .map(([t, values]) => {
      const ultimo = values.at(-1);
      return [t, ultimo ? ultimo.y : '-'];
    });

  return {
    nombre: maquina,
    valores: Object.fromEntries(tagsDeMaquina)
  };
};


const filterOptions = [
  { label: 'Slider individual por máquina', value: 'slider-individual' },
  { label: 'Todos los tags', value: 'todos' },
  { label: 'Solo tags Status', value: 'status' },
  { label: 'Solo L1/L2', value: 'l1l2' },
  { label: 'Agrupado por máquina', value: 'maquinas' },
];

const tagData = ref({});
const currentTagIndex = ref({}); // para slider individual
const totalTags = computed(() => Object.keys(tagData.value).length);
const totalPoints = computed(() =>
  Object.values(tagData.value).reduce((acc, arr) => acc + arr.length, 0)
);

const filteredTags = computed(() => {
  if (selectedView.value === 'status') {
    return Object.keys(tagData.value).filter(tag => tag.includes('Status'));
  } else if (selectedView.value === 'l1l2') {
    return Object.keys(tagData.value).filter(tag => tag.includes('_L1') || tag.includes('_L2'));
  } else {
    return Object.keys(tagData.value);
  }
});

const groupedByMachine = computed(() => {
  const map = {};
  for (const tag of Object.keys(tagData.value)) {
    const match = tag.match(/^([A-Za-z0-9]+)[._]/);
    const maquina = match ? match[1] : 'Otros';
    if (!map[maquina]) map[maquina] = [];
    map[maquina].push(tag);
  }
  return map;
});

// Carrusel por máquina
const getCurrentTag = (maquina, tags) => tags[currentTagIndex.value[maquina] || 0] || '';
const nextTag = (maquina, tags) => currentTagIndex.value[maquina] = ((currentTagIndex.value[maquina] || 0) + 1) % tags.length;
const prevTag = (maquina, tags) => currentTagIndex.value[maquina] = ((currentTagIndex.value[maquina] || 0) - 1 + tags.length) % tags.length;

// Memoización de opciones de gráfico
const chartOptionsCache = {};
const getChartOptions = (tag) => {
  if (!chartOptionsCache[tag]) {
    chartOptionsCache[tag] = {
      chart: {
        id: `chart-${tag}`,
        animations: {
          enabled: true,
          easing: "linear",
          dynamicAnimation: { speed: 300 }
        },
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          format: 'dd/MM HH:mm',
          style: {
            colors: '#ccc'
          }
        }
      },
      tooltip: {
        x: {
          formatter: (val) => {
            const date = new Date(val);
            return date.toLocaleString('es-MX', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
              timeZone: 'America/Mexico_City' // 👉 Asegura la zona horaria
            });
          }
        }
      },
      yaxis: { decimalsInFloat: 2 },
      title: {
        text: tag,
        align: "left",
        style: { color: "#fff", fontSize: '14px' }
      },
      colors: ["#4CAF50"],
      theme: { mode: "dark" },
      markers: {
        size: 4,
        colors: ["#FFFFFF"],
        strokeColors: "#fff"
      }
    };
  }
  return chartOptionsCache[tag];
};

// Intervalo de actualización
const updateInterval = ref(5000); // default: 5s
const intervalOptions = [
  { label: "📈 Cada 5 segundos", value: 5000 },
  { label: "📈 Cada 10 segundos", value: 10000 },
  { label: "📈 Cada 1 minuto", value: 60000 }
];

let intervalId;
let buffer = []; // Aquí almacenamos temporalmente

// Procesar datos cada intervalo configurado
function processBuffer() {
  const local = [...buffer];
  buffer = [];

  local.forEach(({ tag, value, time }) => {
    const y = Number(value);
    const x = new Date(time);

    if (!isNaN(y)) {
      if (!tagData.value[tag]) tagData.value[tag] = [];
      tagData.value[tag].push({ x, y });
      if (tagData.value[tag].length > 15) tagData.value[tag].shift();
    }
  });
}

// WebSocket y throttle para render
let updatePending = false;
onMounted(() => {
  connectWebSocket();

  // Recibir datos y agregarlos al buffer
  onMessage((data) => {
    if (data.topic === "/topic/flexy/2233-0701-24/data") {
      try {
        const payload = JSON.parse(data.message);
        buffer.push(...payload);
      } catch (e) {
        console.error("❌ Error al parsear MQTT:", e);
      }
    }
  });

  // Configurar intervalo de actualización
  watch(updateInterval, (newVal) => {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      processBuffer();
    }, newVal);
  }, { immediate: true });
});
watch(tagData, () => {
  if (!modalTag.value) return; // Solo si el modal está abierto

  const maquina = modalTag.value.split('_')[0];
  datosMaquina.value = Object.keys(tagData.value)
    .filter(t => t.startsWith(maquina))
    .map(t => ({
      tag: t,
      y: tagData.value[t].at(-1)?.y ?? 0
    }));
}, { deep: true });

</script>

<style scoped>
/* Controles superiores */
.header-controls,
.filter-bar,
.update-select,
.info-bar,
.machine-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  color: #ccc;
  font-size: 14px;
}

.header-controls {
  justify-content: space-between;
  background: #121212;
  border-radius: 10px;
  border: 1px solid #333;
  margin-bottom: 10px;
}

.header-controls label,
.filter-bar label,
.update-select label,
.machine-filter label {
  font-weight: 600;
  margin-right: 8px;
  color: #ccc;
}

.header-controls select,
.filter-bar select,
.update-select select,
.machine-filter select {
  padding: 6px 8px;
  border-radius: 6px;
  background-color: #202020;
  color: white;
  border: 1px solid #444;
}

/* Cards y grids */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  padding: 20px;
}

.chart-card,
.chart-card.small,
.chart-card.individual {
  background-color: #1e1e1e;
  border-radius: 12px;
  padding: 16px;
  color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;

}

.chart-card.small {
  min-width: 320px;
  max-width: 340px;
  display: inline-block;
  vertical-align: top;
}

.chart-card.individual {
  background: #181818;
  border-radius: 14px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto 40px auto;
  position: relative;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}

/* Carrusel */
.carousel-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.carousel-chart {
  flex: 1;
  text-align: center;
}

.carousel-chart h4 {
  margin-bottom: 10px;
}

/* Botones de flecha */
.arrow-btn {
  background-color: #2e2e2e;
  color: white;
  font-size: 20px;
  padding: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
}

.arrow-btn:hover {
  background-color: #444;
  transform: scale(1.1);
}

.arrow-btn svg {
  width: 20px;
  height: 20px;
}

/* Slider de tarjetas por máquina */
.slider-container {
  overflow-x: auto;
  white-space: nowrap;
  padding-bottom: 10px;
}

.slider-track {
  display: flex;
  gap: 12px;
}

.maquina-section {
  margin-bottom: 40px;
  padding: 0 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-icon {
  font-size: 20px;
  color: #aaa;
  cursor: pointer;
}

.info-icon:hover {
  color: #fff;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  background: #ffffff;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  height: 90%;
  max-width: 95%;
  max-height: 95%;

  color: #fff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  animation: fadeInModal 0.25s ease-in-out;
}

@keyframes fadeInModal {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.close-btn {
  background: #1e395d;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.close-btn:hover {
  background: #2f4158;
}
</style>
