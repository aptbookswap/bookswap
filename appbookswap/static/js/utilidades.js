// Muestra un mensaje temporal en pantalla
function mostrarMensaje(mensaje, tipo) {
    const contenedorMensaje = document.getElementById('message');
    contenedorMensaje.textContent = mensaje;
    contenedorMensaje.className = 'message ' + tipo;
    contenedorMensaje.style.display = 'block';

    // Animación de aparición y desaparición
    setTimeout(() => contenedorMensaje.style.opacity = '1', 10);
    setTimeout(() => {
        contenedorMensaje.style.opacity = '0';
        setTimeout(() => contenedorMensaje.style.display = 'none', 300);
    }, 5000);
}

// Maneja errores de autenticación
function manejarErrorAutenticacion(error) {
    console.error('Error de autenticación simulado:', error);
    mostrarMensaje('Ocurrió un error. Por favor, inténtalo nuevamente.', 'error');
}

// Maneja la visibilidad de botones según la sesión
document.addEventListener('DOMContentLoaded', function () {
    const sessionData = localStorage.getItem('usuarioActivo');
    const authBtns = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    // Si hay sesión activa, ocultar botones de login y mostrar menú de usuario
    if (sessionData) {
        const data = JSON.parse(sessionData);
        if (authBtns) authBtns.classList.add('d-none');
        if (userMenu) userMenu.classList.remove('d-none');
        if (userEmailDisplay) userEmailDisplay.textContent = data.nombre;
    } else {
        // Si no hay sesión, mostrar botones de login
        if (authBtns) authBtns.classList.remove('d-none');
        if (userMenu) userMenu.classList.add('d-none');
    }

    // Botón para cerrar sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuarioActivo');
            if (authBtns) authBtns.classList.remove('d-none');
            if (userMenu) userMenu.classList.add('d-none');
            window.location.reload();
        });
    }
});
