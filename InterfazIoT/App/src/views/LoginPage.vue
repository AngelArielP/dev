<template>
  <div class="login-container">
    <h1 class="login-title">Plataforma IoT WOW</h1>

    <!-- Formulario de login -->
    <form @submit.prevent="handleLogin" class="login-form">
      <div class="header-title">
        <h2>Iniciar Sesión</h2>
      </div>
      <div class="input-group">
        <label for="username">Usuario:</label>
        <input type="text" v-model="username" id="username" required placeholder="Ingresa tu usuario" />
      </div>

      <div class="input-group">
        <label for="password">Contraseña:</label>
        <input type="password" v-model="password" id="password" required placeholder="Ingresa tu contraseña" />
      </div>

      <div class="button-row">
        <button type="submit" class="login-button" :disabled="isLoggingIn">Ingresar</button>
        <button @click="loginAsGuest" class="guest-button">Invitado</button>
      </div>

      <!-- Mensaje de error o éxito -->
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>

    <!-- Simulación de un proceso de login -->
    <div v-if="isLoggingIn" class="loading">Cargando...</div>


  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      isLoggingIn: false
    };
  },
  methods: {
    // Método para manejar login con usuario y contraseña
    handleLogin() {
      if (this.username && this.password) {
        this.isLoggingIn = true;
        this.errorMessage = '';

        setTimeout(() => {
          if (this.username === 'admin' && this.password === 'adminpass') {
            localStorage.setItem('user', JSON.stringify({ role: 'admin', username: this.username }));
            alert('Sesión iniciada como Admin');
            this.$router.push('/');
          } else if (this.username === 'user' && this.password === 'userpass') {
            localStorage.setItem('user', JSON.stringify({ role: 'user', username: this.username }));
            alert('Sesión iniciada como Usuario');
            this.$router.push('/api/realtime');
          } else {
            this.errorMessage = 'Credenciales incorrectas. Intenta de nuevo.';
          }
          this.isLoggingIn = false;
        }, 1000);
      } else {
        this.errorMessage = 'Por favor, ingresa un usuario y una contraseña válidos.';
      }
    },
    // Método para login como invitado (opcional)

    loginAsGuest() {
      localStorage.setItem('user', JSON.stringify({ role: 'guest', username: 'guest' }));
      this.$router.push('/api/realtime');
    }
  }
};
</script>

<style scoped>
.button-row {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}

.login-button,
.guest-button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}
.header-title {
  text-align: center;
  margin-bottom: 1.5rem;
}

.header-title h2 {
  color: rgba(0, 0, 0, 0.753);
  font-size: 1.5rem;
  font-weight: bold;
}

</style>
