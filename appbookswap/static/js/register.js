document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('email').value.trim();
    const numero = document.getElementById('numero').value.trim();
    const fecha = document.getElementById('fecha_nacimiento').value.trim();
    const preferencias = document.getElementById('preferencias').value.trim();
    const ubicacion = document.getElementById('ubicacion').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const messageBox = document.getElementById('message');
    messageBox.className = 'message';

    // Validar contraseñas
    if (password !== confirmPassword) {
        messageBox.textContent = 'Las contraseñas no coinciden.';
        messageBox.classList.add('error');
        return;
    }

    // Validar fecha de nacimiento no sea en el futuro
    if (fecha) {
        const fechaNacimiento = new Date(fecha);
        const hoy = new Date();
        if (fechaNacimiento > hoy) {
            messageBox.textContent = 'La fecha de nacimiento no puede ser en el futuro.';
            messageBox.classList.add('error');
            return;
        }
    }

    try {
        const response = await fetch('/api/registro/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                nombre,
                correo,
                numero,
                fecha_nacimiento: fecha,
                preferencias,
                ubicacion,
                password
            })
        });

        if (!response.ok) {
            throw new Error('Respuesta inválida del servidor');
        }

        const data = await response.json();

        if (data.success) {
            messageBox.textContent = data.mensaje;
            messageBox.classList.add('success');
            document.getElementById('registerForm').reset();
        } else {
            messageBox.textContent = data.mensaje || 'Error al registrar usuario.';
            messageBox.classList.add('error');
        }

    } catch (error) {
        console.error(error);
        messageBox.textContent = 'Error inesperado. Intenta de nuevo.';
        messageBox.classList.add('error');
    }
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
