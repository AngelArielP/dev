<template>
    <aside :class="['sidebar', { collapsed: isCollapsed }]">
      <div class="sidebar-header">
        <button class="toggle-button" @click="toggleSidebar">☰</button>
        <h2 v-if="!isCollapsed">IOT WOW</h2>
      </div>
  
      <ul class="nav">
        <li>
          <router-link to="/">
            <span class="icon">🏠</span>
            <span v-if="!isCollapsed" class="text">Inicio</span>
          </router-link>
        </li>
  
        <li v-if="user?.role === 'admin'">
          <router-link to="/api">
            <span class="icon">📡</span>
            <span v-if="!isCollapsed" class="text">ApiTest</span>
          </router-link>
        </li>
  
        <li v-if="user?.role === 'admin'">
          <router-link to="/mqtt">
            <span class="icon">📶</span>
            <span v-if="!isCollapsed" class="text">MqttTest</span>
          </router-link>
        </li>
  
        <li v-if="user?.role === 'admin'">
          <router-link to="/api/ciclos">
            <span class="icon">♻️</span>
            <span v-if="!isCollapsed" class="text">Ciclos</span>
          </router-link>
        </li>
  
        <li v-if="['admin', 'user', 'guest'].includes(user?.role)">
          <router-link to="/api/realtime">
            <span class="icon">📊</span>
            <span v-if="!isCollapsed" class="text">Realtime</span>
          </router-link>
        </li>
  
        <li v-if="!user">
          <router-link to="/login">
            <span class="icon">🔐</span>
            <span v-if="!isCollapsed" class="text">Login</span>
          </router-link>
        </li>
  
        <li v-else>
          <button @click="logout">
            <span class="icon">🚪</span>
            <span v-if="!isCollapsed" class="text">Salir</span>
          </button>
        </li>
      </ul>
    </aside>
  </template>
  
  <script setup>
  import { ref, provide, onMounted } from 'vue';
  
  const isCollapsed = ref(false);
  provide('isSidebarCollapsed', isCollapsed);
  
  const user = ref(null);
  onMounted(() => {
    user.value = JSON.parse(localStorage.getItem('user'));
  });
  
  const logout = () => {
    localStorage.removeItem('user');
    user.value = null;
    window.location.href = '/login';
  };
  
  const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value;
  };
  </script>
  
  
  <style scoped>
  .sidebar {
    width: 150px;
    height: 100vh;
    background-color: #1f2a38;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
    transition: width 0.3s;
  }
  
  .sidebar.collapsed {
    width: 70px;
  }
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
    margin-bottom: 2rem;
  }
  
  .toggle-button {
    background: none;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    margin-right: 0.5rem;
  }
  
  .nav {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .nav li {
    margin-bottom: 1rem;
  }
  
  .nav a,
  .nav button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: white;
    text-decoration: none;
    background: none;
    border: none;
    font: inherit;
    padding: 0.75rem 1.5rem;
    width: 100%;
    text-align: left;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .nav a:hover,
  .nav button:hover {
    background-color: #00c2ff22;
    color: #00c2ff;
  }
  
  .icon {
    width: 24px;
    display: inline-block;
    text-align: center;
  }
  
  .text {
    flex: 1;
    white-space: nowrap;
  }
  </style>
  