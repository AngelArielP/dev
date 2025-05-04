import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '@/views/HomePage.vue';
import AboutPage from '@/views/AboutPage.vue';
import ApiPage from '@/views/TestView/ApiPage.vue';
import MqttPage from '@/views/TestView/MqttPage.vue';
import CiclosPage from '@/views/TestView/CiclosPage.vue';
import RealtimePage from '@/views/TestView/RealtimePage.vue';
import LoginPage from '@/views/LoginPage.vue';

// Definir roles requeridos para ciertas rutas
const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage }, // 🔹 Página de login
  { path: '/about', component: AboutPage },
  { path: '/api', component: ApiPage, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/mqtt', component: MqttPage, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/api/ciclos', component: CiclosPage, meta: { requiresAuth: true, role: 'admin' } },
  { path: '/api/realtime', component: RealtimePage, meta: { requiresAuth: true, role: ['admin', 'user', 'guest'] } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Middleware para proteger rutas
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user')); // Obtener usuario desde localStorage
  console.log(user);

  // Si la ruta requiere autenticación
  if (to.meta.requiresAuth) {
    if (!user) {
      alert('Debes iniciar sesión para acceder a esta página');
      return next('/login');  // Redirige al login si no está autenticado
    }

    // Verifica si el rol del usuario está en la lista permitida para la ruta
    if (to.meta.role && !to.meta.role.includes(user.role)) {
      alert('No tienes permisos para acceder a esta página');
      return next('/login');  // Redirige al login si el rol no es permitido
    }
  }

  // Si ya está autenticado y está en la página de login, recarga la página
  if (to.path === '/login' && user) {
    next('/');
  } else {
    next(); // Continuar con la navegación
  }
});

export default router;
