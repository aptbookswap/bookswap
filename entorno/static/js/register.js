// Elementos del DOM
const registerForm = document.getElementById('registerForm');
const googleRegisterBtn = document.getElementById('googleRegister');
const messageDiv = document.getElementById('message');
let isLoading = false;

// Manejar registro con email y contraseña
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isLoading) return;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones
    if (!email || !password || !confirmPassword) {
        mostrarMensaje('Por favor completa todos los campos', 'error');
        return;
    }

    if (password !== confirmPassword) {
        mostrarMensaje('Las contraseñas no coinciden', 'error');
        return;
    }

    if (password.length < 6) {
        mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    isLoading = true;
    const submitButton = registerForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Registrando...';

    try {
        const response = await fetch('/api/registro/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': obtenerCSRFToken()
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.mensaje || 'Error en el registro');
        }

        mostrarMensaje(data.mensaje || 'Registro exitoso. Revisa tu correo.', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);

    } catch (error) {
        manejarErrorAutenticacion(error.message);
    } finally {
        isLoading = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Registrarse';
    }
});

// Manejar registro con Google (simulado)
googleRegisterBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    if (isLoading) return;

    isLoading = true;
    googleRegisterBtn.disabled = true;
    googleRegisterBtn.innerHTML = '<div class="loading-spinner"></div> Continuando con Google...';

    try {
        // Simulación (Django no lo usa por defecto)
        await new Promise((resolve) => setTimeout(resolve, 1000));
        mostrarMensaje('Registro con Google exitoso. Redirigiendo...', 'success');

        setTimeout(() => {
            window.location.href = 'home.html';
        }, 2000);
    } catch (error) {
        manejarErrorAutenticacion(error);
    } finally {
        isLoading = false;
        googleRegisterBtn.disabled = false;
        googleRegisterBtn.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google logo"> Continuar con Google';
    }
});

// Obtener token CSRF desde cookies
function obtenerCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const c = cookie.trim();
        if (c.startsWith(name + '=')) {
            return c.substring(name.length + 1);
        }
    }
    return '';
}
