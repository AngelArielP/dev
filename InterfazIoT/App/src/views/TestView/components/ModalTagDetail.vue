<template>
    <div class="modal-content-grid">
        <!-- 🔼 Gráfico histórico completo -->
        <div class="full-width">
            <h4>📈 Histórico del tag: {{ tag }}</h4>
            <div v-if="loading" class="loading-msg">Cargando serie...</div>
            <div v-else-if="error" class="error-msg">❌ Error: {{ error }}</div>
            <div v-else>
                <apexchart width="100%" height="300" type="line" :options="chartOptions"
                    :series="[{ name: tag, data: historicalData }]" />
            </div>
        </div>

        <!-- 🔽 Abajo: tabs + tiempo real en una sola tarjeta -->
        <div class="bottom-section">
            <div class="combined-box">
                <div class="tabs">
                    <button v-for="tab in tabs" :key="tab" :class="{ active: currentTab === tab }"
                        @click="currentTab = tab">
                        {{ tab }}
                    </button>
                </div>

                <div class="tab-content">
                    <div v-if="currentTab === 'Último dato'">
                        <div class="tag-list scrollable">
                            <div v-for="(d, i) in datosMaquinaFiltrados" :key="i" class="tag-entry">
                                <span class="tag-name">{{ getTagLabel(d.tag) }}</span>
                                <span class="tag-value">{{ formatNumber(d.value) }} {{ getTagUnit(d.tag) }}</span>
                                <TagMiniChart :tag="d.tag" />
                            </div>
                        </div>


                    </div>

                    <div v-if="currentTab === 'Resumen'" class="resumen-realtime-grid">
                        <div class="resumen-box">
                            <h4>📊 <span>Resumen</span></h4>
                            <ul>
                                <li><strong>Min:</strong> {{ formatNumber(resumen.min) }}</li>
                                <li><strong>Max:</strong> {{ formatNumber(resumen.max) }}</li>
                                <li><strong>Promedio:</strong> {{ formatNumber(resumen.avg) }}</li>

                                <li><strong>Total puntos:</strong> {{ data.length }}</li>
                            </ul>
                        </div>

                        <div class="realtime-box">
                            <h4>⚡ <span>Tiempo real (últimos 5)</span></h4>
                            <ul>
                                <li v-for="(p, i) in data.slice(-5)" :key="i">
                                    {{ formatDate(p.x) }} - <strong>{{ p.y }}</strong>
                                </li>
                            </ul>
                        </div>
                    </div>



                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import ApexChart from 'vue3-apexcharts';
import TagMiniChart from '@/views/TestView/components/TagMiniChart.vue';
import { getTagLabel, getTagUnit } from '@/utils/tagAliases';

const props = defineProps({
    tag: String,
    data: Array,
    datosMaquina: Array
});
const formatNumber = (num) =>
    new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);

const tabs = ['Último dato', 'Resumen'];
const currentTab = ref('Último dato');
const historicalData = ref([]);
const loading = ref(true);
const error = ref(null);

const resumen = computed(() => {
    if (!props.data || props.data.length === 0) return { min: '-', max: '-', avg: '-' };
    const vals = props.data.map(d => d.y);
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
    return {
        min: Math.min(...vals),
        max: Math.max(...vals),
        avg
    };
});

const fetchHistorical = async () => {
    loading.value = true;
    error.value = null;
    try {
        const res = await fetch(`http://localhost:4000/api/historicoTag?tag=${encodeURIComponent(props.tag)}`);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const result = await res.json();
        historicalData.value = result.map(d => ({
            x: new Date(d.timestamp),
            y: Number(d.value)
        }));
    } catch (err) {
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

const chartOptions = {
    chart: {
        id: 'historico-chart',
        animations: {
            enabled: true,
            easing: 'linear',
            dynamicAnimation: { speed: 400 }
        },
        toolbar: { show: false },
        zoom: { enabled: false }
    },
    xaxis: { type: 'datetime' },
    yaxis: { decimalsInFloat: 2 },
    theme: { mode: 'dark' },
    colors: ['#00BFFF']
};

const formatDate = d => new Date(d).toLocaleString('es-MX');
const maquina = computed(() => props.tag.split('_')[0]);

const datosMaquinaFiltrados = computed(() => {
    return props.datosMaquina.map(d => ({
        tag: d.tag,
        value: d.y ?? d.value,
    }));
});


onMounted(fetchHistorical);
watch(() => props.tag, fetchHistorical);
</script>

<style scoped>
.modal-content-grid {
    width: auto;
    max-width: 86rem;
    padding: 0px 14px;
    border-radius: 14px;
    color: var(--text);
    display: flex;
    flex-direction: column;
    gap: 30px;
}

.full-width {
    width: 100%;
}

.bottom-section {
    display: flex;
    justify-content: center;
}

.combined-box {
    flex: 1;
    background: var(--bg);
    color: var(--text);
    padding: 20px;
    border-radius: 10px;
}

.tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
}

.tabs button {
    background: var(--bg);
    color: var(--text);
    padding: 6px 14px;
    border: 1px solid var(--primary);
    border-radius: 6px;
    cursor: pointer;
}

.tabs button.active {
    background: var(--primary);
    color: white;
    font-weight: bold;
}

.tab-content {
    background: var(--bg);
    color: var(--text);
    border-radius: 10px;
}

.realtime-box {
    margin-top: 20px;
}

.realtime-box ul,
.tab-content ul {
    padding-left: 18px;
}

.tag-list {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    /* 4 columnas */
    gap: 16px;
    padding: 16px;
    max-height: 50vh;
    overflow-y: auto;
}

.tag-entry {
    display: flex;
    flex-direction: column;
    background: #3d427c22;
    /* tono verde muy suave */
    border-radius: 12px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
    min-height: 140px;
    transition: transform 0.2s ease;
}

.tag-entry:hover {
    transform: scale(1.03);
}

.tag-name {
    font-weight: 600;
    color: #333;
    font-size: 14px;
    text-align: center;
    margin-bottom: 4px;
}

.tag-value {
    font-size: 16px;
    font-weight: bold;
    color: #007bff;
    margin-bottom: 6px;
}


.loading-msg {
    font-size: 14px;
    color: var(--text);
}

.error-msg {
    color: red;
    font-size: 14px;
    margin-top: 10px;
}

.resumen-con-tiempo {
    background: var(--bg);
    padding: 20px;
    border-radius: 10px;
    color: var(--text);
}

.resumen-con-tiempo ul {
    margin-bottom: 20px;
}

.resumen-realtime-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    background: var(--bg);
    padding: 20px;
    border-radius: 10px;
    color: var(--text);
}

.resumen-box,
.realtime-box {
    background: var(--bg);
    border: 1px solid var(--border);
    padding: 1rem;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

.resumen-box h4,
.realtime-box h4 {
    font-size: 18px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.resumen-box ul,
.realtime-box ul {
    padding-left: 0;
    list-style: none;
}

.resumen-box li,
.realtime-box li {
    font-size: 14px;
}

.realtime-box strong {
    color: var(--primary);
}
</style>