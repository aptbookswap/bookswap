// 👇 Utilidad para obtener el CSRF Token desde las cookies
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

document.addEventListener('DOMContentLoaded', function () {
    const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
    if (!usuario || !usuario.uid) {
        alert("Debes iniciar sesión para ver esta página.");
        window.location.href = "/";
        return;
    }

    const formFields = ['nombre', 'correo', 'numero', 'fecha_nacimiento', 'preferencias', 'ubicacion'];

    // Cargar datos del perfil
    fetch(`/api/perfil/${usuario.uid}/`)
        .then(res => res.json())
        .then(data => {
            formFields.forEach(field => {
                const input = document.getElementById(field);
                if (!input) return;
                if (field === 'nombre') {
                    input.value = data.first_name || '';
                } else if (field === 'correo') {
                    input.value = data.email || '';
                } else {
                    input.value = data[field] || '';
                }
            });

            if (data.img_perfil) {
                document.getElementById('imgPerfilPreview').src = data.img_perfil;
            }
        })
        .catch(err => {
            console.error("Error cargando perfil:", err);
        });

    // Mostrar input de imagen al hacer clic
    const imgBtn = document.getElementById('changeImgBtn');
    const imgInput = document.getElementById('imgPerfilInput');
    const imgPreview = document.getElementById('imgPerfilPreview');

    imgBtn.addEventListener('click', () => imgInput.click());

    imgInput.addEventListener('change', () => {
        const file = imgInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => imgPreview.src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    // Habilitar edición al marcar el checkbox
    const toggleEdit = document.getElementById('toggleEdit');
    if (toggleEdit) {
        toggleEdit.addEventListener('change', function () {
            const editable = this.checked;
            formFields.forEach(id => {
                const input = document.getElementById(id);
                if (input) input.disabled = !editable;
            });
            imgInput.disabled = !editable;
            imgBtn.disabled = !editable;
        });
    }

    // Guardar cambios confirmados
    const guardarBtn = document.getElementById('guardarCambiosBtn');
    guardarBtn.addEventListener('click', () => {
        const formData = new FormData();
        formFields.forEach(field => {
            const value = document.getElementById(field).value;
            if (field === 'nombre') {
                formData.append('first_name', value);
            } else if (field === 'correo') {
                formData.append('email', value);
            } else {
                formData.append(field, value);
            }
        });

        if (imgInput.files.length > 0) {
            formData.append('img_perfil', imgInput.files[0]);
        }

        fetch(`/api/perfil/${usuario.uid}/`, {
            method: 'PUT',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(res => {
            if (res.ok) {
                alert("Perfil actualizado con éxito");
                window.location.reload();
            } else {
                alert("Hubo un error al actualizar.");
            }
        })
        .catch(err => console.error("Error al modificar perfil:", err));
    });

    // Eliminar cuenta
    const eliminarBtn = document.getElementById('eliminarCuentaBtn');
    eliminarBtn.addEventListener('click', () => {
        if (!confirm("¿Seguro que deseas eliminar tu cuenta?")) return;

        fetch(`/api/perfil/${usuario.uid}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(res => {
            if (res.ok) {
                alert("Cuenta eliminada con éxito.");
                localStorage.removeItem('usuarioActivo');
                window.location.href = "/";
            } else {
                alert("No se pudo eliminar la cuenta.");
            }
        })
        .catch(err => console.error("Error eliminando cuenta:", err));
    });
});
