// Variables globales para el mapa
let map = null;
let secondaryMarker = null;

// Manejador de envío del formulario de registro
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Obtener valores del formulario
    const formData = {
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        numero: document.getElementById('numero').value.trim(),
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value.trim(),
        preferencias: document.getElementById('preferenciasInput').value.trim(),
        ubicacion: document.getElementById('ubicacion').value.trim(),
        direccion: document.getElementById('direccion').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value
    };

    const messageBox = document.getElementById('message');
    messageBox.className = 'message';

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
        showMessage('Las contraseñas no coinciden.', 'error');
        return;
    }

    if (formData.fecha_nacimiento && new Date(formData.fecha_nacimiento) > new Date()) {
        showMessage('La fecha de nacimiento no puede ser en el futuro.', 'error');
        return;
    }

    if (!formData.preferencias) {
        showMessage('Selecciona al menos una preferencia.', 'error');
        return;
    }

    if (!formData.ubicacion || !formData.ubicacion.includes(',')) {
        showMessage('Por favor, selecciona una ubicación en el mapa.', 'error');
        return;
    }

    if (!formData.direccion) {
        showMessage('Debe seleccionar una ubicación válida que genere una dirección.', 'error');
        return;
    }


    // Enviar datos al backend
    try {
        const response = await fetch('/api/registro/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({
                nombre: formData.nombre,
                correo: formData.email,
                numero: formData.numero,
                fecha_nacimiento: formData.fecha_nacimiento,
                preferencias: formData.preferencias,
                ubicacion: formData.ubicacion,
                direccion: formData.direccion,
                password: formData.password
            })
        });

        const data = await response.json();

        if (data.success) {
            showMessage(data.mensaje || 'Registro exitoso', 'success');
            document.getElementById('registerForm').reset();
            if (secondaryMarker) secondaryMarker.remove();
        } else {
            showMessage(data.mensaje || 'Error al registrar usuario', 'error');
        }

    } catch (error) {
        console.error("Error:", error);
        showMessage('Error al conectar con el servidor', 'error');
    }
});

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


// Mensajes de estado
function showMessage(text, type) {
    const messageBox = document.getElementById('message');
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    setTimeout(() => messageBox.textContent = '', 3000);
}

// Manejo de preferencias (tags)
document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('map')) {
        initMap();
    }

    const dropdown = document.getElementById('preferenciasDropdown');
    const tagsContainer = document.getElementById('preferenciasTags');
    const inputHidden = document.getElementById('preferenciasInput');
    let selectedValues = [];

    dropdown.addEventListener('change', function () {
        const selected = dropdown.value;
        if (selected && !selectedValues.includes(selected)) {
            selectedValues.push(selected);
            updateTags();
        }
        dropdown.value = '';
    });

    function updateTags() {
        tagsContainer.innerHTML = '';
        selectedValues.forEach(value => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `${value} <span class="remove-tag" data-value="${value}">×</span>`;
            tagsContainer.appendChild(tag);
        });
        inputHidden.value = selectedValues.join(',');
    }

    tagsContainer.addEventListener('click', function (e) {
        if (e.target.classList.contains('remove-tag')) {
            const value = e.target.getAttribute('data-value');
            selectedValues = selectedValues.filter(v => v !== value);
            updateTags();
        }
    });
});

// CSRF token helper
function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return null;
}
