<template>
  <apexchart
    width="100%"
    height="300"
    type="bar"
    :options="options"
    :series="series"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ turnos: Array });

function calcMinutos(inicio, fin) {
  return (new Date(fin) - new Date(inicio)) / 60000;
}

// 🔢 Redondear duración a 2 decimales
const series = computed(() => [
  {
    name: 'Duración (min)',
    data: props.turnos.map(t =>
      Number(calcMinutos(t.fechacicloinicial, t.fechaciclofinal).toFixed(2))
    )
  }
]);

// ⚙️ Configuración del gráfico con leyenda + etiquetas
const options = computed(() => ({
  chart: {
    id: 'duration-chart',
    toolbar: { show: false }
  },
  xaxis: {
    categories: props.turnos.map(t => t.turno),
    title: { text: 'Turnos' }
  },
  yaxis: {
    title: { text: 'Minutos' }
  },
  legend: {
    show: true,
    position: 'top'
  },
  dataLabels: {
    enabled: true,
    formatter: val => `${val.toFixed(2)} min`
  },
  tooltip: {
    y: {
      formatter: val => `${val.toFixed(2)} min`
    }
  },
  plotOptions: {
    bar: {
      distributed: true, // colores distintos
      borderRadius: 5
    }
  }
}));
</script>
