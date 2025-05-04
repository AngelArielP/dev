<template>
    <apexchart  width="100%" 
    height="300"  type="donut" :options="options" :series="series" />
  </template>
  
  <script setup>
  import { computed } from 'vue';
  const props = defineProps({ turnos: Array });
  
  const series = computed(() => props.turnos.map(t => t.contadorCiclos));
  const options = computed(() => ({
    labels: props.turnos.map(t => t.turno)
  }));
  </script>
  