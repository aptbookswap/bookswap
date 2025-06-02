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

let publicacionActivaId = null;

function seleccionarPublicacion(id) {
    publicacionActivaId = id;
    fetch(`/api/publicacion/${id}/`)
        .then(res => {
            if (!res.ok) throw new Error("Error cargando publicación");
            return res.json();
        })
        .then(data => {
            document.getElementById('detalleTituloLibro').textContent = data.libro.titulo;
            document.getElementById('detalleValor').value = data.valor || '';
            document.getElementById('detalleTipo').value = data.tipo_transaccion || '';
            document.getElementById('detalleEstado').value = data.estado_publicacion || '';
            document.getElementById('detalleDescripcion').value = data.descripcion || '';

            const imgPreview = document.getElementById('detalleImagenes');
            imgPreview.innerHTML = '';
            if (data.imagenes && data.imagenes.length > 0) {
                data.imagenes.forEach(img => {
                    const imgTag = document.createElement('img');
                    imgTag.src = img.imagen;
                    imgTag.className = "img-thumbnail m-1";
                    imgTag.style.width = "100px";
                    imgPreview.appendChild(imgTag);
                });
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error cargando detalles");
        });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('confirmarEliminarPublicacionBtn')?.addEventListener('click', () => {
        if (!publicacionActivaId) return;

        fetch(`/api/publicacion/${publicacionActivaId}/`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCSRFToken() },
        })
        .then(res => {
            if (res.ok) {
                alert("Publicación eliminada");
                location.reload();
            } else {
                alert("Error al eliminar");
            }
        })
        .catch(err => console.error("Error eliminando publicación:", err));
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const params = new URLSearchParams(window.location.search);
    const libroId = params.get('libro_id');

    if (libroId && document.getElementById('formCrearPublicacion')) {
        fetch(`/api/libro/${libroId}/`)
            .then(res => {
                if (!res.ok) throw new Error("Error cargando datos del libro");
                return res.json();
            })
            .then(data => {
                document.getElementById('libro_id').value = data.id_libro;
                document.getElementById('titulo_libro').value = data.titulo;
                document.getElementById('autor_libro').value = data.autor;
                document.getElementById('estado_libro').value = data.estado;
                document.getElementById('genero_libro').value = data.genero;
                document.getElementById('paginas_libro').value = data.paginas;
                document.getElementById('cantidad_libro').value = data.cantidad;
            })
            .catch(err => {
                console.error(err);
                alert("No se pudo cargar la información del libro.");
            });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formCrearPublicacion');

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const libroId = document.getElementById('libro_id').value;
            const tipo = document.getElementById('tipo_transaccion').value;
            const valor = document.getElementById('valor').value || 0;
            const descripcion = document.getElementById('descripcion').value;
            const imagenesInput = document.getElementById('imagenes');
            const imagenes = imagenesInput.files;

            if (!libroId || !tipo || !descripcion) {
                alert("Completa todos los campos obligatorios.");
                return;
            }

            const formData = new FormData();
            formData.append('libro', libroId);
            formData.append('tipo_transaccion', tipo);
            formData.append('valor', valor);
            formData.append('descripcion', descripcion);
            formData.append('user', JSON.parse(localStorage.getItem('usuarioActivo')).uid);

            for (let i = 0; i < imagenes.length; i++) {
                formData.append('imagenes', imagenes[i]);
            }

            try {
                const response = await fetch('/api/publicaciones/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: formData,
                    credentials: 'include'
                });

                const data = await response.json();
                if (response.ok && data.success) {
                    alert("Publicación creada con éxito.");
                    window.location.href = '/publicaciones/';
                } else {
                    alert(data.error || "Error al crear la publicación.");
                }
            } catch (error) {
                console.error("Error al enviar formulario:", error);
                alert("Error de red al crear la publicación.");
            }
        });
    }
});

function verDetallePublicacion(id) {
    publicacionActivaId = id;

    fetch(`/api/publicacion/${id}/`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('detalleTituloLibro').textContent = data.libro.titulo;
            document.getElementById('detalleAutor').textContent = data.libro.autor;
            document.getElementById('detalleEstadoLibro').textContent = data.libro.estado;
            document.getElementById('detalleGenero').textContent = data.libro.genero;
            document.getElementById('detallePaginas').textContent = data.libro.paginas;
            document.getElementById('detalleCantidad').textContent = data.libro.cantidad;

            document.getElementById('detalleTipo').textContent = data.tipo_transaccion;
            document.getElementById('detalleValor').textContent = data.valor;
            document.getElementById('detalleEstado').textContent = data.estado_publicacion;
            document.getElementById('detalleDescripcion').textContent = data.descripcion;

            const imgContainer = document.getElementById('detalleImagenes');
            imgContainer.innerHTML = '';
            (data.imagenes || []).forEach(img => {
                const imgTag = document.createElement('img');
                imgTag.src = img.imagen;
                imgTag.className = "img-thumbnail m-1";
                imgTag.style.width = "100px";
                imgContainer.appendChild(imgTag);
            });
        })
        .catch(err => {
            console.error(err);
            alert("Error al cargar detalles de la publicación.");
        });
}

document.addEventListener('DOMContentLoaded', function () {
    const aceptarBtn = document.getElementById('btnAceptarPublicacion');

    if (aceptarBtn) {
        aceptarBtn.addEventListener('click', async () => {
            const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));
            if (!usuarioActivo || !usuarioActivo.uid) {
                alert("Debe iniciar sesión para aceptar la publicación.");
                return;
            }

            if (!publicacionActivaId) {
                alert("No hay publicación seleccionada.");
                return;
            }

            try {
                const response = await fetch(`/api/publicacion/${publicacionActivaId}/aceptar/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: JSON.stringify({ comprador_uid: usuarioActivo.uid })  
                });

                const result = await response.json();
                if (result.success) {
                    alert("Has aceptado la publicación correctamente.");
                    location.reload();
                } else {
                    alert(result.error || "No se pudo aceptar la publicación.");
                }
            } catch (err) {
                console.error(err);
                alert("Error al aceptar publicación.");
            }
        });
    }
});
