<template>
  <div>
    <apexchart :options="chartOptions" :series="chartSeries" type="line" height="100" />

    <div v-if="modalActive && latestDocument && latestDocument.data?.length">
      <!-- Tabla de Tags -->
      <div class="tag-table">
        <div class="tabs">
          <button :class="{ active: activeTab === 'prod' }" @click="activeTab = 'prod'">Producción</button>
          <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">Todos</button>
        </div>

        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Tag</th>
                <th>Valor</th>
                <th>Gráfico</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredData" :key="entry.tag">
                <td>{{ tagAliases[entry.tag] || entry.tag }}</td>
                <td>{{ formatWMValue(entry.tag, entry.value) }}</td>
                <td>
                  <KpiCard v-if="sparklineMap[entry.tag]" :title="tagAliases[entry.tag] || entry.tag"
                    :value="formatWMValue(entry.tag, entry.value)" :unit="getUnit(entry.tag)"
                    :sparklineData="sparklineMap[entry.tag].slice(-12)" color="black" />
                </td>

              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { tagAliases } from '@/utils/tagAliases'
import KpiCard from './KpiCard.vue'
const sparklineMap = ref({})

const props = defineProps({
  message: Object,
  index: Number,
  modalActive: Boolean
})

function formatWMValue(tag, value) {
  const toHMS = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    return `${h}h ${m}min`
  }
  const cleanTag = tag.toLowerCase()
  if (cleanTag.includes('time') && typeof value === 'number' && value < 10000000) return toHMS(value)
  if (cleanTag.includes('cyclecounter')) return `${Number(value).toLocaleString()} ciclos`
  if (cleanTag.includes('piece') || cleanTag.includes('lot')) return `${Number(value).toLocaleString()} piezas`
  if (cleanTag.includes('cons')) return `${(value / 1000).toFixed(2)} kg/unidad`
  if (cleanTag.includes('energy')) return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Wh`
  if (cleanTag.includes('temp')) return `${value.toFixed(1)} °C`
  return value
}

function getUnit(tag) {
  const lower = tag.toLowerCase()
  if (lower.includes('energy')) return 'Wh'
  if (lower.includes('cycle')) return 'ciclos'
  if (lower.includes('cons') || lower.includes('avg')) return 'kg'
  if (lower.includes('temp')) return '°C'
  if (lower.includes('time')) return 'h'
  return ''
}

const chartSeries = ref([])
const chartOptions = ref({
  chart: { id: 'wm-realtime', type: 'line', animations: { enabled: false }, toolbar: { show: false } },
  xaxis: { type: 'datetime' },
  yaxis: { labels: { formatter: (val) => Number(val).toFixed(2) } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth' },
})

const tagToPlot = ref('')
const data = ref([])
const latestDocument = ref(null)
let ws = null
let intervalId = null

const getMexicoDate = () => {
  const date = new Date().toLocaleDateString('en-GB', { timeZone: 'America/Mexico_City' })
  const [day, month, year] = date.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

watchEffect(() => {
  const maquina = props.message?.maquina
  if (maquina) {
    tagToPlot.value = `${maquina}_EnergyAbsLastCycle`
  }
})

const updateChartData = (documents) => {
  const history = {}
  documents.forEach(doc => {
    if (!doc.data) return
    doc.data.forEach(entry => {
      if (!history[entry.tag]) history[entry.tag] = []
      history[entry.tag].push(entry.value)
    })
  })

  sparklineMap.value = history

  // gráfico principal
  const formattedData = documents
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map(doc => {
      const tag = doc.data.find(entry => entry.tag === tagToPlot.value)
      return tag ? { x: new Date(doc.timestamp).getTime(), y: tag.value } : null
    })
    .filter(Boolean)

  data.value = formattedData.slice(0, 100)
  chartSeries.value = [{
    name: tagAliases[tagToPlot.value] || tagToPlot.value,
    data: [...data.value]
  }]

  latestDocument.value = documents.at(-1)
}

const sendFetchRequest = () => {
  const message = {
    type: 'fetchDocumentsWM',
    maquina: props.message.maquina,
    fecha: getMexicoDate(),
  }
  ws.send(JSON.stringify(message))
}

const connectWebSocket = () => {
  ws = new WebSocket('ws://91.134.75.7:4200')
  ws.onopen = () => {
    sendFetchRequest()
    intervalId = setInterval(() => sendFetchRequest(), 5000)
  }
  ws.onmessage = (event) => {
    const response = JSON.parse(event.data)
    if (Array.isArray(response.data)) {
      updateChartData(response.data)
    }
  }
  ws.onerror = (error) => console.error('WebSocket Error:', error)
  ws.onclose = () => clearInterval(intervalId)
}

onMounted(connectWebSocket)
onBeforeUnmount(() => {
  clearInterval(intervalId)
  if (ws) ws.close()
})

const activeTab = ref('prod')
const tagsProduccion = computed(() => {
  const prefix = props.message.maquina || 'WM2'
  return [
    `${prefix}_CycleTime`,
    `${prefix}_CyclesMin`,
    `${prefix}_MachineProdTime`,
    `${prefix}_MachineDowntime`
  ]
})

const filteredData = computed(() => {
  if (!latestDocument.value || !latestDocument.value.data) return []
  return latestDocument.value.data.filter(entry => {
    return activeTab.value === 'prod'
      ? tagsProduccion.value.includes(entry.tag)
      : !tagsProduccion.value.includes(entry.tag)
  })
})
</script>

<style scoped>
.kpi-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  width: 10px;
}

.tag-table {
  margin-top: 20px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  color: #2c3e50;
}

.table-scroll {
  max-height: 220px;
  overflow-y: auto;
}

.tag-table table {
  border-collapse: collapse;
  font-size: 14px;
}

.tag-table thead {
  width: 4rem;
  background-color: #f9f9f9;
}

.tag-table th,
.tag-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.tag-table th {
  font-weight: 600;
  color: #34495e;
}

.tag-table td {
  color: #2c3e50;
}

.tabs {
  display: flex;
  margin-bottom: 8px;
  border-bottom: 2px solid #ccc;
}

.tabs button {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 4px solid transparent;
  transition: 0.3s ease;
  cursor: pointer;
}

.tabs button:hover {
  background-color: #f2f2f2;
}

.tabs button.active {
  border-bottom: 4px solid #2c3e50;
  background-color: #ecf0f1;
}

.modal-content {
  max-height: 80vh;
  overflow-y: auto;
  padding: 16px;
}

@media (max-width: 600px) {

  .tag-table table,
  .tag-table th,
  .tag-table td {
    font-size: 12px;
    padding: 8px;
  }

  .tabs button {
    font-size: 14px;
  }
}
</style>
