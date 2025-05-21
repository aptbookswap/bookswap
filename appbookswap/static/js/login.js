// Función robusta para obtener el token CSRF desde cookies o <meta>
function getCSRFToken() {
    // 1. Buscar en cookies
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            const cookie = c.trim();
            if (cookie.startsWith('csrftoken=')) {
                return decodeURIComponent(cookie.substring('csrftoken='.length));
            }
        }
    }

    // 2. Buscar en el <meta name="csrf-token"> como fallback
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        return meta.getAttribute('content');
    }

    return null;
}

document.addEventListener('DOMContentLoaded', function () {
    // Crear instancia global de modal
    const loginModalElement = document.getElementById('loginModal');
    const loginModalInstance = new bootstrap.Modal(loginModalElement);

    // Mostrar modal al hacer clic en botón
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
                        'X-CSRFToken': getCSRFToken() // ✅ token robusto
                    },
                    credentials: 'include', // ✅ para que Django reciba y devuelva cookies
                    body: JSON.stringify({ identificador, password })
                });

                if (!response.ok) throw new Error('Respuesta inválida');

                const data = await response.json();

                if (data.success) {
                    messageBox.textContent = 'Inicio de sesión exitoso';
                    messageBox.classList.add('success');

                    loginModalInstance.hide();

                    document.getElementById('authButtons').classList.add('d-none');
                    document.getElementById('userMenu').classList.remove('d-none');
                    document.getElementById('userEmailDisplay').textContent = data.nombre;

                    localStorage.setItem('usuarioActivo', JSON.stringify(data));

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

    // Cargar sesión guardada si existe
    const sessionData = localStorage.getItem('usuarioActivo');
    if (sessionData) {
        const data = JSON.parse(sessionData);
        document.getElementById('authButtons')?.classList.add('d-none');
        document.getElementById('userMenu')?.classList.remove('d-none');
        document.getElementById('userEmailDisplay').textContent = data.nombre;
    }

    // Cierre de sesión
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('usuarioActivo');
            document.getElementById('authButtons').classList.remove('d-none');
            document.getElementById('userMenu').classList.add('d-none');
            window.location.href = "/";
        });
    }

    // Limpiar backdrop residual al cerrar modal
    loginModalElement.addEventListener('hidden.bs.modal', () => {
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    });
});
