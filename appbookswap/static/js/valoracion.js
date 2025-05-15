// Función para obtener CSRF desde cookies
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

        const uid = document.getElementById('ofertadorId').value;
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
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                ofertador: uid,
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

        const uid = document.getElementById('compradorId').value;
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
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                comprador: uid,
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
