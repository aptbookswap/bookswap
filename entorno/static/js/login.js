// auth.js

const formularioLogin = document.getElementById('loginForm');
const enlaceRegistro = document.getElementById('registerLink');
const enlaceRecuperarClave = document.getElementById('forgotPasswordLink');
const botonGoogle = document.getElementById('googleLogin');
const contenedorMensaje = document.getElementById('message');

let cargando = false;

// Iniciar sesión con correo y contraseña
formularioLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (cargando) return;

    const correo = document.getElementById('email').value.trim();
    const clave = document.getElementById('password').value.trim();

    if (!correo || !clave) {
        mostrarMensaje('Por favor completa todos los campos', 'error');
        return;
    }

    cargando = true;
    const boton = formularioLogin.querySelector('button[type="submit"]');
    boton.disabled = true;
    boton.textContent = 'Iniciando sesión...';

    try {
        // Aquí deberías hacer la llamada a tu backend
        // const respuesta = await fetch('/api/login', {...});
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación

        mostrarMensaje('Inicio de sesión exitoso. Redirigiendo...', 'success');
        setTimeout(() => window.location.href = 'home.html', 2000);
    } catch (error) {
        manejarErrorAutenticacion(error);
    } finally {
        cargando = false;
        boton.disabled = false;
        boton.textContent = 'Iniciar Sesión';
    }
});

// Inicio con Google simulado
botonGoogle.addEventListener('click', async (e) => {
    e.preventDefault();
    if (cargando) return;

    cargando = true;
    botonGoogle.disabled = true;
    botonGoogle.innerHTML = '<div class="loading-spinner"></div> Continuando con Google...';

    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación

        mostrarMensaje('Inicio de sesión con Google exitoso. Redirigiendo...', 'success');
        setTimeout(() => window.location.href = 'home.html', 2000);
    } catch (error) {
        manejarErrorAutenticacion(error);
    } finally {
        cargando = false;
        botonGoogle.disabled = false;
        botonGoogle.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Logo Google"> Continuar con Google';
    }
});

// Redireccionar al registro
enlaceRegistro.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'register.html';
});

// Recuperar contraseña (simulado)
enlaceRecuperarClave.addEventListener('click', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('email').value.trim();

    if (!correo) {
        mostrarMensaje('Por favor ingresa tu correo electrónico primero', 'error');
        return;
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulación
        mostrarMensaje('Te enviamos un correo para restablecer tu contraseña.', 'success');
    } catch (error) {
        manejarErrorAutenticacion(error);
    }
});
