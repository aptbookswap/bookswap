// utils.js
function mostrarMensaje(mensaje, tipo) {
    const contenedorMensaje = document.getElementById('message');
    contenedorMensaje.textContent = mensaje;
    contenedorMensaje.className = 'message ' + tipo;
    contenedorMensaje.style.display = 'block';

    setTimeout(() => contenedorMensaje.style.opacity = '1', 10);
    setTimeout(() => {
        contenedorMensaje.style.opacity = '0';
        setTimeout(() => contenedorMensaje.style.display = 'none', 300);
    }, 5000);
}

function manejarErrorAutenticacion(error) {
    console.error('Error de autenticación simulado:', error);
    mostrarMensaje('Ocurrió un error. Por favor, inténtalo nuevamente.', 'error');
}
document.addEventListener('DOMContentLoaded', function () {
    const sessionData = localStorage.getItem('usuarioActivo');
    const authBtns = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    if (sessionData) {
        const data = JSON.parse(sessionData);
        if (authBtns) authBtns.classList.add('d-none');
        if (userMenu) userMenu.classList.remove('d-none');
        if (userEmailDisplay) userEmailDisplay.textContent = data.nombre;
    } else {
        if (authBtns) authBtns.classList.remove('d-none');
        if (userMenu) userMenu.classList.add('d-none');
    }

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
