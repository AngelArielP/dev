<script setup>
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';

const route = useRoute();
</script>

<template>
  <div class="app-container">
    <!-- Mostrar Navbar solo si no estamos en /login -->
    <Navbar v-if="route.path !== '/login'" />

    <!-- Ajustar ancho del contenido si estamos en login -->
    <div :class="['main-content', { full: route.path === '/login' }]">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
}

.main-content {
  margin-left: 90px;
  padding: 2rem;
  width: calc(100% - 200px);
}

.main-content.full {
  margin-left: 0;
  width: 100%;
}
</style>
