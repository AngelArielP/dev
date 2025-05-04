<template>

  <div class="header">
    <p class="tag">{{ message?.maquina || 'Maquinaria WM' }}</p>
    <p class="date">{{ message?.fecha || 'N/A' }}</p>
  </div>

</template>

<script setup>
import { ref, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  message: Object,
  index: Number
})

const isInitialLoad = ref(true)
const eventosdata = ref([])

watch(() => props.message, (msg) => {
  if (!msg) return
  console.log('🧪 [WM] Mensaje recibido:', msg)
  isInitialLoad.value = false
}, { immediate: true })
</script>

<style scoped>
.info-box {
  border-radius: 10px;
  padding: 1rem;
  background: #e9f5ff;
  color: #003366;
  box-shadow: 0 2px 6px rgba(0, 123, 255, 0.1);
  font-family: 'Segoe UI', sans-serif;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.icon {
  color: #007bff;
  font-size: 1.2rem;
}

.title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.info-body p {
  margin: 0.25rem 0;
  font-size: 0.95rem;
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
</style>
