// Obtiene el valor de una cookie por su nombre
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

// Variables globales
let libroActivoId = null;
let generosSeleccionados = [];

// Carga los géneros desde una cadena separada por comas
function cargarGenerosLibro(generosStr) {
    generosSeleccionados = generosStr.split(',').map(p => p.trim()).filter(Boolean);
    actualizarTags();
}

// Actualiza visualmente los tags de géneros en el formulario
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

// Carga los detalles del libro en el modal
function seleccionarLibro(id) {
    libroActivoId = id;

    if (!libroActivoId) {
        console.error("ID de libro inválido:", id);
        alert("Error: ID de libro inválido.");
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
            alert('Error al cargar el libro.');
        });
}

// Lógica al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    const generoDropdown = document.getElementById('generoDropdownEdit');
    const generoTags = document.getElementById('generoTagsEdit');
    const generoInput = document.getElementById('generoEdit');

    // Manejo de selección de género
    generoDropdown.addEventListener('change', function () {
        const selected = this.value;
        if (selected && !generosSeleccionados.includes(selected)) {
            generosSeleccionados.push(selected);
            actualizarTags();
        }
        this.value = '';
    });

    // Manejo de eliminación de tags
    generoTags.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-tag')) {
            const value = e.target.getAttribute('data-value');
            generosSeleccionados = generosSeleccionados.filter(g => g !== value);
            actualizarTags();
        }
    });

    // Activar/desactivar inputs al marcar "Editar"
    const toggleEdit = document.getElementById('toggleEdit');
    if (toggleEdit) {
        toggleEdit.addEventListener('change', function () {
            const editable = this.checked;
            document.querySelectorAll('#libroForm input, #libroForm select').forEach(el => {
                el.disabled = !editable;
            });
            document.getElementById('guardarCambiosBtn').disabled = !editable;
            document.getElementById('eliminarBtn').disabled = !editable;
        });
    }

    // Confirmar modificación de libro
    const confirmarGuardarBtn = document.getElementById('confirmarGuardarBtn');
    confirmarGuardarBtn.addEventListener('click', () => {
        if (!libroActivoId) return;

        const data = {
            titulo: document.getElementById('titulo').value,
            autor: document.getElementById('autor').value,
            estado: document.getElementById('estado').value,
            genero: document.getElementById('generoEdit').value,
            paginas: parseInt(document.getElementById('paginas').value),
            cantidad: parseInt(document.getElementById('cantidad').value)
        };

        fetch(`/api/libro/${libroActivoId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(data)
        })
        .then(res => {
            if (res.ok) {
                alert("Libro modificado con éxito");
                location.reload();
            } else {
                alert("Hubo un error al modificar el libro. Revise el formulario.");
            }
        })
        .catch(err => console.error("Error modificando libro:", err));
    });

    // Confirmar eliminación de libro
    const confirmarEliminarBtn = document.getElementById('confirmarEliminarBtn');
    confirmarEliminarBtn.addEventListener('click', () => {
        if (!libroActivoId) return;

        fetch(`/api/libro/${libroActivoId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(res => {
            if (res.ok) {
                const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('detalleLibroModal'));
                modalDetalle.hide();

                const card = document.querySelector(`[data-libro-id="${libroActivoId}"]`);
                if (card) card.remove();

                alert("Libro eliminado con éxito");
            } else {
                alert("Hubo un error al eliminar el libro.");
            }
        })
        .catch(err => console.error("Error eliminando libro:", err));
    });
});
