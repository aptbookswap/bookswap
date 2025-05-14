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

// Función para inicializar el mapa con geolocalización
function initMap() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';
    
    // Primero intentamos obtener la ubicación actual
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Crear mapa centrado en la ubicación del usuario
                const userCoords = [position.coords.longitude, position.coords.latitude];
                createMap(userCoords);
                
                // Colocar marcador secundario automáticamente
                placeSecondaryMarker(userCoords);
                updateLocationField(userCoords);
                
                // Mostrar mensaje
                showMessage('Ubicación detectada automáticamente', 'success');
            },
            (error) => {
                // Si falla la geolocalización, usar ubicación por defecto (Viña del Mar)
                console.warn('Error obteniendo ubicación:', error);
                const defaultCoords = [-71.542969, -33.015347];
                createMap(defaultCoords);
                showMessage('Usando ubicación predeterminada', 'info');
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    } else {
        // Navegador no soporta geolocalización
        const defaultCoords = [-71.542969, -33.015347];
        createMap(defaultCoords);
        showMessage('Tu navegador no soporta geolocalización', 'info');
    }
}

// Crear el mapa de Mapbox
function createMap(centerCoords) {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: centerCoords,
        zoom: 14, // Zoom más cercano para mejor precisión
        dragRotate: false
    });

    // Configurar evento para agregar/editar marcador secundario con clic derecho
    map.on('contextmenu', (e) => {
        e.preventDefault();
        placeSecondaryMarker([e.lngLat.lng, e.lngLat.lat]);
        updateLocationField([e.lngLat.lng, e.lngLat.lat]);
    });

    // Añadir controles
    map.addControl(new mapboxgl.NavigationControl());
}

// Colocar o actualizar el marcador secundario
function placeSecondaryMarker(coords) {
    // Eliminar marcador anterior si existe
    if (secondaryMarker) {
        secondaryMarker.remove();
    }
    
    // Crear nuevo marcador secundario (visible y arrastrable)
    secondaryMarker = new mapboxgl.Marker({
        color: '#FF0000', // Rojo
        draggable: true
    })
    .setLngLat(coords)
    .addTo(map);
    
    // Permitir edición arrastrando el marcador
    secondaryMarker.on('dragend', () => {
        const newPos = secondaryMarker.getLngLat();
        updateLocationField([newPos.lng, newPos.lat]);
    });
    
    // Centrar el mapa en la nueva ubicación
    map.flyTo({
        center: coords,
        essential: true
    });
}

// Actualizar campo ubicación con las coordenadas
function updateLocationField(coords) {
    const [lng, lat] = coords;
    document.getElementById('ubicacion').value = `${lng.toFixed(6)},${lat.toFixed(6)}`;
    console.log('Ubicación actualizada:', document.getElementById('ubicacion').value);
}

// Función para mostrar mensajes
function showMessage(text, type) {
    const messageBox = document.getElementById('message');
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
    setTimeout(() => messageBox.textContent = '', 3000);
}

// Manejador de preferencias (tags)
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar el mapa
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

// Función para obtener el token CSRF
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