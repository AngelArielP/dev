<!-- src/views/Test/View/ApiPage.vue -->
<template>
    <div>
      <h1>API Test</h1>
      <p>Introduce la URL, el puerto y el endpoint para hacer la consulta.</p>
  
      <!-- Selección de URL, Puerto y Endpoint -->
      <label>URL Base:</label>
      <select v-model="selectedUrl">
        <option v-for="url in urls" :key="url" :value="url">{{ url }}</option>
      </select>
  
      <label>Puerto:</label>
      <select v-model="selectedPort">
        <option v-for="port in ports" :key="port" :value="port">{{ port }}</option>
      </select>
  
      <label>Endpoint:</label>
      <select v-model="selectedEndpoint">
        <option v-for="endpoint in endpoints" :key="endpoint" :value="endpoint">{{ endpoint }}</option>
      </select>
      <label>Parámetros:</label>
<input v-model="queryParams" placeholder="Ej: ?id=123&activo=true" />

  
      <button @click="fetchData">Consultar API</button>
  
      <!-- Mostrar resultados -->
      <pre v-if="data" class="black-text">{{ JSON.stringify(data, null, 2) }}</pre>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </template>
  
  <script setup>

import { ref } from "vue";
import axios from "axios";

const urls = ref(["http://91.134.75.7"]);
const ports = ref(["4100", "4200"]);
const endpoints = ref(["/api/ciclosplanta1/ultimo", "/api/productos"]);

const selectedUrl = ref(urls.value[0]);
const selectedPort = ref(ports.value[0]);
const selectedEndpoint = ref(endpoints.value[0]);
const queryParams = ref(""); // 🔹 Nuevo

const data = ref(null);
const error = ref(null);

const fetchData = async () => {
  data.value = null;
  error.value = null;

  const fullUrl = `${selectedUrl.value}:${selectedPort.value}${selectedEndpoint.value}${queryParams.value}`;

  try {
    const response = await axios.get(fullUrl);
    data.value = response.data;
  } catch (err) {
    error.value = "Error al obtener los datos.";
  }
};
  </script>
  
  <style scoped>
  .error {
    color: red;
    font-weight: bold;
  }
  select, button {
    display: block;
    margin: 10px 0;
    padding: 5px;
  }
  button {
    background: #007bff;
    color: white;
    border: none;
    cursor: pointer;
  }
  button:hover {
    background: #0056b3;
  }
  pre {
    background: #f4f4f4;
    padding: 10px;
    border-radius: 5px;
    overflow-x: auto;
  }
  .black-text {
  color: black;
  background: #f4f4f4;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}
  </style>
  