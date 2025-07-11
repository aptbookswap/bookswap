//==================================================
// Lógica para editar, ver y eliminar libros (modal)
//==================================================

//-------------------------------------
// Obtener token CSRF desde cookie o meta
//-------------------------------------
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

//-------------------------------------
// Redirigir si no hay usuario logueado
//-------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    const usuario = JSON.parse(localStorage.getItem('usuarioActivo'));
    if (!usuario || !usuario.uid) {
        showModal("Debes iniciar sesión para ver esta página.", function() {
            window.location.href = "/";
        });
        return;
    }
});

//-------------------------------------
// Variables globales
//-------------------------------------
let libroActivoId = null;
let generosSeleccionados = [];

//-------------------------------------
// Cargar géneros desde string separado por comas
//-------------------------------------
function cargarGenerosLibro(generosStr) {
    generosSeleccionados = generosStr.split(',').map(p => p.trim()).filter(Boolean);
    actualizarTags();
}

//-------------------------------------
// Mostrar géneros seleccionados como tags visuales
//-------------------------------------
function actualizarTags() {
    const generoTags = document.getElementById('generoTagsEdit');
    const generoInput = document.getElementById('generoEdit');

    generoTags.innerHTML = '';
    generosSeleccionados.forEach(genero => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `${genero} <span class="remove-tag" data-value="${genero}">&times;</span>`;
        generoTags.appendChild(tag);
    });

    generoInput.value = generosSeleccionados.join(',');
}

//-------------------------------------
// Cargar los datos de un libro en el modal
//-------------------------------------
function seleccionarLibro(id) {
    libroActivoId = id;

    if (!libroActivoId) {
        console.error("ID de libro inválido:", id);
        showModal("Error: ID de libro inválido.");
        return;
    }

    fetch(`/api/libro/${libroActivoId}/`)
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}`);
            return response.json();
        })
        .then(data => {
            document.getElementById('titulo').value = data.titulo || '';
            document.getElementById('autor').value = data.autor || '';
            document.getElementById('estado').value = data.estado || '';
            document.getElementById('paginas').value = data.paginas || '';
            document.getElementById('cantidad').value = data.cantidad || '';
            document.getElementById('generoEdit').value = data.genero || '';
            cargarGenerosLibro(data.genero || '');

            const imagen = document.getElementById('detalleImagen');
            if (data.imagenes && data.imagenes.length > 0 && data.imagenes[0].imagen) {
                imagen.src = data.imagenes[0].imagen;
                imagen.classList.remove('d-none');
            } else {
                imagen.src = '';
                imagen.classList.add('d-none');
            }
        })
        .catch(error => {
            console.error("Error cargando libro:", error);
            showModal('Error al cargar el libro.');
        });
}

//-------------------------------------
// Lógica de edición y botones del formulario
//-------------------------------------
document.addEventListener('DOMContentLoaded', function () {
    const generoDropdown = document.getElementById('generoDropdownEdit');
    const generoTags = document.getElementById('generoTagsEdit');

    // Agregar género desde dropdown
    generoDropdown.addEventListener('change', function () {
        const selected = this.value;
        if (selected && !generosSeleccionados.includes(selected)) {
            generosSeleccionados.push(selected);
            actualizarTags();
        }
        this.value = '';
    });

    // Quitar género al hacer clic en "×"
    generoTags.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-tag')) {
            const value = e.target.getAttribute('data-value');
            generosSeleccionados = generosSeleccionados.filter(g => g !== value);
            actualizarTags();
        }
    });

    // Habilitar edición
    const toggleEdit = document.getElementById('toggleEdit');
    if (toggleEdit) {
        toggleEdit.addEventListener('change', function () {
            const editable = this.checked;
            document.querySelectorAll('#libroForm input, #libroForm select').forEach(el => {
                el.disabled = !editable;
                if (el.id !== 'toggleEdit') {
                el.disabled = !editable;
            }
            });
            document.getElementById('guardarCambiosBtn').disabled = !editable;
            document.getElementById('eliminarBtn').disabled = !editable;
        });
    }

const editarImagenBtn = document.getElementById('editarImagenBtn');
const editarImagenInput = document.getElementById('editarImagenInput');
const detalleImagen = document.getElementById('detalleImagen');

if (toggleEdit && editarImagenBtn && editarImagenInput) {
    toggleEdit.addEventListener('change', function () {
        const editable = this.checked;
        editarImagenBtn.style.display = editable ? 'inline-block' : 'none';
        // NO deshabilites el input, solo ocúltalo visualmente
        // editarImagenInput.disabled = !editable;  // <-- QUITA ESTA LÍNEA
    });

    editarImagenBtn.addEventListener('click', function () {
        editarImagenInput.click();
    });

    editarImagenInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                detalleImagen.src = e.target.result;
                detalleImagen.classList.remove('d-none');
            };
            reader.readAsDataURL(file);
        }
    });
}

    // Guardar cambios del libro (PUT)
    const confirmarGuardarBtn = document.getElementById('confirmarGuardarBtn');
confirmarGuardarBtn.addEventListener('click', () => {
    if (!libroActivoId) return;

    const formData = new FormData();
    formData.append('titulo', document.getElementById('titulo').value);
    formData.append('autor', document.getElementById('autor').value);
    formData.append('estado', document.getElementById('estado').value);
    formData.append('genero', document.getElementById('generoEdit').value);
    formData.append('paginas', document.getElementById('paginas').value);
    formData.append('cantidad', document.getElementById('cantidad').value);

    // Adjuntar imagen solo si se seleccionó una nueva
    const imagenInput = document.getElementById('editarImagenInput');
    if (imagenInput.files.length > 0) {
        formData.append('imagen', imagenInput.files[0]);
    }

    fetch(`/api/libro/${libroActivoId}/`, {
        method: 'PUT',
        headers: {
            'X-CSRFToken': getCSRFToken()
            // No pongas 'Content-Type', el navegador lo gestiona con FormData
        },
        body: formData
    })
    .then(res => {
        if (res.ok) {
            const imagen = document.getElementById('detalleImagen');
            if (imagen && imagen.src) {
                imagen.src = imagen.src.split('?')[0] + '?t=' + new Date().getTime();
            }
            // location.reload(); // Si recargas, esto no es necesario
            showModal("Libro modificado con éxito", function() {
                location.reload();
            });
        } else {
            showModal("Hubo un error al modificar el libro. Revise el formulario.");
        }
    })
    .catch(err => console.error("Error modificando libro:", err));
});

    // Eliminar libro (DELETE)
    const confirmarEliminarBtn = document.getElementById('confirmarEliminarBtn');
    confirmarEliminarBtn.addEventListener('click', () => {
        if (!libroActivoId) return;

        fetch(`/api/libro/${libroActivoId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        })
        .then(res => {
            if (res.ok) {
                const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('detalleLibroModal'));
                modalDetalle.hide();

                const card = document.querySelector(`[data-libro-id="${libroActivoId}"]`);
                if (card) card.remove();

                showModal("Libro eliminado con éxito");
            } else {
                showModal("Hubo un error al eliminar el libro.");
            }
        })
        .catch(err => console.error("Error eliminando libro:", err));
    });
});
