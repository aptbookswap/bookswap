// Manejador de envío del formulario de registro
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Obtener valores del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('email').value.trim();
    const numero = document.getElementById('numero').value.trim();
    const fecha = document.getElementById('fecha_nacimiento').value.trim();
    const preferencias = document.getElementById('preferenciasInput').value.trim();
    const ubicacion = document.getElementById('ubicacion').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const messageBox = document.getElementById('message');
    messageBox.className = 'message';

    // Validación de contraseñas
    if (password !== confirmPassword) {
        messageBox.textContent = 'Las contraseñas no coinciden.';
        messageBox.classList.add('error');
        return;
    }

    // Validación de fecha futura
    if (fecha) {
        const fechaNacimiento = new Date(fecha);
        const hoy = new Date();
        if (fechaNacimiento > hoy) {
            messageBox.textContent = 'La fecha de nacimiento no puede ser en el futuro.';
            messageBox.classList.add('error');
            return;
        }
    }

    // Validar que se haya seleccionado al menos una preferencia
    if (!preferencias) {
        messageBox.textContent = 'Selecciona al menos una preferencia.';
        messageBox.classList.add('error');
        return;
    }

    // Enviar datos al backend
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

        // Si el registro fue exitoso
        if (data.success) {
            messageBox.textContent = data.mensaje;
            messageBox.classList.add('success');
            document.getElementById('registerForm').reset();

            // Limpiar etiquetas seleccionadas visualmente
            document.querySelectorAll('.chip.selected').forEach(c => c.classList.remove('selected'));
            document.getElementById('preferenciasInput').value = '';
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

document.addEventListener('DOMContentLoaded', function () {
    const dropdown = document.getElementById('preferenciasDropdown');
    const tagsContainer = document.getElementById('preferenciasTags');
    const inputHidden = document.getElementById('preferenciasInput');
    let selectedValues = [];

    dropdown.addEventListener('change', function () {
        const selected = dropdown.value;
        if (selected && !selectedValues.includes(selected)) {
            selectedValues.push(selected);
            updateTags();
        }
        dropdown.value = ''; // Reinicia selección
    });

    function updateTags() {
        tagsContainer.innerHTML = '';
        selectedValues.forEach(value => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `${value} <span class="remove-tag" data-value="${value}">&times;</span>`;
            tagsContainer.appendChild(tag);
        });
        inputHidden.value = selectedValues.join(',');
    }

    tagsContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-tag')) {
            const value = e.target.getAttribute('data-value');
            selectedValues = selectedValues.filter(v => v !== value);
            updateTags();
        }
    });
});

// Función para obtener el token CSRF desde las cookies
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
