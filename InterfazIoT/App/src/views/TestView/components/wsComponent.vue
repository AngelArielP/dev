<template>

    <div>
      
      <apexchart :options="chartOptions" :series="chartSeries" type="line" height="100"></apexchart>
  
    </div>
  </template>
  
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import ApexCharts from 'vue3-apexcharts';
  
  
  // Definir los props que el componente recibe
  const props = defineProps({
    message: {
      type: Object,
      required: true,
    },
    generateMessage: {
      type: Function,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  });
  // Estado para manejar la visibilidad del modal
  const isModalVisible = ref(false);
  
  const modalMessage = ref(null);  // Crear una propiedad local para los detalles del mensaje
  
  const openModal = () => {
    modalMessage.value = { ...props.message };  // Guardar una copia de los datos actuales
    isModalVisible.value = true;
    setTimeout(() => {
      document.querySelector('.modal-overlay').classList.add('show');
    }, 0);
  };
  
  // Definir las referencias y opciones del gráfico
  const chartSeries = ref([{
    data: [] // Empezamos con los datos vacíos
  }]);
  
  
  const chartOptions = ref({
  chart: {
    id: 'realtime',
    height: 450,
    type: 'line',
    animations: {
      enabled: false,
      easing: 'linear',
      dynamicAnimation: { speed: 1000 }
    },
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  stroke: {
    curve: 'stepline', // Para cambios bruscos entre 0 y 1
    width: 2,
  },
  title: { text: '', align: 'left' },
  markers: { size: 3 },
  xaxis: {
    type: 'datetime',
    range: 500000, // Ajusta el rango de tiempo visible
  },
  yaxis: {
    min: 0,
    max: 1,
    tickAmount: 2, // Solo debe mostrar 0 y 1
    forceNiceScale: true, // Evita valores intermedios
    labels: {
      formatter: (value) => (value === 0 ? '0' : '1'), // Asegura que solo muestre 0 y 1
    },
  },
  legend: { show: false },
  grid: {
    row: {
      colors: ['#f3f3f3', 'transparent'],
      opacity: 0.5,
    },
  },
});

  const data = ref([]);  // Datos para el gráfico
  let ws = null;
  let intervalId = null;
  
  // Función para obtener la fecha en formato "YYYY-MM-DD" ajustada a la zona horaria de México
  const getMexicoDate = () => {
    const mexicoDate = new Date().toLocaleDateString("en-GB", { timeZone: "America/Mexico_City" });
    const [day, month, year] = mexicoDate.split('/');  // DD/MM/YYYY
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  
  // Función para actualizar el gráfico con datos nuevos
  const updateChartData = (newData) => {
    const formattedData = newData.map(item => ({
      x: new Date(item.timestamp).getTime(),  // Convertir el timestamp a milisegundos
      y: parseFloat(item.value), // Convertir el valor a número
    }));
  
    // Limitar el número de puntos de datos en el gráfico (por ejemplo, máximo 100 puntos)
    const maxDataPoints = 100;
    data.value.push(...formattedData);
    if (data.value.length > maxDataPoints) {
      data.value.splice(0, data.value.length - maxDataPoints); // Elimina los datos más antiguos
    }
  
    // Actualizar el gráfico
    chartSeries.value = [{ data: [...data.value] }];
  };
  
  // Función para enviar la solicitud para obtener datos
  const sendFetchRequest = () => {
    const formattedDate = getMexicoDate(); // Obtener la fecha actual en formato yyyy-mm-dd
    const message = {
        type: 'fetchDocuments',
        maquina: props.message.collection,
        tag: props.message.tag,
        fecha: formattedDate, // Aquí usamos la fecha dinámica
    };
    ws.send(JSON.stringify(message)); // Enviar el mensaje
};

  
  // Conectar al WebSocket y enviar solicitud cada 5 segundos
  const connectWebSocket = () => {
    ws = new WebSocket('ws://91.134.75.7:4200'); // URL del servidor WebSocket
  
    ws.onopen = () => {
      sendFetchRequest(); // Enviar la primera solicitud al conectar
  
      // Enviar una solicitud cada 5 segundos
      intervalId = setInterval(() => {
        sendFetchRequest();
      }, 5000); // 5000 ms = 5 segundos
    };
  
    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
  console.log(response)
      if (response.data) {
        updateChartData(response.data); // Actualizar el gráfico con los datos
      }
    };
  
    ws.onerror = (error) => {
      console.error('Error en WebSocket:', error);
    };
  
    ws.onclose = () => {
      clearInterval(intervalId); // Detener las solicitudes periódicas
    };
  };
  
  // Conectar al WebSocket cuando el componente se monta
  onMounted(() => {
    connectWebSocket();
  });
  
  // Limpiar la conexión WebSocket cuando el componente se destruya
  onBeforeUnmount(() => {
    clearInterval(intervalId); // Detener las solicitudes periódicas
  });
  </script>
  
  <style scoped>
  /* Estilo del contenedor principal */
  .message-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    margin: 20px auto;
  }
  
  /* Overlay que cubre toda la pantalla y oscurece el fondo
  .modal-overlay {
    position: fixed;  
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);  
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; 
    animation: fadeIn 0.3s ease-out; 
  }
  */
  /* Animación para la aparición del modal */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
  
    to {
      opacity: 1;
    }
  }
  
  /* Estilo del contenido del modal */
  .modal-content {
    background-color: rgb(3, 3, 3);
    padding: 20px;
    border-radius: 10px;
    width: 400px;
    /* Puedes ajustar el tamaño del modal */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    text-align: center;
    /* Centra el contenido dentro del modal */
    animation: scaleUp 0.3s ease-out;
  
  }
  
  .modal-title {
    display: flex;
    /* Usar flexbox */
    flex-direction: row;
    /* Organizar los elementos en fila */
    align-items: center;
    /* Alinear los elementos verticalmente al centro */
    justify-content: center;
    /* Centrar todo el contenido */
    gap: 10px;
    /* Espacio entre los elementos */
  }
  
  .modal-content h3,
  .modal-content p {
    margin: 0;
    /* Eliminar márgenes por defecto */
    padding: 0;
    /* Eliminar padding si es necesario */
  }
  
  .modal-content p {
    display: inline-block;
    /* Permite que el párrafo se comporte como un bloque en línea */
    margin-left: 5px;
    /* Opcional: un pequeño margen entre el tag y el contenido */
  }
  
  /* Animación para el efecto de escala del modal */
  @keyframes scaleUp {
    from {
      transform: scale(0.9);
    }
  
    to {
      transform: scale(1);
    }
  }
  
  /* Botón de cerrar con estilo */
  button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    border-radius: 5px;
    font-size: 1rem;
  }
  
  button:hover {
    background-color: #0056b3;
  }
  </style>