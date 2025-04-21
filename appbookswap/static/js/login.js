document.addEventListener('DOMContentLoaded', function () {
    // Mostrar el modal de login al hacer clic
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
        });
    }

    // Manejar envío del formulario de login
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
                    credentials: 'include', // ✅ Permitir cookies de sesión de Django
                    body: JSON.stringify({
                        identificador,
                        password
                    })
                });

                if (!response.ok) throw new Error('Respuesta inválida');

                const data = await response.json();

                if (data.success) {
                    messageBox.textContent = 'Inicio de sesión exitoso';
                    messageBox.classList.add('success');

                    // Ocultar modal
                    const modalElement = document.getElementById('loginModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    modalInstance.hide();

                    // Mostrar menú de usuario
                    document.getElementById('authButtons').classList.add('d-none');
                    document.getElementById('userMenu').classList.remove('d-none');
                    document.getElementById('userEmailDisplay').textContent = data.nombre;

                    // Guardar datos en localStorage (opcional si quieres usarlo para JS)
                    localStorage.setItem('usuarioActivo', JSON.stringify(data));

                    // Recargar la página para aplicar la sesión
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

    // Mostrar datos si hay sesión activa
    const sessionData = localStorage.getItem('usuarioActivo');
    if (sessionData) {
        const data = JSON.parse(sessionData);
        document.getElementById('authButtons')?.classList.add('d-none');
        document.getElementById('userMenu')?.classList.remove('d-none');
        document.getElementById('userEmailDisplay').textContent = data.nombre;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuarioActivo');
            document.getElementById('authButtons').classList.remove('d-none');
            document.getElementById('userMenu').classList.add('d-none');
        });
    }
});

// 👇 Utilidad para obtener el CSRF Token desde cookies
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
