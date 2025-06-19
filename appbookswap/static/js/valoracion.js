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

        if (!response.ok) {
            console.error("Error al marcar como completado");
        }
    } catch (err) {
        console.error("Error marcando como completado:", err);
    }
}
