// static/js/libro.js

// Removed duplicate declaration of libroActivoId

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

let libroActivoId = null;



function seleccionarLibro(id) {
    libroActivoId = id; // No parseInt porque es texto UUID

    if (!libroActivoId) {
        console.error("ID de libro inválido:", id);
        alert("Error: ID de libro inválido.");
        return;
    }

    fetch(`/api/libro/${libroActivoId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('titulo').value = data.titulo || '';
            document.getElementById('autor').value = data.autor || '';
            document.getElementById('estado').value = data.estado || '';
            document.getElementById('genero').value = data.genero || '';
            document.getElementById('paginas').value = data.paginas || '';
            document.getElementById('cantidad').value = data.cantidad || '';

            ['titulo', 'autor', 'estado', 'genero', 'paginas', 'cantidad'].forEach(field => {
                document.getElementById(field).disabled = true;
            });

            document.getElementById('guardarCambiosBtn').disabled = true;
        })
        .catch(error => {
            console.error("Error cargando libro:", error);
            alert('Error al cargar el libro.');
        });
}



document.addEventListener('DOMContentLoaded', function () {
    // Switch para habilitar edición
    const toggleEdit = document.getElementById('toggleEdit');
    if (toggleEdit) {
        toggleEdit.addEventListener('change', function () {
            const editable = this.checked;
            ['titulo', 'autor', 'estado', 'genero', 'paginas', 'cantidad'].forEach(id => {
                document.getElementById(id).disabled = !editable;
            });
            document.getElementById('guardarCambiosBtn').disabled = !editable;
        });
    }

    // Confirmar guardar cambios
    const confirmarGuardarBtn = document.getElementById('confirmarGuardarBtn');
    confirmarGuardarBtn.addEventListener('click', () => {
        if (!libroActivoId) return;
    
        const data = {
            titulo: document.getElementById('titulo').value,
            autor: document.getElementById('autor').value,
            estado: document.getElementById('estado').value,
            genero: document.getElementById('genero').value,
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
                alert("Hubo un error al modificar el libro.");
            }
        })
        .catch(err => console.error("Error modificando libro:", err));
    });
    

    // Confirmar eliminar libro
    const confirmarEliminarBtn = document.getElementById('confirmarEliminarBtn');
    confirmarEliminarBtn.addEventListener('click', () => {
        if (!libroActivoId) return;

        if (!confirm("¿Seguro que deseas eliminar este libro?")) return;

        fetch(`/api/libro/${libroActivoId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(res => {
            if (res.ok) {
                alert("Libro eliminado con éxito");
                location.reload();
            } else {
                alert("Hubo un error al eliminar el libro.");
            }
        })
        .catch(err => console.error("Error eliminando libro:", err));
    });
});
