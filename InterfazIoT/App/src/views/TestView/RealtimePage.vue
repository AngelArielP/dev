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
        <label>
          <input type="checkbox" v-model="mostrarOeeGlobal" />
          Mostrar OEE
        </label>
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
        <span class="">
          {{ fechaActual }}
        </span>
      </div>
    </div>
    <div v-if="isLoading" class="loading-message">
      <p>🕓 Esperando datos...</p>
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
    <!-- Carrusel individual por máquina con múltiples tags por card -->
    <div v-if="selectedView === 'cards-pequeños'" class="carousel-container">
      <button class="arrow-btn" @click="prevCarouselCard">
        <font-awesome-icon :icon="['fas', 'arrow-left']" />
      </button>

      <div class="carousel-card-wrapper">
        <div v-if="carouselMachines.length > 0" class="bootstrap-card"
          @click="openModal(carouselMachines[currentCarouselIndex][0])">
          <div class="card-header text-center fw-bold">
            {{ getMachineName(currentCarouselIndex) }}
          </div>
          <div class="card-body p-2">
            <div v-for="tag in carouselMachines[currentCarouselIndex]" :key="tag" class="mb-3">
              <small class="text-muted">{{ tag }}</small>
              <apexchart width="100%" height="100" type="line" :options="getChartOptions(tag)"
                :series="[{ name: tag, data: tagData[tag] || [] }]" />
            </div>
          </div>
        </div>
      </div>

      <button class="arrow-btn" @click="nextCarouselCard">
        <font-awesome-icon :icon="['fas', 'arrow-right']" />
      </button>
    </div>
    <!-- Vista: Card único por máquina con navegación tipo carrusel para sus tags -->
    <div v-if="selectedView === 'compacto-carrusel'" class="card-grid-small">
      <div v-for="(tags, maquina) in visibleGroupedMachines" :key="maquina" class="bootstrap-card">
        <!-- Mostrar vista normal -->
        <div v-if="!mostrarOeeGlobal" class="card-body p-2">
          <div class="card-header text-center fw-bold d-flex justify-content-between align-items-center">
            <span><strong>{{ maquina }}</strong></span>
            <button class="btn btn-sm btn-outline-danger" @click="abrirModalFalla(maquina)">
              🔧 </button>
          </div>
          <div class="card-body p-2">
            <div class="grid-info">

              <!-- Botón para registrar falla manual -->
              <div class="text-center mt-2">
                <span title="Ciclos">🔁 --</span>
                <span title="Eventos">📅 --</span>
                <span title="Producción">🏭 --</span>
                <span title="Estado">✅ --</span>
               
              </div>

            </div>
          </div>

          <!-- Slider de tags -->
          <div class="d-flex justify-content-between align-items-center mb-2 mt-2">
            <button class="arrow-btn-sm" @click="prevInnerTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'chevron-left']" />
            </button>
            <button class="arrow-btn-sm" @click="nextInnerTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'chevron-right']" />
            </button>
          </div>

          <div class="chart-area" @click="openModal(getCurrentTag(maquina, tags))">
            <apexchart width="100%" height="100" type="line" :options="getChartOptions(getCurrentTag(maquina, tags))"
              :series="[{ name: getCurrentTag(maquina, tags), data: tagData[getCurrentTag(maquina, tags)] || [] }]" />
          </div>
        </div>

        <!-- Mostrar tarjeta OEE -->
        <div v-else class="oee-card"
          :class="getOeeBackgroundClass(oeePorMaquina[maquina]?.[getMetricaActiva(maquina)] ?? 0)">
          <div class="oee-header">
            <h4>{{ maquina }}</h4>
            <small>2h · Activa</small>
          </div>
          <div class="oee-body">
            <apexchart type="radialBar" height="200" :options="getOeeDonutOptions(maquina, getMetricaActiva(maquina))"
              :series="[oeePorMaquina[maquina]?.[getMetricaActiva(maquina)] ?? 0]" />

            <div class="oee-kpis-row">
              <span :class="{ active: getMetricaActiva(maquina) === 'disponibilidad' }"
                @click="seleccionarMetrica(maquina, 'disponibilidad')"> <strong>D:</strong> {{
                  oeePorMaquina[maquina]?.disponibilidad ?? '-' }}%
              </span>
              <span :class="{ active: getMetricaActiva(maquina) === 'rendimiento' }"
                @click="seleccionarMetrica(maquina, 'rendimiento')">
                <strong>R:</strong> {{ oeePorMaquina[maquina]?.rendimiento ?? '-' }}%
              </span>
              <span :class="{ active: getMetricaActiva(maquina) === 'calidad' }"
                @click="seleccionarMetrica(maquina, 'calidad')">
                <strong>C:</strong> {{ oeePorMaquina[maquina]?.calidad ?? '-' }}%
              </span>
            </div>


          </div>

        </div>
      </div>
    </div>

    <div v-if="selectedView === 'vista-filtrada'" class="card-grid-small">
      <div v-for="(tags, maquina) in filteredMachinesGrouped" :key="maquina" class="bootstrap-card">
        <div class="card-header text-center fw-bold d-flex justify-content-between align-items-center">
          <span>{{ maquina }}</span>
          <span class="">{{ fechaActual }}</span>
        </div>

        <div class="card-body p-2">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <button class="arrow-btn-sm" @click="prevInnerTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'chevron-left']" />
            </button>
            <button class="arrow-btn-sm" @click="nextInnerTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'chevron-right']" />
            </button>
          </div>

          <div class="chart-area" @click="openModal(getCurrentTag(maquina, tags))">
            <apexchart width="100%" height="100" type="line" :options="getChartOptions(getCurrentTag(maquina, tags))"
              :series="[{ name: getCurrentTag(maquina, tags), data: tagData[getCurrentTag(maquina, tags)] || [] }]" />
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
const isLoading = ref(true);

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
  const machines = selectedMachine.value === 'todas'
    ? groupedByMachine.value
    : { [selectedMachine.value]: groupedByMachine.value[selectedMachine.value] || [] };

  // Ordenar alfabéticamente
  const sortedMachines = Object.keys(machines)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = machines[key];
      return acc;
    }, {});

  // Inicializa índice si no existe
  for (const maquina of Object.keys(sortedMachines)) {
    if (!(maquina in currentTagIndex.value)) {
      currentTagIndex.value[maquina] = 0;
    }
  }

  return sortedMachines;
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

const getOeeBackgroundClass = (valor) => {
  if (valor >= 85) return 'oee-bg-verde';   // Suave
  if (valor >= 70) return 'oee-bg-amarillo';
  return 'oee-bg-rojo';
};

const filterOptions = [
  { label: 'Slider individual por máquina', value: 'slider-individual' },
  { label: 'Todos los tags', value: 'todos' },
  { label: 'Solo tags Status', value: 'status' },
  { label: 'Solo L1/L2', value: 'l1l2' },
  { label: 'Agrupado por máquina', value: 'maquinas' },
  { label: 'Vista cards pequeñas', value: 'cards-pequeños' }, // 🔹 Nueva opción
  { label: 'Compacto Carrusel por Máquina', value: 'compacto-carrusel' }, // 👈 nueva vista
  { label: 'Vista filtrada por máquinas clave', value: 'vista-filtrada' },



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
const maquinasClave = ['HuskyA', 'HuskyB', 'HuskyC', 'HuskyF', 'OIMA3', 'WM1', 'WM2', 'WM3'];

const filteredMachinesGrouped = computed(() => {
  const entries = Object.entries(groupedByMachine.value)
    .filter(([maquina]) => maquinasClave.includes(maquina))
    .sort(([a], [b]) => a.localeCompare(b));

  const result = Object.fromEntries(entries);

  // Inicializar índices
  for (const maquina of Object.keys(result)) {
    if (!(maquina in currentTagIndex.value)) {
      currentTagIndex.value[maquina] = 0;
    }
  }

  return result;
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
const getOeeColor = (valor) => {
  if (valor >= 85) return '#1a5642'; // verde
  if (valor >= 70) return '#c08000'; // amarillo
  return '#7c0013'; // rojo
};

const getOeeDonutOptions = (maquina, metrica = 'total') => {
  const valor = oeePorMaquina.value[maquina]?.[metrica] ?? 0;
  const color = getOeeColor(valor);

  return {
    chart: {
      type: 'radialBar',
      offsetY: 0,
      sparkline: { enabled: true }
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 270,
        hollow: {
          size: '65%',
          background: '#1a1a1a'
        },
        dataLabels: {
          name: {
            show: true,
            offsetY: -10,
            color: "#fff",
            fontSize: '14px'
          },
          value: {
            formatter: (val) => `${val.toFixed(0)}%`,
            color: "#fff",
            fontSize: '22px'
          }
        }
      }
    },
    labels: [metrica === 'total' ? 'OEE' :
      metrica === 'disponibilidad' ? 'Disponibilidad' :
        metrica === 'rendimiento' ? 'Rendimiento' :
          metrica === 'calidad' ? 'Calidad' : metrica],
    fill: {
      type: 'solid',
      colors: [color]
    },
    stroke: { lineCap: "round" }
  };
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

  let dataReceived = false;

  local.forEach(({ tag, value, time }) => {
    const y = Number(value);
    const x = new Date(time);

    if (!isNaN(y)) {
      if (!tagData.value[tag]) tagData.value[tag] = [];
      tagData.value[tag].push({ x, y });
      if (tagData.value[tag].length > 10) tagData.value[tag].shift();
      dataReceived = true;
    }
  });

  if (dataReceived) {
    isLoading.value = false;
  }
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
  recalcularOee();
  setInterval(recalcularOee, 10000); // cada 10s
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
const carouselMachines = computed(() => Object.values(visibleGroupedMachines.value));
const currentCarouselIndex = ref(0);

const prevCarouselCard = () => {
  currentCarouselIndex.value = (currentCarouselIndex.value - 1 + carouselMachines.value.length) % carouselMachines.value.length;
};

const nextCarouselCard = () => {
  currentCarouselIndex.value = (currentCarouselIndex.value + 1) % carouselMachines.value.length;
};

const getMachineName = (index) => {
  const keys = Object.keys(visibleGroupedMachines.value);
  return keys[index] || '';
};
const nextInnerTag = (maquina, tags) => {
  const current = currentTagIndex.value[maquina] || 0;
  const next = (current + 1) % tags.length;
  currentTagIndex.value[maquina] = next;
};

const prevInnerTag = (maquina, tags) => {
  const current = currentTagIndex.value[maquina] || 0;
  const prev = (current - 1 + tags.length) % tags.length;
  currentTagIndex.value[maquina] = prev;
};
const timeSince = (date) => {
  if (!date) return 'sin datos';
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
};

const getLastTimestamp = (tag) => {
  const last = tagData.value[tag]?.at(-1)?.x;
  return last ? new Date(last) : new Date(0);
};
const fechaActual = computed(() => {
  const now = new Date();
  return now.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Mexico_City'
  });
});

const mostrarOeeGlobal = ref(false);
const calcularOee = (maquina) => {
  const total = Math.floor(70 + Math.random() * 30);
  const disponibilidad = Math.floor(85 + Math.random() * 10);
  const rendimiento = Math.floor(80 + Math.random() * 10);
  const calidad = Math.floor(90 + Math.random() * 10);
  const partes = Math.floor(100 + Math.random() * 200);
  const adelanto = total > 100 ? `${Math.floor(Math.random() * 10)} parts ahead` : `${Math.floor(Math.random() * 20)} parts behind`;
  return { total, disponibilidad, rendimiento, calidad, partes, adelanto };
};
const oeePorMaquina = ref({});

function recalcularOee() {
  const result = {};
  Object.keys(groupedByMachine.value).forEach(maquina => {
    const total = Math.floor(70 + Math.random() * 30);
    const disponibilidad = Math.floor(85 + Math.random() * 10);
    const rendimiento = Math.floor(80 + Math.random() * 10);
    const calidad = Math.floor(90 + Math.random() * 10);
    const partes = Math.floor(100 + Math.random() * 200);
    const adelanto = total > 100
      ? `${Math.floor(Math.random() * 10)} parts ahead`
      : `${Math.floor(Math.random() * 20)} parts behind`;

    result[maquina] = { total, disponibilidad, rendimiento, calidad, partes, adelanto };
  });
  oeePorMaquina.value = result;
}
const oeeMetricaSeleccionada = ref({}); // { 'HuskyA': 'total', 'WM1': 'disponibilidad', ... }

const getMetricaActiva = (maquina) => {
  return oeeMetricaSeleccionada.value[maquina] || 'total'; // default: total
};

const seleccionarMetrica = (maquina, metrica) => {
  oeeMetricaSeleccionada.value[maquina] = metrica;
};

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

.loading-message {
  text-align: center;
  font-size: 18px;
  color: #aaa;
  margin: 40px 0;
}


.card-small {
  background-color: #202020;
  border: 1px solid #444;
  border-radius: 10px;
  padding: 10px;
  color: white;
  transition: transform 0.2s;
  cursor: pointer;
}

.card-small:hover {
  transform: scale(1.03);
  border-color: #888;
}

.card-header-small {
  font-size: 14px;
  margin-bottom: 6px;
  color: #ddd;
  text-align: center;
}

.card-body-small {
  text-align: center;
}

.carousel-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px;
}

.carousel-card-wrapper {
  min-width: 340px;
  max-width: 600px;
  flex-grow: 1;
}



.bootstrap-card:hover {
  transform: scale(1.02);
  border-color: #888;
}

.bootstrap-card .card-header {
  background-color: #1e1e1e;
  border-bottom: 1px solid #333;
  padding: 10px;
  font-size: 16px;
}

.bootstrap-card .card-body {
  max-height: 400px;
  overflow-y: auto;
}

.bootstrap-card small {
  display: block;
  margin-bottom: 4px;
}

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

.card-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
}

.bootstrap-card {
  background-color: #2c2c2c;
  border: 1px solid #444;
  border-radius: 10px;
  color: white;
  padding: 10px;
  cursor: pointer;
  transition: transform 0.2s ease;
  cursor: default;
}

.bootstrap-card .card-body {
  padding: 12px;
}

.arrow-btn-sm {
  background-color: #2e2e2e;
  color: white;
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.arrow-btn-sm:hover {
  background-color: #444;
  transform: scale(1.05);
}

.chart-area {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1e1e1e;
}

.oee-card {
  border-radius: 12px;
  padding: 16px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
}

.oee-activa {
  background-color: #28a745;
  /* verde activo */
}

.oee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.oee-gauge {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circular-chart {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: block;
}

.circle-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke-width: 3.8;
  stroke-linecap: round;
  stroke: white;
  transition: stroke-dasharray 0.3s ease;
}

.percentage {
  fill: white;
  font-size: 0.5em;
  text-anchor: middle;
}

.gauge-label {
  font-size: 12px;
  margin-top: 6px;
  opacity: 0.8;
}

.partes {
  font-size: 18px;
  font-weight: bold;
}

.oee-metrics {
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.4;
}

.oee-kpis-row {
  display: flex;
  justify-content: space-around;
  margin-top: 10px;
  font-size: 14px;
  color: #fff;
}

.oee-kpis-row span {
  padding: 4px 8px;
  background: #2a2a2a;
  border-radius: 6px;
}

.oee-kpis-row span {
  cursor: pointer;
  transition: background 0.3s;
}

.oee-kpis-row span.active {
  background-color: #e7f0e9;
  color: rgb(0, 0, 0);
}

.oee-bg-verde {
  background-color: #1f3e31;
}

.oee-bg-amarillo {
  background-color: #4d3c1a;
}

.oee-bg-rojo {
  background-color: #3e1f25;
}
</style>
