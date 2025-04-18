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
