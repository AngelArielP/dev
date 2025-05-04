<template>
  <div :title="esUltimoCiclo && tooltipFechaUltimo ? tooltipFechaUltimo : ''">
    <div class="header">
      <p class="tag">{{ getMachineName(message.tag) }}</p>
      <p class="date">{{ formattedDate2 }}</p>
    </div>

    <div v-if="error">{{ error }}</div>

    <div v-else-if="data && data.length > 0">
      <div class="row">
        <div class="col">
          <font-awesome-icon :icon="['fas', 'rotate-right']" />
          {{ data[0].cicloTotal }}

          <font-awesome-icon v-if="esUltimoCiclo" :icon="['fas', 'triangle-exclamation']" class="warning-icon" />
        </div>

        <div class="col" v-if="eventosdata && eventos.length > 0">
          <p>{{ eventos[0].eventosTotal }}</p>
        </div>
        <div class="col" v-else>
          <p>Eventos N/A.</p>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { watch, ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  message: { type: Object, required: true },
  index: Number
});

const data = ref(null);
const loading = ref(false);
const error = ref(null);
const selectedMachine = ref(getMachineName(props.message.tag));

const esUltimoCiclo = computed(() => data.value?.length === 1 && data.value[0]?.esUltimo);

const ultimaFechaFormateada = computed(() => {
  const fecha = getUltimaFechaCiclo(data.value?.[0]);
  console.log(fecha)
  return fecha ? formatFecha(fecha) : '';
});

const tooltipFechaUltimo = computed(() => {
  const fecha = getUltimaFechaCiclo(data.value?.[0]);
  return esUltimoCiclo.value && fecha ? `⚠ Último ciclo registrado el ${formatFecha(fecha)}` : '';
});

const claseAlerta = computed(() => {
  if (esUltimoCiclo.value) return 'alerta';         // Rojo
  if (data.value && data.value.length > 0) return 'alerta-ok'; // Verde
  return ''; // Sin clase si no hay datos
});

function formatFecha(fechaStr) {
  if (!fechaStr || isNaN(Date.parse(fechaStr))) return '';
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC' // 👈 Esto hace que NO se convierta a la hora del navegador
  }).format(new Date(fechaStr));
}


function getMachineName(tag) {
  return tag.replace(/_L\d$/, '');
}

function getUltimaFechaCiclo(registro) {
  if (!registro?.turnos || !Array.isArray(registro.turnos)) return null;
  const turnosConFecha = registro.turnos.filter(t => t.fechaciclofinal);
  turnosConFecha.sort((a, b) => b.fechaciclofinal - a.fechaciclofinal);
  return turnosConFecha[0]?.fechaciclofinal || null;
}

const formattedDate2 = computed(() => new Intl.DateTimeFormat('es-MX', {
  year: 'numeric', month: 'numeric', day: 'numeric'
}).format(new Date()));

async function fetchData() {
  loading.value = true;
  error.value = null;

  try {
    const hoy = new Date().toISOString().split('T')[0];
    const response = await axios.get(`http://91.134.75.7:4100/api/ciclosplanta1/search`, {
      params: { maquina: selectedMachine.value, fechaCreacion: hoy }
    });
    data.value = response.data.items || 0;
    if (response.data.items.length === 0) {
      data.value = response.data || 0;
      const fallbackResponse = await axios.get(`http://91.134.75.7:4100/api/ciclosplanta1/ultimo`, {
        params: { maquina: selectedMachine.value }
      });
      if (fallbackResponse.data) {
        fallbackResponse.data.esUltimo = true;
        data.value = [fallbackResponse.data];
      } else {
        data.value = null;
        error.value = 'No se encontraron registros';
      }
    }
  } catch (err) {
    error.value = 'Sin datos';
    console.error = 'Error al obtener datos: ' + err.message;

  } finally {
    loading.value = false;
  }
}

watch(() => props.message.tag, (newTag) => {
  selectedMachine.value = getMachineName(newTag);
  fetchData();
});

onMounted(() => {
  fetchData();
  const intervalId = setInterval(fetchData, 10000);
  onUnmounted(() => clearInterval(intervalId));
});
</script>

<style scoped>
button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 5px;
  font-size: 0.5rem;
}

button:hover {
  background-color: #0056b3;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag {
  font-weight: bold;
  font-size: 1.2rem;
}

.date {
  font-size: 1rem;
  color: #555;
}

.alerta {
  background-color: #ffe6e6;
  border-left: 5px solid #e74c3c;
  padding: 1rem;
  border-radius: 8px;
  animation: blink 1.2s infinite ease-in-out;
}

@keyframes blink {

  0%,
  100% {
    background-color: #ffe6e6;
  }

  50% {
    background-color: #ffcccc;
  }
}

.alerta-ok {
  background-color: #e6ffe6;
  border-left: 5px solid #2ecc71;
  padding: 1rem;
  border-radius: 8px;
}


.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.col {
  flex: 1;
  padding: 0 10px;
}

.warning-icon {
  color: #f39c12;
  margin-left: 5px;
}

.tag,
.date {
  margin-bottom: 0;
}
</style>