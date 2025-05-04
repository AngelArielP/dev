<template>
    <div v-if="show" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h2>Máquina {{ selectedIndex }}: {{ collectionName }}</h2>
        <p>{{ formattedDate }}</p>
        
        <WsComponent v-if="selectedIndex !== null" :message="generateMessage(selectedIndex)" :index="selectedIndex" />
        <button class="close-button" @click="closeModal">X</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import WsComponent from '/WsComponent.vue';
  
  // Props que se pasarán desde el componente principal
  const props = defineProps({
    show: Boolean,
    selectedIndex: Number,
    collectionName: String,
    formattedDate: String,
    generateMessage: Function,
    closeModal: Function,
  });
  
  // No es necesario crear funciones para el modal ya que se manejan en el componente principal.
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    width: 90%;
    height: 90%;
    max-width: 800px;
    max-height: 800px;
    text-align: center;
    position: relative;
  }
  
  .modal-content h2 {
    color: black;
  }
  
  .modal-content p {
    color: black;
  }
  
  .close-button {
    position: absolute;
    top: 5px;
    right: 5px;
    padding: 8px 12px;
    background-color: #ff4d4d;
    color: white;
    font-size: 14px;
    cursor: pointer;
  }
  
  .close-button:hover {
    background-color: #d43f3f;
  }
  </style>
  