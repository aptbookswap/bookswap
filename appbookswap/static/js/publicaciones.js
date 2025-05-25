function getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        const cookie = c.trim();
        if (cookie.startsWith('csrftoken=')) {
            return decodeURIComponent(cookie.substring('csrftoken='.length));
        }
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
