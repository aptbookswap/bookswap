document.addEventListener('DOMContentLoaded', function () {
    // Crear instancia global de modal
    const loginModalElement = document.getElementById('loginModal');
    const loginModalInstance = new bootstrap.Modal(loginModalElement);

    // Mostrar el modal de login cuando se hace clic en el botón
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            loginModalInstance.show();
        });
    }

    // Manejo del envío del formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const identificador = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const messageBox = document.getElementById('message');
            messageBox.className = 'message';

            try {
                const response = await fetch('/api/login/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    credentials: 'include',
                    body: JSON.stringify({ identificador, password })
                });

                if (!response.ok) throw new Error('Respuesta inválida');

                const data = await response.json();

                if (data.success) {
                    messageBox.textContent = 'Inicio de sesión exitoso';
                    messageBox.classList.add('success');

                    // Ocultar modal de login desde la instancia global
                    loginModalInstance.hide();

                    // Mostrar menú de usuario
                    document.getElementById('authButtons').classList.add('d-none');
                    document.getElementById('userMenu').classList.remove('d-none');
                    document.getElementById('userEmailDisplay').textContent = data.nombre;

                    // Guardar datos en localStorage
                    localStorage.setItem('usuarioActivo', JSON.stringify(data));

                    // Recargar la página para aplicar sesión
                    window.location.reload();
                } else {
                    messageBox.textContent = data.mensaje || 'Credenciales incorrectas.';
                    messageBox.classList.add('error');
                }

            } catch (error) {
                console.error(error);
                messageBox.textContent = 'Error inesperado. Intenta de nuevo.';
                messageBox.classList.add('error');
            }
        });
    }

    // Si hay sesión en localStorage, mostrar datos del usuario
    const sessionData = localStorage.getItem('usuarioActivo');
    if (sessionData) {
        const data = JSON.parse(sessionData);
        document.getElementById('authButtons')?.classList.add('d-none');
        document.getElementById('userMenu')?.classList.remove('d-none');
        document.getElementById('userEmailDisplay').textContent = data.nombre;
    }

    // Manejar cierre de sesión (logout)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuarioActivo');
            document.getElementById('authButtons').classList.remove('d-none');
            document.getElementById('userMenu').classList.add('d-none');
        });
    }

    // Limpiar cualquier backdrop residual cuando se cierra el modal
    loginModalElement.addEventListener('hidden.bs.modal', () => {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    });
});

// Obtiene un token CSRF desde las cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            const cookie = c.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
