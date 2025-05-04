<template>
  <div class="container py-4">
    <div class="text-center mb-4">
      <h2>
        <i class="bi bi-search"></i> Buscar Ciclos de Planta 1
      </h2>
    </div>

    <!-- Formulario de filtros -->
    <div class="card p-3 mb-4 bg-body-tertiary">
      <form class="row g-3 align-items-end">
        <!-- filtros aquí -->
        <form @submit.prevent="buscarCiclos" class="row g-3 align-items-end">
          <div class="col-md-2">
            <label class="form-label">Máquina</label>
            <input v-model="filtros.maquina" type="text" class="form-control" placeholder="Ej: HuskyF" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Desde</label>
            <input v-model="filtros.fechaCreacion" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Hasta</label>
            <input v-model="filtros.tiempoFinal" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Turno</label>
            <select v-model="filtros.turno" class="form-select">
              <option disabled value="">Turno</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div class="col-md-2 d-flex gap-2">
            <button class="btn btn-primary w-100" type="submit">
              <i class="bi bi-funnel me-1"></i> Buscar
            </button>
            <button class="btn btn-info w-100" type="button" @click="buscarUltimoCiclo">
              <i class="bi bi-clock-history me-1"></i> Último
            </button>
          </div>

        </form>
      </form>
    </div>



    <!-- Tabla de resultados -->
    <div class="table-responsive mt-4">
      <table class="table table-hover table-striped table-bordered align-middle text-center">
        <thead class="table-primary">
          <tr>
            <th>Máquina</th>
            <th>Turno</th>
            <th>Fecha Inicio</th>
            <th>Fecha Final</th>
            <th>Contador</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="turno in resultados[0]?.turnos" :key="turno._id">
            <td>{{ resultados[0].maquina }}</td>
            <td>{{ turno.turno }}</td>
            <td>{{ formatDate(turno.fechacicloinicial) }}</td>
            <td>{{ formatDate(turno.fechaciclofinal) }}</td>
            <td><span class="badge bg-dark">{{ turno.contadorCiclos }}</span></td>
          </tr>
        </tbody>
        <tfoot class="table-secondary">
          <tr>
            <td colspan="4" class="text-end fw-bold">Total Ciclos</td>
            <td class="fw-bold">{{ resultados[0]?.cicloTotal }}</td>
          </tr>
        </tfoot>
      </table>

    </div>


    <div v-if="resultados.length > 0" class="mt-5">
            <div class="card p-3 mb-4 bg-body-tertiary">
<div class="mb-3 d-flex align-items-center gap-2">
        <label class="form-label mb-0">Visualización:</label>
        <select v-model="tipoVisualizacion" class="form-select w-auto">
          <option value="barras">Barras</option>
          <option value="pastel">Pastel</option>
          <option value="tiempo">Duración</option>
        </select>
      </div>
        <ChartBarras v-if="tipoVisualizacion === 'barras'" :turnos="resultados[0].turnos" />
        <ChartPastel v-if="tipoVisualizacion === 'pastel'" :turnos="resultados[0].turnos" />
        <ChartTiempo v-if="tipoVisualizacion === 'tiempo'" :turnos="resultados[0].turnos" />
      </div>


    </div>

  </div>
</template>


<script setup>
import { ref } from 'vue';
import {
  searchCiclos,
  getUltimoCicloPorMaquina
} from '@/services/ApiDataService.js';
import ChartBarras from './cicloscomponents/ChartBarras.vue'
import ChartPastel from './cicloscomponents/ChartPastel.vue'
import ChartTiempo from './cicloscomponents/ChartTiempo.vue'

const tipoVisualizacion = ref('barras');

const filtros = ref({
  maquina: '',
  fechaCreacion: '',
  tiempoFinal: '',
  turno: ''
});

const resultados = ref([]);

const buscarCiclos = async () => {
  try {
    const { data } = await searchCiclos(filtros.value);
    resultados.value = data;
  } catch (error) {
    console.error('Error buscando ciclos:', error);
  }
};

const buscarUltimoCiclo = async () => {
  try {
    if (!filtros.value.maquina) return alert('Debes ingresar una máquina');
    const { data } = await getUltimoCicloPorMaquina(filtros.value.maquina);
    console.log(data)
    resultados.value = [data];
  } catch (error) {
    console.error('Error al obtener el último ciclo:', error);
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d) ? 'Fecha inválida' : d.toLocaleString('es-MX');
};

</script>

<style scoped>
.card:hover {
  transform: none !important;
  transition: none !important;
  box-shadow: none !important;
  /* Opcional: también elimina sombra si hay */
}
</style>
