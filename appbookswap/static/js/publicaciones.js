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

document.addEventListener('DOMContentLoaded', function () {
    const imagenesInput = document.getElementById('imagenes');
    const previewContainer = document.getElementById('previewImagenes');

    if (imagenesInput) {
        imagenesInput.addEventListener('change', function () {
            previewContainer.innerHTML = ''; // Limpia previews anteriores

            const archivos = imagenesInput.files;
            if (archivos.length > 3) {
                alert("Solo puedes subir hasta 3 imágenes.");
                imagenesInput.value = "";  // Resetea el input
                return;
            }

            Array.from(archivos).forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.classList.add('img-thumbnail', 'm-1');
                    img.style.width = "100px";
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
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

async function cambiarEstadoAEnProceso(publicacionId) {
    const confirmar = confirm("¿Deseas marcar esta publicación como 'En proceso'?");
    if (!confirmar) return;

    try {
        const response = await fetch(`/api/publicacion/${publicacionId}/confirmar-en-proceso/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        const data = await response.json();
        if (response.ok && data.success) {
            alert("La publicación ha sido marcada como 'En proceso'");
            location.reload();
        } else {
            alert(data.error || "No se pudo actualizar el estado.");
        }
    } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado.");
    }
}


async function cancelarPublicacion(publicacionId) {
    const confirmar = confirm("¿Estás seguro de que deseas cancelar esta publicación?");
    if (!confirmar) return;

    try {
        const response = await fetch(`/api/publicacion/${publicacionId}/cancelar/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        const result = await response.json();
        if (response.ok && result.success) {
            alert("La publicación ha sido cancelada.");
            location.reload();
        } else {
            alert(result.error || "No se pudo cancelar la publicación.");
        }
    } catch (error) {
        console.error(error);
        alert("Error al cancelar la publicación.");
    }
}

async function volver_a_disponible(publicacionId) {
    const confirmar = confirm("¿Deseas volver a publicar esta publicación?");
    if (!confirmar) return;

    try {
        const response = await fetch(`/api/publicacion/${publicacionId}/volver-a-disponible/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        });

        const data = await response.json();
        if (response.ok && data.success) {
            alert("La publicación ha vuelto a estar disponible.");
            location.reload();
        } else {
            alert(data.error || "No se pudo actualizar la publicación.");
        }
    } catch (err) {
        console.error(err);
        alert("Error al actualizar el estado.");
    }
}




async function Publicar(publicacionId) {
  const confirmar = confirm("¿Deseas publicar esta publicación?");
  if (!confirmar) return;

  try {
    const response = await fetch(`/api/publicacion/${publicacionId}/Publicar/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCSRFToken()
      }
    });

    const data = await response.json();
    if (response.ok && data.success) {
      alert("La publicación está disponible.");
      // Redirección a Mis publicaciones
      window.location.href = '/publicaciones/';
    } else {
      alert(data.error || "No se pudo actualizar la publicación.");
    }
  } catch (err) {
    console.error(err);
    alert("Error al actualizar el estado.");
  }
}


// Valoraciones

// Mostrar modal de valoración al ofertador
function abrirModalValorarOfertador(idPublicacion, uidOfertador) {
    publicacionActivaId = idPublicacion;
    const modal = new bootstrap.Modal(document.getElementById('modalValorarOfertador'));
    document.querySelector('#modalValorarOfertador input[name="publicacion_id"]').value = idPublicacion;
    document.querySelector('#modalValorarOfertador input[name="ofertador_id"]').value = uidOfertador;
    modal.show();
}

// Mostrar modal de valoración al comprador
function abrirModalValorarComprador(idPublicacion, uidComprador) {
    publicacionActivaId = idPublicacion;
    const modal = new bootstrap.Modal(document.getElementById('modalValorarComprador'));
    document.querySelector('#modalValorarComprador input[name="publicacion_id"]').value = idPublicacion;
    document.querySelector('#modalValorarComprador input[name="comprador_id"]').value = uidComprador;
    modal.show();
}

// Enviar valoración al ofertador
document.getElementById('formValorarOfertador')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const ofertadorId = document.getElementById('ofertadorId').value;
    const rating = document.querySelector('#formValorarOfertador input[name="rating"]:checked')?.value;
    const comentario = document.getElementById('comentario_ofertador').value;

    if (!rating || !comentario) {
        alert("Por favor completa la puntuación y el comentario.");
        return;
    }

    try {
        const res = await fetch('/api/valorar/ofertador/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                ofertador_id: ofertadorId,
                rating: rating,
                comentario: comentario
            })
        });

        if (res.ok) {
            await marcarComoCompletado();
            alert("¡Valoración al ofertador enviada!");
            bootstrap.Modal.getInstance(document.getElementById('modalValorarOfertador')).hide();
            this.reset();
            location.reload();
        } else {
            const errorData = await res.json();
            alert(errorData.error || "Error al enviar valoración.");
        }
    } catch (err) {
        console.error(err);
        alert("Ocurrió un error al enviar la valoración.");
    }
});

// Enviar valoración al comprador
document.getElementById('formValorarComprador')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const compradorId = document.getElementById('compradorId').value;
    const rating = document.querySelector('#formValorarComprador input[name="rating"]:checked')?.value;
    const comentario = document.getElementById('comentario_comprador').value;

    if (!rating || !comentario) {
        alert("Por favor completa la puntuación y el comentario.");
        return;
    }

    try {
        const res = await fetch('/api/valorar/comprador/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                comprador_id: compradorId,
                rating: rating,
                comentario: comentario
            })
        });

        if (res.ok) {
            await marcarComoCompletado();
            alert("¡Valoración al comprador enviada!");
            bootstrap.Modal.getInstance(document.getElementById('modalValorarComprador')).hide();
            this.reset();
            location.reload();
        } else {
            const errorData = await res.json();
            alert(errorData.error || "Error al enviar valoración.");
        }
    } catch (err) {
        console.error(err);
        alert("Ocurrió un error al enviar la valoración.");
    }
});

// Marcar publicación como completada
async function marcarComoCompletado() {
    if (!publicacionActivaId) {
        console.warn("No hay ID de publicación activa.");
        return;
    }

    try {
        const response = await fetch(`/api/publicacion/${publicacionActivaId}/marcar-completado/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (data.estado === 'completado') {
                alert("🎉 ¡La publicación ha sido marcada como COMPLETADA por ambos usuarios!");
            } else if (data.estado === 'pendiente') {
                alert("✅ Tu confirmación ha sido registrada. Esperando al otro usuario para completar la publicación.");
            }
            location.reload();
        } else {
            alert(data.error || "❌ Error al marcar como completado.");
        }
    } catch (err) {
        console.error("Error marcando como completado:", err);
        alert("Error al comunicarse con el servidor.");
    }
}
document.addEventListener('DOMContentLoaded', function () {
  const ubicacionInput = document.getElementById('ubicacion');

  if (ubicacionInput && ubicacionInput.value && ubicacionInput.value.includes(',')) {
    const [lng, lat] = ubicacionInput.value.split(',').map(parseFloat);

    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';

    const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: 13
    });

    // Marcador de la ubicación del usuario (ofertador)
    new mapboxgl.Marker({ color: '#FF0000' })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setText("Ubicación del usuario"))
      .addTo(map);

    // Obtener y marcar ubicación del visitante (tú)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLng = position.coords.longitude;
          const userLat = position.coords.latitude;

          new mapboxgl.Marker({ color: '#0000FF' })
            .setLngLat([userLng, userLat])
            .setPopup(new mapboxgl.Popup().setText("Tú estás aquí"))
            .addTo(map);
        },
        (error) => {
          console.warn("No se pudo obtener tu ubicación:", error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }
});

mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';

document.addEventListener('DOMContentLoaded', () => {
    if (!ubicacionComprador || !ubicacionComprador.includes(",")) return;

    const coords = ubicacionComprador.split(",").map(c => parseFloat(c.trim()));
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return;

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: coords,
        zoom: 13
    });

    new mapboxgl.Marker({ color: 'red' })
        .setLngLat(coords)
        .setPopup(new mapboxgl.Popup().setText("Ubicación del comprador"))
        .addTo(map);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = [position.coords.longitude, position.coords.latitude];
                new mapboxgl.Marker({ color: 'blue' })
                    .setLngLat(userCoords)
                    .setPopup(new mapboxgl.Popup().setText("Tu ubicación"))
                    .addTo(map);
            },
            (error) => console.warn("Ubicación no disponible:", error)
        );
    }
});
