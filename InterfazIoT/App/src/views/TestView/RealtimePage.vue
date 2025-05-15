<template>
  <section>
    <div class="header-controls">
      <!-- Selector de vista -->
      <div class="control-group">
        <label for="vista">👁️ Vista:</label>
        <select v-model="selectedView" id="vista">
          <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Checkbox Mostrar OEE -->
      <div class="control-group">
        <label>
          <input type="checkbox" v-model="mostrarOeeGlobal" />
          Mostrar OEE
        </label>
      </div>

      <!-- Selector de intervalo -->
      <div class="control-group">
        <label for="updateRate">⏱️ Actualización:</label>
        <select v-model="updateInterval" id="updateRate">
          <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Selector de máquina (solo si aplica) -->
      <div class="control-group" v-if="['maquinas', 'slider-individual'].includes(selectedView)">
        <label for="machineSelect">🏭 Máquina:</label>
        <select v-model="selectedMachine" id="machineSelect">
          <option v-for="maquina in machineOptions" :key="maquina" :value="maquina">
            {{ maquina === 'todas' ? '🔁 Todas' : maquina }}
          </option>
        </select>
      </div>

      <!-- Info general -->
      <div class="info-bar">
        <span>🧠 <strong>{{ totalTags }}</strong> tags</span>
        <span>📊 <strong>{{ totalPoints }}</strong> puntos</span>
        <span>{{ fechaActual }}</span>
      </div>
    </div>

    <!-- Cargando datos -->
    <div v-if="isLoading" class="loading-message">
      <p>🕓 Esperando datos...</p>
    </div>


    <!-- Vista: todos, status, L1/L2 
    <div class="chart-grid" v-if="['todos', 'status', 'l1l2'].includes(selectedView)">
      <div v-for="tag in filteredTags" :key="tag" class="chart-card" @click="openModal(tag)">
        <h3>{{ tag }}</h3>
        <font-awesome-icon icon="circle-info" class="info-icon" @click.stop="openModal(tag)" />
        <apexchart width="100%" height="250" type="line" :options="getChartOptions(tag)"
          :series="[{ name: tag, data: tagData[tag] }]" />
      </div>
    </div>
-->
    <!-- Vista agrupada por máquina (slider horizontal) 
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
-->
    <!-- Vista tipo carrusel individual por máquina 
    <div v-if="selectedView === 'slider-individual'">
      <div v-for="(tags, maquina) in visibleGroupedMachines" :key="maquina" class="maquina-section">
        <h3>{{ maquina }}</h3>
        <div class="chart-card individual" @click="openModal(getCurrentTag(maquina, tags))">
          <div class="carousel-controls">
            <button class="arrow-btn" @click.stop="prevTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'arrow-left']" />
            </button>
            <div class="carousel-chart">
              <h4>{{ getCurrentTag(maquina, tags) }}</h4>
              <apexchart width="100%" height="250" type="line" :options="getChartOptions(getCurrentTag(maquina, tags))"
                :series="[{ name: getCurrentTag(maquina, tags), data: tagData[getCurrentTag(maquina, tags)] || [] }]" />
            </div>
            <button class="arrow-btn" @click.stop="nextTag(maquina, tags)">
              <font-awesome-icon :icon="['fas', 'arrow-right']" />
            </button>
          </div>
        </div>
      </div>
    </div>-->
    <!-- Carrusel individual por máquina con múltiples tags por card
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
    </div> -->

    <!-- Vista: Card único por máquina con navegación tipo carrusel para sus tags -->
    <div v-if="selectedView === 'compacto-carrusel'" class="card-grid-small">
      <div v-for="(tags, maquina) in visibleGroupedMachines" :key="maquina" class="bootstrap-card">
        <!-- Mostrar vista normal -->
        <div v-if="!mostrarOeeGlobal" class="card-body p-2">
          <div class="card-header text-center fw-bold d-flex justify-content-between align-items-center">
            <span><strong>{{ maquina }}</strong></span>
            <button class="btn-circular-danger" @click="abrirModalFalla(maquina)">ℹ️</button>
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
              < </button>
                <button class="arrow-btn-sm" @click="nextInnerTag(maquina, tags)">></button>

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
    <!-- 
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
    -->
    <div v-if="modalInfoMaquina" class="modal-overlay" @click.self="cerrarModalFalla">
      <div class="modal-card">
        <!-- Tabs -->
        <div class="tabs">
          <button v-for="(tab, index) in tabs" :key="index" :class="{ active: currentTab === index }"
            @click="currentTab = index">
            {{ tab.label }}
          </button>
        </div>

        <!-- Contenido de cada tab -->
        <div v-if="currentTab === 0" class="form-section-2col">
          <div class="col">
            <label>Orden de Producción</label>
            <select v-model="formData.parametros.ordenProduccion">
              <option disabled value="">Selecciona una orden</option>
              <option v-for="orden in ordenesDisponibles" :key="orden" :value="orden">{{ orden }}</option>
            </select>

            <label>Lote</label>
            <select v-model="formData.parametros.lote">
              <option disabled value="">Selecciona un lote</option>
              <option v-for="lote in lotesDisponibles" :key="lote" :value="lote">{{ lote }}</option>
            </select>
            <!-- Selector de molde y cálculo de shots restantes -->
            <label>Molde</label>
            <select v-model="formData.parametros.molde">
              <option disabled value="">Selecciona molde</option>
              <option v-for="molde in moldesDisponibles" :key="molde.nombre" :value="molde.nombre">
                {{ molde.nombre }}
              </option>
            </select>
            <p v-if="moldeSeleccionado" style="color: black; font-size: 0.85rem; margin-top: 0.3rem;"> Total: {{
              moldeSeleccionado.total }} |
              Usados: {{ moldeSeleccionado.usados }} |
              Restantes: {{ moldeSeleccionado.total - moldeSeleccionado.usados }}
            </p>

            <label>Temperatura Máxima (°C)</label>
            <input type="number" v-model="formData.parametros.temperaturaMax" />
          </div>

          <div class="col">
            <label>Piezas a producir</label>
            <input type="number" v-model="formData.parametros.piezasProducir" placeholder="Ej: 1000" />

            <label>Referencia de la Pieza</label>
            <select v-model="formData.parametros.referenciaPieza">
              <option disabled value="">Selecciona una referencia</option>
              <option v-for="ref in referenciasDisponibles" :key="ref" :value="ref">{{ ref }}</option>
            </select>

            <label>Tiempo de Ciclo Max. (s)</label>
            <input type="number" v-model="formData.parametros.tiempoCiclo" />

            <label>Temperatura Mínima (°C)</label>
            <input type="number" v-model="formData.parametros.temperaturaMin" />
          </div>
        </div>


        <div v-if="currentTab === 1" class="form-section">
          <label>Tipo de Falla</label>
          <select v-model="formData.falla.tipo">
            <option disabled value="">Selecciona tipo de falla</option>
            <option v-for="opcion in tiposFalla" :key="opcion.valor" :value="opcion.valor">
              {{ opcion.label }}
            </option>
          </select>

          <!-- Subtipo y piezas fallidas (igual que antes) -->
          <div v-if="formData.falla.tipo" style="margin-top: 1rem;">
            <label>Subtipo de Falla</label>
            <select v-model="formData.falla.subtipo">
              <option disabled value="">Selecciona subtipo</option>
              <option v-for="sub in subtipoFallaMap[formData.falla.tipo]" :key="sub" :value="sub">
                {{ sub }}
              </option>
            </select>

            <label style="margin-top: 1rem;">N° de piezas fallidas</label>
            <input type="number" inputmode="numeric" v-model="formData.falla.piezasFallidas" />
          </div>

        </div>

        <div v-if="currentTab === 2" class="form-section">
          <label>Comentarios u observaciones del operador</label>
          <textarea rows="4" style="width: 100%" v-model="formData.observaciones"></textarea>
        </div>

        <div v-if="currentTab === 3" class="form-section">
          <label>Cargar evidencia (imagen)</label>
          <input type="file" accept="image/*" @change="handleFileUpload" />
          <div v-if="formData.evidencia" style="margin-top:10px;">
            <img :src="formData.evidencia" alt="preview" style="max-width: 100%; border: 1px solid #ccc;" />
          </div>
        </div>

        <button class="submit-btn" @click="enviarReporte">Guardar</button>

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
/* ────── 1. IMPORTS ────── */
import { ref, computed, onMounted, watch } from 'vue';
import ApexCharts from 'vue3-apexcharts';
import { connectWebSocket, onMessage } from '@/services/wsService';
import ModalTagDetail from '@/views/TestView/components/ModalTagDetail.vue';

/* ────── 2. VARIABLES PRINCIPALES ────── */
const modalTag = ref(null);
const closeModal = () => modalTag.value = null;
const isLoading = ref(true);
const selectedView = ref('compacto-carrusel');
const selectedMachine = ref('todas');
const mostrarOeeGlobal = ref(false);
const updateInterval = ref(5000);
const datosMaquina = ref([]);
const tagData = ref({});
const currentTagIndex = ref({});
const oeePorMaquina = ref({});
const oeeMetricaSeleccionada = ref({});
const currentCarouselIndex = ref(0);
let intervalId;
let buffer = [];
const modalInfoMaquina = ref(null);
const currentTab = ref(0);
const formData = ref({
  parametros: {
    molde: '',
    tiempoCiclo: '',
    temperaturaZona1: '',
    temperaturaZona2: ''
  },
  falla: '',
  observaciones: '',
  evidencia: null
});
const ordenesDisponibles = ['ORD-001', 'ORD-002', 'ORD-003'];
const lotesDisponibles = ['Lote-A', 'Lote-B', 'Lote-C'];
const referenciasDisponibles = ['Ref-X1', 'Ref-X2'];

const tiposFalla = [
  { valor: 'Hidráulica', label: 'Hidráulica' },
  { valor: 'Eléctrica', label: 'Eléctrica' },
  { valor: 'Moldeo', label: 'Moldeo' },
  { valor: 'Sensor', label: 'Sensor / Feedback' },
];

const subtipoFallaMap = {
  Hidráulica: ['Fuga', 'Presión baja', 'Válvula defectuosa'],
  Eléctrica: ['Motor quemado', 'Fusible dañado', 'Contacto suelto'],
  Moldeo: ['Flash', 'Corto disparo', 'Quemado'],
  Sensor: ['Sensor sucio', 'Sin lectura', 'Error de calibración']
};

formData.value.parametros = {
  ordenProduccion: '',
  piezasProducir: '',
  lote: '',
  referenciaPieza: '',
  molde: '',
  tiempoCiclo: '',
  temperaturaMax: '',
  temperaturaMin: ''
};
const moldesDisponibles = [
  { nombre: 'Molde-01', total: 100000, usados: 35000 },
  { nombre: 'Molde-02', total: 80000, usados: 42000 },
  { nombre: 'Molde-03', total: 120000, usados: 5000 }
];

formData.value.falla = {
  tipo: '',
  subtipo: '',
  piezasFallidas: ''
};

const moldeSeleccionado = computed(() =>
  moldesDisponibles.find(m => m.nombre === formData.value.parametros.molde)
);

const tabs = [
  { label: '📝 Parámetros del ciclo' },
  { label: '🛠️ Tipo de falla' },
  { label: '📋 Observaciones' },
  { label: '📸 Evidencia' }
];


const shotsRestantes = computed(() =>
  moldeSeleccionado.value
    ? moldeSeleccionado.value.total - moldeSeleccionado.value.usados
    : null
);

/* ────── 3. OPCIONES DE VISTA Y FILTROS ────── */
const filterOptions = [
  { label: 'Todas las maquinas', value: 'compacto-carrusel' },
];
const intervalOptions = [
  { label: "📈 Cada 5 segundos", value: 5000 },
  { label: "📈 Cada 10 segundos", value: 10000 },
  { label: "📈 Cada 1 minuto", value: 60000 }
];
const maquinasClave = ['HuskyA', 'HuskyB', 'HuskyC', 'HuskyF', 'OIMA3', 'WM1', 'WM2', 'WM3'];
/* ────── 4. AGRUPAMIENTO Y FILTROS ────── */
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
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      formData.value.evidencia = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

function enviarReporte() {
  console.log("📤 Reporte enviado:", formData.value);
  // Aquí podrías hacer POST a una API, guardar en IndexedDB, etc.
  alert("Reporte guardado correctamente.");
  cerrarModalFalla();
}

const machineOptions = computed(() => ['todas', ...Object.keys(groupedByMachine.value)]);

const visibleGroupedMachines = computed(() => {
  const all = selectedMachine.value === 'todas'
    ? groupedByMachine.value
    : { [selectedMachine.value]: groupedByMachine.value[selectedMachine.value] || [] };

  const sorted = Object.keys(all).sort().reduce((acc, k) => {
    acc[k] = all[k];
    return acc;
  }, {});

  for (const m of Object.keys(sorted)) {
    if (!(m in currentTagIndex.value)) currentTagIndex.value[m] = 0;
  }

  return sorted;
});

const filteredTags = computed(() => {
  if (selectedView.value === 'status') {
    return Object.keys(tagData.value).filter(t => t.includes('Status'));
  } else if (selectedView.value === 'l1l2') {
    return Object.keys(tagData.value).filter(t => t.includes('_L1') || t.includes('_L2'));
  } else {
    return Object.keys(tagData.value);
  }
});

const filteredMachinesGrouped = computed(() => {
  const entries = Object.entries(groupedByMachine.value)
    .filter(([m]) => maquinasClave.includes(m))
    .sort(([a], [b]) => a.localeCompare(b));

  const result = Object.fromEntries(entries);
  for (const m of Object.keys(result)) {
    if (!(m in currentTagIndex.value)) currentTagIndex.value[m] = 0;
  }
  return result;
});

/* ────── 5. NAVEGACIÓN / SLIDER ────── */
const getCurrentTag = (maquina, tags) => tags[currentTagIndex.value[maquina] || 0] || '';
const nextTag = (maquina, tags) => currentTagIndex.value[maquina] = ((currentTagIndex.value[maquina] || 0) + 1) % tags.length;
const prevTag = (maquina, tags) => currentTagIndex.value[maquina] = ((currentTagIndex.value[maquina] || 0) - 1 + tags.length) % tags.length;
const abrirModalFalla = (maquina) => {
  modalInfoMaquina.value = maquina;
};
const cerrarModalFalla = () => {
  modalInfoMaquina.value = null;
};
const carouselMachines = computed(() => Object.values(visibleGroupedMachines.value));
const nextCarouselCard = () => currentCarouselIndex.value = (currentCarouselIndex.value + 1) % carouselMachines.value.length;
const prevCarouselCard = () => currentCarouselIndex.value = (currentCarouselIndex.value - 1 + carouselMachines.value.length) % carouselMachines.value.length;
const getMachineName = (index) => Object.keys(visibleGroupedMachines.value)[index] || '';

const nextInnerTag = (maquina, tags) => currentTagIndex.value[maquina] = (currentTagIndex.value[maquina] + 1) % tags.length;
const prevInnerTag = (maquina, tags) => currentTagIndex.value[maquina] = (currentTagIndex.value[maquina] - 1 + tags.length) % tags.length;

/* ────── 6. GRÁFICAS Y OPCIONES ────── */
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
          style: { colors: '#ccc' }
        }
      },
      tooltip: {
        x: {
          formatter: (val) => new Date(val).toLocaleString('es-MX', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'America/Mexico_City'
          })
        }
      },
      yaxis: { decimalsInFloat: 2 },
      title: { text: tag, align: "left", style: { color: "#fff", fontSize: '14px' } },
      colors: ["#4CAF50"],
      theme: { mode: "dark" },
      markers: { size: 4, colors: ["#fff"], strokeColors: "#fff" }
    };
  }
  return chartOptionsCache[tag];
};

/* ────── 7. MODAL Y DATOS POR MÁQUINA ────── */
const openModal = (tag) => {
  modalTag.value = tag;
  const maquina = tag.split('_')[0];
  datosMaquina.value = Object.keys(tagData.value)
    .filter(t => t.startsWith(maquina))
    .map(t => ({ tag: t, y: tagData.value[t].at(-1)?.y ?? 0 }));
};

watch(tagData, () => {
  if (!modalTag.value) return;
  const maquina = modalTag.value.split('_')[0];
  datosMaquina.value = Object.keys(tagData.value)
    .filter(t => t.startsWith(maquina))
    .map(t => ({ tag: t, y: tagData.value[t].at(-1)?.y ?? 0 }));
}, { deep: true });

/* ────── 8. WEBSOCKET Y BUFFER ────── */
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
      if (tagData.value[tag].length > 20) tagData.value[tag].shift();
      dataReceived = true;
    }
  });

  if (dataReceived) isLoading.value = false;
}

onMounted(() => {
  connectWebSocket();
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

  watch(updateInterval, (newVal) => {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(processBuffer, newVal);
  }, { immediate: true });

  recalcularOee();
  setInterval(recalcularOee, 10000);
});

/* ────── 9. OEE Y MÉTRICAS ────── */
const calcularOee = (maquina) => {
  const total = Math.floor(70 + Math.random() * 30);
  const disponibilidad = Math.floor(85 + Math.random() * 10);
  const rendimiento = Math.floor(80 + Math.random() * 10);
  const calidad = Math.floor(90 + Math.random() * 10);
  const partes = Math.floor(100 + Math.random() * 200);
  const adelanto = total > 100 ? `${Math.floor(Math.random() * 10)} ahead` : `${Math.floor(Math.random() * 20)} behind`;
  return { total, disponibilidad, rendimiento, calidad, partes, adelanto };
};

function recalcularOee() {
  const result = {};
  Object.keys(groupedByMachine.value).forEach(maquina => {
    result[maquina] = calcularOee(maquina);
  });
  oeePorMaquina.value = result;
}

const getOeeColor = (valor) => valor >= 85 ? '#1a5642' : valor >= 70 ? '#c08000' : '#7c0013';
const getOeeBackgroundClass = (valor) => valor >= 85 ? 'oee-bg-verde' : valor >= 70 ? 'oee-bg-amarillo' : 'oee-bg-rojo';

const getOeeDonutOptions = (maquina, metrica = 'total') => {
  const valor = oeePorMaquina.value[maquina]?.[metrica] ?? 0;
  const color = getOeeColor(valor);
  return {
    chart: { type: 'radialBar', offsetY: 0, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 270,
        hollow: { size: '65%', background: '#1a1a1a' },
        dataLabels: {
          name: { show: true, offsetY: -10, color: "#fff", fontSize: '14px' },
          value: { formatter: (val) => `${val.toFixed(0)}%`, color: "#fff", fontSize: '22px' }
        }
      }
    },
    labels: [metrica === 'total' ? 'OEE' : metrica],
    fill: { type: 'solid', colors: [color] },
    stroke: { lineCap: "round" }
  };
};

const getMetricaActiva = (maquina) => oeeMetricaSeleccionada.value[maquina] || 'total';
const seleccionarMetrica = (maquina, metrica) => oeeMetricaSeleccionada.value[maquina] = metrica;

/* ────── 10. UTILIDADES ────── */
const totalTags = computed(() => Object.keys(tagData.value).length);
const totalPoints = computed(() => Object.values(tagData.value).reduce((acc, arr) => acc + arr.length, 0));
const fechaActual = computed(() => new Date().toLocaleDateString('es-MX', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Mexico_City'
}));
const getLastTimestamp = (tag) => {
  const last = tagData.value[tag]?.at(-1)?.x;
  return last ? new Date(last) : new Date(0);
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
</script>


<style scoped>
:root {
  --color-bg: #1e1e1e;
  --color-bg-dark: #121212;
  --color-text: #ccc;
  --color-white: #fff;
  --color-border: #333;
  --color-border-light: #444;
  --color-hover: #444;
  --card-radius: 12px;
  --padding-base: 10px;
  --padding-lg: 20px;
}

/* --- CONTROLES SUPERIORES --- */
.header-controls,
.filter-bar,
.update-select,
.info-bar,
.machine-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  padding: var(--padding-base) var(--padding-lg);
  color: var(--color-text);
  font-size: 14px;
}

.header-controls {
  justify-content: space-between;
  background: var(--color-bg-dark);
  border-radius: 10px;
  border: 1px solid var(--color-border);
  margin-bottom: 10px;
}

.header-controls label,
.filter-bar label,
.update-select label,
.machine-filter label {
  font-weight: 600;
  margin-right: 8px;
  color: var(--color-text);
}

.header-controls select,
.filter-bar select,
.update-select select,
.machine-filter select {
  padding: 6px 8px;
  border-radius: 6px;
  background-color: #202020;
  color: var(--color-white);
  border: 1px solid var(--color-border-light);
}

/* --- GRILLA Y CARDS --- */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  padding: var(--padding-lg);
}

.chart-card,
.chart-card.small,
.chart-card.individual {
  background-color: var(--color-bg);
  border-radius: var(--card-radius);
  padding: 16px;
  color: var(--color-white);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.chart-card.small {
  min-width: 320px;
  max-width: 340px;
  display: inline-block;
}

.chart-card.individual {
  background: #181818;
  max-width: 800px;
  margin: 0 auto 40px;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
}

/* --- CARRUSEL --- */
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

/* --- BOTONES FLECHA (Reutilizado) --- */
.arrow-btn,
.arrow-btn-sm {
  background-color: #32435b;
  color: var(--color-white);
  border: none;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.arrow-btn {
  font-size: 20px;
  padding: 12px;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-btn-sm {
  font-size: 14px;
  padding: 6px 10px;
  border-radius: 6px;
}

.arrow-btn:hover,
.arrow-btn-sm:hover {
  background-color: var(--color-hover);
  transform: scale(1.05);
}

.arrow-btn svg {
  width: 20px;
  height: 20px;
}

/* --- SLIDER Y SECCIONES --- */
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
  padding: 0 var(--padding-lg);
}

/* --- MODAL --- */
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
  border-radius: var(--card-radius);
  width: 90%;
  height: 90%;
  max-width: 95%;
  max-height: 95%;
  color: var(--color-white);
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
  color: var(--color-white);
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
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

/* --- MINI CARDS --- */
.card-small,
.bootstrap-card {
  background-color: #202020;
  border: 1px solid var(--color-border-light);
  border-radius: 10px;
  padding: 10px;
  color: var(--color-white);
  transition: transform 0.2s;
}

.card-small:hover,
.bootstrap-card:hover {
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

.card-grid-small {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: var(--padding-lg);
}

/* --- OEE CARDS --- */
.oee-card {
  border-radius: var(--card-radius);
  padding: 16px;
  color: var(--color-white);
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.3);
}

.oee-activa {
  background-color: #28a745;
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
}

.circle-bg {
  fill: none;
  stroke: #eee;
  stroke-width: 3.8;
}

.circle {
  fill: none;
  stroke: var(--color-white);
  stroke-width: 3.8;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s ease;
}

.percentage {
  fill: var(--color-white);
  font-size: 0.5em;
  text-anchor: middle;
}

.gauge-label {
  font-size: 12px;
  margin-top: 6px;
  opacity: 0.8;
}

.oee-metrics {
  font-size: 13px;
  line-height: 1.4;
  margin-top: 10px;
}

.oee-kpis-row {
  display: flex;
  justify-content: space-around;
  font-size: 14px;
  margin-top: 10px;
  color: var(--color-white);
}

.oee-kpis-row span {
  padding: 4px 8px;
  background: #2a2a2a;
  border-radius: 6px;
  transition: background 0.3s;
  cursor: pointer;
}

.oee-kpis-row span.active {
  background-color: #e7f0e9;
  color: #000;
}

/* --- OEE COLORES --- */
.oee-bg-verde {
  background-color: #1f3e31;
}

.oee-bg-amarillo {
  background-color: #4d3c1a;
}

.oee-bg-rojo {
  background-color: #3e1f25;
}

.btn-circular-danger {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: transparent;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-circular-danger:hover {
  background-color: #2f3e53;
  color: white;
}

.modal-content {
  background: #ffffff;
  color: #000000;
  /* <- letras negras */
}

.modal-grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  height: 100%;
}

.modal-tabs {
  background: #f4f4f4;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-tabs button {
  padding: 10px;
  border: none;
  background: #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background 0.3s;
}

.modal-tabs button.active {
  background-color: #007bff;
  color: white;
  font-weight: bold;
}

.modal-body {
  padding: 20px;
  background-color: white;
  color: black;
  border-radius: 8px;
  overflow-y: auto;
}

.tags-box {
  margin-top: 20px;
}

.tags-box ul {
  padding-left: 20px;
}

.close-btn {
  background-color: #1e395d;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  margin-top: 20px;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-card {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.tabs {
  display: flex;
  border-bottom: 2px solid #ccc;
  margin-bottom: 1rem;
}

.tabs button {
  background: none;
  border: none;
  padding: 0.5rem 1rem;
  color: #777;
  cursor: pointer;
}

.tabs button.active {
  border-bottom: 2px solid #0a47cc;
  color: #0a47cc;
  font-weight: bold;
}

.form-section label {
  display: block;
  margin-top: 1rem;
  font-weight: 500;
}

.form-section input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 0.3rem;
}

.submit-btn {
  margin-top: 1.5rem;
  width: 100%;
  padding: 0.75rem;
  background: #0a47cc;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: bold;
  cursor: pointer;
}

.form-section-2col {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-section-2col .col {
  flex: 1;
  min-width: 200px;
}

.form-section-2col label {
  display: block;
  margin-top: 0.8rem;
  font-weight: 500;
}

.form-section-2col select,
.form-section-2col input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 0.3rem;
}
</style>
