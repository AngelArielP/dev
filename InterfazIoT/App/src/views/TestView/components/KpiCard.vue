<template>
  <div class="kpi-line">

    <div class="kpi-card">
      <div class="kpi-content">
        <div>
          <div class="kpi-title">{{ title }}</div>
        <div class="kpi-value">
        </div>
          {{ value }}
        </div>
      </div>
      <apexchart v-if="sparklineData && sparklineData.length" class="sparkline" :colorClass type="area" height="50"
        :options="sparklineOptions" :series="[{ data: sparklineData }]" />
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import ApexCharts from 'vue3-apexcharts'

defineProps({
  title: String,
  value: [String, Number],
  unit: String,
  color: {
    type: String,
    default: 'blue',
  },
  sparklineData: {
    type: Array,
    default: () => []
  }
})

const sparklineOptions = {
  chart: {
    type: 'area',
    sparkline: { enabled: true },
  },
  stroke: {
    curve: 'smooth',
    width: 2
  },
  tooltip: { enabled: false },
  colors: ['#198754'], fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.5,
      opacityFrom: 0.6,
      opacityTo: 0.05,
    },
  },
  xaxis: { labels: { show: false }, axisTicks: { show: false }, axisBorder: { show: false } },
  yaxis: { show: false },
}

const colorClass = computed(() => `kpi-blue`)
</script>

<style scoped>
.kpi-card {
  padding: 12px 16px;
  border-radius: 12px;
  color: rgb(12, 4, 4);
  background-color: #19875433;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.kpi-content {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.kpi-title {
  font-size: 14px;
  font-weight: 500;
}

.kpi-value {
  font-size: 20px;
  font-weight: bold;
}

.kpi-unit {
  font-size: 12px;
  margin-left: 4px;
}

.sparkline {
  margin-top: 8px;
}

.kpi-blue {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.kpi-green {
  background: linear-gradient(135deg, #1abc9c, #16a085);
}

.kpi-line {
  width: 6px;
}
</style>
