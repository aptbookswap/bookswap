// Función robusta para obtener el token CSRF
function getCSRFToken() {
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            const cookie = c.trim();
            if (cookie.startsWith('csrftoken=')) {
                return decodeURIComponent(cookie.substring('csrftoken='.length));
            }
        }
    }

    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) {
        return meta.getAttribute('content');
    }

    return null;
}

document.addEventListener('DOMContentLoaded', function () {
    const sessionData = localStorage.getItem('usuarioActivo');
    if (!sessionData) {
        alert("No hay sesión activa");
        return;
    }

    const usuario = JSON.parse(sessionData);

    const formFields = ['nombre', 'correo', 'numero', 'fecha_nacimiento', 'preferenciasInput', 'ubicacion'];
    const dropdown = document.getElementById('preferenciasDropdown');
    const tagsContainer = document.getElementById('preferenciasTags');
    const inputHidden = document.getElementById('preferenciasInput');
    const readOnlyContainer = document.getElementById('preferenciasReadOnly');
    let selectedValues = [];
    let isEditable = false;

    fetch(`/api/perfil/${usuario.uid}/`, {
        credentials: 'include'
    })
        .then(res => res.json())
        .then(data => {
            document.getElementById('nombre').value = data.first_name || '';
            document.getElementById('correo').value = data.email || '';
            document.getElementById('numero').value = data.numero || '';
            document.getElementById('fecha_nacimiento').value = data.fecha_nacimiento || '';
            document.getElementById('ubicacion').value = data.ubicacion || '';
            inputHidden.value = data.preferencias || '';

            if (data.img_perfil) {
                document.getElementById('imgPerfilPreview').src = data.img_perfil;
            }

            if (inputHidden.value) {
                selectedValues = inputHidden.value.split(',').map(p => p.trim());
                updateTags();
            }
        })
        .catch(err => {
            console.error("Error cargando perfil:", err);
            alert("Error cargando perfil");
        });

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

    const toggleEdit = document.getElementById('toggleEdit');
    if (toggleEdit) {
        toggleEdit.addEventListener('change', function () {
            isEditable = this.checked;
            document.querySelectorAll('.editable').forEach(el => el.disabled = !isEditable);
            dropdown.style.display = isEditable ? 'block' : 'none';
            updateTags();
        });
    }

    dropdown.addEventListener('change', function () {
        const selected = dropdown.value;
        if (selected && !selectedValues.includes(selected)) {
            selectedValues.push(selected);
            updateTags();
        }
        dropdown.value = '';
    });

    tagsContainer.addEventListener('click', function (e) {
        if (!isEditable) return;
        if (e.target.classList.contains('remove-tag')) {
            const value = e.target.getAttribute('data-value');
            selectedValues = selectedValues.filter(v => v !== value);
            updateTags();
        }
    });

    function updateTags() {
        tagsContainer.innerHTML = '';
        if (!isEditable) {
            readOnlyContainer.innerText = selectedValues.join(', ');
            return;
        }

        readOnlyContainer.innerText = '';
        selectedValues.forEach(value => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `${value} <span class="remove-tag" data-value="${value}">&times;</span>`;
            tagsContainer.appendChild(tag);
        });
        inputHidden.value = selectedValues.join(',');
    }

    const guardarBtn = document.getElementById('guardarCambiosBtn');
    guardarBtn.addEventListener('click', () => {
        inputHidden.value = selectedValues.join(',');
        const formData = new FormData();

        formFields.forEach(field => {
            let value = '';
            if (field === 'preferenciasInput') {
                value = inputHidden.value;
                formData.append('preferencias', value);
            } else if (field === 'nombre') {
                value = document.getElementById(field).value;
                formData.append('first_name', value);
            } else if (field === 'correo') {
                value = document.getElementById(field).value;
                formData.append('email', value);
            } else {
                const el = document.getElementById(field);
                if (el) formData.append(field, el.value);
            }
        });

        if (imgInput.files.length > 0) {
            formData.append('img_perfil', imgInput.files[0]);
        }

        fetch(`/api/perfil/${usuario.uid}/`, {
            method: 'PUT',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            credentials: 'include',
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

    const eliminarBtn = document.getElementById('eliminarCuentaBtn');
    eliminarBtn.addEventListener('click', () => {
        if (!confirm("¿Seguro que deseas eliminar tu cuenta?")) return;

        fetch(`/api/perfil/${usuario.uid}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            credentials: 'include'
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
