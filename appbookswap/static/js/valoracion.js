// Función robusta para obtener el CSRF token
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
    const usuarioActivo = JSON.parse(localStorage.getItem('usuarioActivo'));
    if (!usuarioActivo) {
        console.error("No se encontró usuario activo en localStorage.");
        return;
    }

    // === MODAL: Valorar al Ofertador ===
    const modalOfertador = document.getElementById('modalValorarOfertador');
    modalOfertador?.addEventListener('show.bs.modal', event => {
        const button = event.relatedTarget;
        const userUid = button.getAttribute('data-user-uid');
        const userName = button.getAttribute('data-user-name');

        const modalTitle = modalOfertador.querySelector('.modal-title');
        const inputUserUid = modalOfertador.querySelector('#ofertadorId');

        modalTitle.textContent = `Valorar a ${userName}`;
        inputUserUid.value = userUid;
    });

    document.getElementById('formValorarOfertador')?.addEventListener('submit', function (e) {
        e.preventDefault();

        const ofertadorUid = document.getElementById('ofertadorId').value;
        const rating = document.querySelector('#formValorarOfertador input[name="rating"]:checked')?.value;
        const comentario = document.getElementById('comentario_ofertador').value;

        if (!rating) {
            alert("Selecciona una puntuación para el ofertador");
            return;
        }

        fetch('/api/valorar/ofertador/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            credentials: 'include',
            body: JSON.stringify({
                ofertador: ofertadorUid,
                comprador: usuarioActivo.uid,
                puntuacion: rating,
                comentario: comentario
            })
        })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(res => {
            if (res.ok) {
                alert("¡Valoración al ofertador enviada!");
                bootstrap.Modal.getInstance(modalOfertador).hide();
                this.reset();
            } else {
                console.error("Errores:", res.data);
                alert("Error al enviar la valoración.");
            }
        })
        .catch(err => {
            console.error("Error valorando ofertador:", err);
        });
    });

    // === MODAL: Valorar al Comprador ===
    const modalComprador = document.getElementById('modalValorarComprador');
    modalComprador?.addEventListener('show.bs.modal', event => {
        const button = event.relatedTarget;
        const userUid = button.getAttribute('data-user-uid');
        const userName = button.getAttribute('data-user-name');

        const modalTitle = modalComprador.querySelector('.modal-title');
        const inputUserUid = modalComprador.querySelector('#compradorId');

        modalTitle.textContent = `Valorar a ${userName}`;
        inputUserUid.value = userUid;
    });

    document.getElementById('formValorarComprador')?.addEventListener('submit', function (e) {
        e.preventDefault();

        const compradorUid = document.getElementById('compradorId').value;
        const rating = document.querySelector('#formValorarComprador input[name="rating"]:checked')?.value;
        const comentario = document.getElementById('comentario_comprador').value;

        if (!rating) {
            alert("Selecciona una puntuación para el comprador");
            return;
        }

        fetch('/api/valorar/comprador/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            credentials: 'include',
            body: JSON.stringify({
                comprador: compradorUid,
                ofertador: usuarioActivo.uid,
                puntuacion: rating,
                comentario: comentario
            })
        })
        .then(res => res.json().then(data => ({ ok: res.ok, data })))
        .then(res => {
            if (res.ok) {
                alert("¡Valoración al comprador enviada!");
                bootstrap.Modal.getInstance(modalComprador).hide();
                this.reset();
            } else {
                console.error("Errores:", res.data);
                alert("Error al enviar la valoración.");
            }
        })
        .catch(err => {
            console.error("Error valorando comprador:", err);
        });
    });
});
