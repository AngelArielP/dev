<template>
    <apexchart  width="100%" 
    height="300"  type="bar" :options="options" :series="series" />
  </template>
  
  <script setup>
  import { computed } from 'vue';
  const props = defineProps({ turnos: Array });
  
  const series = computed(() => [{
    name: 'Ciclos',
    data: props.turnos.map(t => t.contadorCiclos)
  }]);
  
  const options = computed(() => ({
    chart: {
      id: 'bar-chart',
      toolbar: { show: false }
    },
    xaxis: {
      categories: props.turnos.map(t => t.turno),
      title: { text: 'Turnos' }
    },
    yaxis: {
      title: { text: 'Cantidad de ciclos' }
    },
    legend: {
      show: true,
      position: 'top'
    },
    dataLabels: {
      enabled: true,
      formatter: val => `${val}`
    },
    tooltip: {
      y: {
        formatter: val => `${val} ciclos`
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        distributed: true // asigna color distinto a cada barra
      }
    }
  }));
  </script>
  