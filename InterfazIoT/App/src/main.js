import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.css';
import './assets/main.css';

import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import VueApexCharts from 'vue3-apexcharts';
import { library } from '@fortawesome/fontawesome-svg-core';
import {faCircleInfo, faArrowRight, faRotateRight, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'; // ✅ Consolidado
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

library.add(faCircleInfo, faArrowRight, faRotateRight, faTriangleExclamation);

const app = createApp(App); 

app.use(router);
app.use(VueApexCharts);
app.component('font-awesome-icon', FontAwesomeIcon);
// main.js o App.vue
document.body.classList.add('light-mode'); // o 'dark-mode'

app.mount('#app');
