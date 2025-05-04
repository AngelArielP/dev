import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4100/api/ciclosplanta1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000
});

// Obtener todos los ciclos
export const getCiclos = () => api.get('/');

// Buscar ciclos con filtros (maquina, fecha, turno...)
export const searchCiclos = (params) => api.get('/search', { params });

// Obtener el último ciclo de una máquina
export const getUltimoCicloPorMaquina = (maquina) =>
  api.get('/ultimo', { params: { maquina } });

// Actualizar un ciclo por ID
export const updateCiclo = (id, data) => api.put(`/actualizar/${id}`, data);

// Crear nuevo ciclo (si tienes esta función implementada)
export const createCiclo = (data) => api.post('/insertar', data);
