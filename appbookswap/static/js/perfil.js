// Variables globales para el mapa
let map = null;
let secondaryMarker = null;

// Inicializar mapa
function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userCoords = [position.coords.longitude, position.coords.latitude];
                createMap(userCoords);
                placeSecondaryMarker(userCoords);
                updateLocationField(userCoords);
                obtenerDireccion(userCoords[0], userCoords[1]);
                showMessage('Ubicación detectada automáticamente', 'success');
            },
            (error) => {
                console.warn('Error obteniendo ubicación:', error);
                const defaultCoords = [-71.542969, -33.015347];
                createMap(defaultCoords);
                showMessage('Usando ubicación predeterminada', 'info');
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        const defaultCoords = [-71.542969, -33.015347];
        createMap(defaultCoords);
        showMessage('Tu navegador no soporta geolocalización', 'info');
    }
}

function createMap(centerCoords) {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: centerCoords,
        zoom: 14,
        dragRotate: false
    });

    map.on('contextmenu', (e) => {
        e.preventDefault();
        const coords = [e.lngLat.lng, e.lngLat.lat];
        placeSecondaryMarker(coords);
        updateLocationField(coords);
        obtenerDireccion(coords[0], coords[1]);
    });

    map.addControl(new mapboxgl.NavigationControl());
}

function placeSecondaryMarker(coords) {
    if (secondaryMarker) {
        secondaryMarker.remove();
    }

    secondaryMarker = new mapboxgl.Marker({
        color: '#FF0000',
        draggable: true
    })
        .setLngLat(coords)
        .addTo(map);

    secondaryMarker.on('dragend', async () => {
        const newPos = secondaryMarker.getLngLat();
        updateLocationField([newPos.lng, newPos.lat]);
        await obtenerDireccion(newPos.lng, newPos.lat);
    });

    map.flyTo({
        center: coords,
        essential: true
    });
}

function updateLocationField(coords) {
    const [lng, lat] = coords;
    document.getElementById('ubicacion').value = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    console.log('Ubicación actualizada:', document.getElementById('ubicacion').value);
}

async function obtenerDireccion(lng, lat) {
    const accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&language=es&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
            const direccion = data.features[0].place_name;

            // Validar que la dirección esté en Chile
            if (direccion.includes("Chile")) {
                console.log("Dirección encontrada:", direccion);
                document.getElementById('direccion').value = direccion;
            } else {
                console.warn("La dirección no está en Chile:", direccion);
                document.getElementById('direccion').value = "Ubicación fuera de Chile";
                showMessage('Por favor selecciona una ubicación dentro de Chile.', 'error');
            }
        } else {
            console.warn("No se encontró dirección.");
            document.getElementById('direccion').value = "Dirección no encontrada";
        }
    } catch (error) {
        console.error("Error obteniendo dirección:", error);
        document.getElementById('direccion').value = "Error al obtener dirección";
    }
}

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

    const formFields = ['nombre', 'correo', 'numero', 'fecha_nacimiento', 'preferenciasInput', 'ubicacion', 'direccion'];
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
            document.getElementById('direccion').value = data.direccion || '';
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

            if (isEditable) {
                // Mostrar el contenedor del mapa (si estaba oculto)
                document.getElementById('map').style.display = 'block';
                if (!map) {  // Solo inicializar el mapa si no está creado
                    initMap();
                }
            } else {
                // Ocultar el mapa si no está en edición
                document.getElementById('map').style.display = 'none';
            }
        });
    }

    // Al cargar la página ocultar el mapa
    document.getElementById('map').style.display = 'none';

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

    const guardarBtn = document.getElementById('guardarCambiosBtn');
    guardarBtn.addEventListener('click', () => {
        inputHidden.value = selectedValues.join(',');
        const formData = new FormData();

        formFields.forEach(field => {
            if (field === 'preferenciasInput') {
                formData.append('preferencias', inputHidden.value);
            } else if (field === 'nombre') {
                formData.append('first_name', document.getElementById(field).value);
            } else if (field === 'correo') {
                formData.append('email', document.getElementById(field).value);
            } else if (field === 'direccion') {
                formData.append('direccion', document.getElementById(field).value);
            } else if (field === 'ubicacion') {
                formData.append('ubicacion', document.getElementById(field).value);
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
