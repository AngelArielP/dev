<template>
  <div class="header-controls">
    <!-- Selector de vista -->
    <div class="control-group">
      <label for="vista">👁️ Vista:</label>
      <select v-model="localSelectedView" id="vista">
        <option v-for="opt in filterOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Checkbox Mostrar OEE -->
    <div class="control-group">
      <label>
        <input type="checkbox" v-model="localMostrarOeeGlobal" />
        Mostrar OEE
      </label>
    </div>

    <!-- Selector de intervalo -->
    <div class="control-group">
      <label for="updateRate">⏱️ Actualización:</label>
      <select v-model="localUpdateInterval" id="updateRate">
        <option v-for="opt in intervalOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Selector de máquina -->
    <div class="control-group" v-if="['maquinas', 'slider-individual'].includes(localSelectedView)">
      <label for="machineSelect">🏭 Máquina:</label>
      <select v-model="localSelectedMachine" id="machineSelect">
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
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  selectedView: String,
  mostrarOeeGlobal: Boolean,
  updateInterval: [String, Number],
  selectedMachine: String,
  filterOptions: Array,
  intervalOptions: Array,
  machineOptions: Array,
  totalTags: Number,
  totalPoints: Number,
  fechaActual: String
});

const emit = defineEmits([
  'update:selectedView',
  'update:mostrarOeeGlobal',
  'update:updateInterval',
  'update:selectedMachine'
]);

const localSelectedView = ref(props.selectedView);
const localMostrarOeeGlobal = ref(props.mostrarOeeGlobal);
const localUpdateInterval = ref(props.updateInterval);
const localSelectedMachine = ref(props.selectedMachine);

watch(localSelectedView, val => emit('update:selectedView', val));
watch(localMostrarOeeGlobal, val => emit('update:mostrarOeeGlobal', val));
watch(localUpdateInterval, val => emit('update:updateInterval', val));
watch(localSelectedMachine, val => emit('update:selectedMachine', val));
</script>

<style scoped>
.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 20px;
  background: #121212;
  border: 1px solid #333;
  border-radius: 10px;
  color: #ccc;
}

.header-controls label {
  font-weight: 600;
  color: #ccc;
}

.header-controls select {
  padding: 6px 8px;
  border-radius: 6px;
  background-color: #202020;
  color: white;
  border: 1px solid #444;
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
}
</style>
