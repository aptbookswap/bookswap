// ===================== Inicialización =====================
document.addEventListener('DOMContentLoaded', function() {
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';

    if (localStorage.getItem('usuarioActivo')) {
        document.getElementById('mapLoginOverlay').style.display = 'none';
        document.getElementById('realMap').style.display = 'block';
        initMap();
    }

    // ===================== Función principal del mapa =====================
    function initMap() {
        // ----------- Datos del usuario actual -----------
        const coordElement = document.getElementById('usuario-actual-data');
        const coordsStr = coordElement ? coordElement.getAttribute('data-coords') : null;
        const currentUsername = coordElement ? coordElement.getAttribute('data-username') : null;

        let centerCoords = null;
        let hasStoredLocation = false;

        if (coordsStr && coordsStr.trim() !== '') {
            const parts = coordsStr.split(',');
            if (parts.length === 2) {
                const lng = parseFloat(parts[0]);
                const lat = parseFloat(parts[1]);
                if (!isNaN(lng) && !isNaN(lat)) {
                    centerCoords = [lng, lat];
                    hasStoredLocation = true;
                }
            }
        }

        if (!centerCoords) {
            document.getElementById('realMap').innerHTML = `
                <div class="alert alert-warning">
                    No se pudo cargar la ubicación. Valor recibido: "${coordsStr || 'vacío'}"
                </div>
            `;
            return;
        }

        // ----------- Inicialización del mapa -----------
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: centerCoords,
            zoom: 15
        });

        // ===================== Geolocalización =====================
        let watchingPosition = false;
        let currentPosition = null;
        let userMarker = null;

        function updateUserPosition(position) {
            currentPosition = position;
            if (!userMarker) {
                const el = document.createElement('div');
                el.className = 'user-location-marker';
                el.innerHTML = '<div class="user-location-dot"></div>';
                userMarker = new mapboxgl.Marker(el)
                    .setLngLat([position.coords.longitude, position.coords.latitude])
                    .addTo(map);
            } else {
                userMarker.setLngLat([position.coords.longitude, position.coords.latitude]);
            }

            map.flyTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: 15,
                essential: true,
                speed: 0.8
            });
        }

        const geolocate = {
            activate: function() {
                if (watchingPosition) {
                    navigator.geolocation.clearWatch(this.watchId);
                    watchingPosition = false;
                    if (userMarker) userMarker.remove();
                    userMarker = null;
                    return;
                }

                this.watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        updateUserPosition(position);
                    },
                    (error) => {
                        console.error('Error de geolocalización:', error);
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 0,
                        timeout: 5000
                    }
                );
                watchingPosition = true;
            },

            trigger: function() {
                if (!currentPosition) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            updateUserPosition(position);
                        },
                        (error) => {
                            console.error('Error de geolocalización:', error);
                        },
                        {
                            enableHighAccuracy: true,
                            maximumAge: 0,
                            timeout: 5000
                        }
                    );
                } else {
                    updateUserPosition(currentPosition);
                }
            }
        };

        // ===================== Controles del mapa =====================
        const geoButton = document.createElement('button');
        geoButton.className = 'mapboxgl-ctrl-geolocate';
        geoButton.innerHTML = '<i class="fas fa-location-arrow"></i>';
        geoButton.title = 'Centrar en mi ubicación actual';
        geoButton.addEventListener('click', function() {
            geolocate.trigger();
        });

        map.addControl(new mapboxgl.NavigationControl());
        map.addControl({
            onAdd: function() {
                const container = document.createElement('div');
                container.className = 'mapboxgl-ctrl-group mapboxgl-ctrl';
                container.appendChild(geoButton);
                return container;
            },
            onRemove: function() {}
        }, 'top-right');

        // ===================== Marcadores de usuarios =====================
        map.on('load', function() {
            loadUserMarkers(map);

            if (!hasStoredLocation) {
                setTimeout(() => {
                    geolocate.trigger();
                }, 1000);
            }
        });

        function loadUserMarkers(map) {
            try {
                const usuariosData = JSON.parse(document.getElementById('usuarios-data').textContent || '[]');
                const currentCoords = coordsStr.replace(/\s/g, '');

                usuariosData.forEach(function(usuario) {
                    try {
                        const [longitud, latitud] = usuario.coords.split(',').map(Number);
                        if (isNaN(longitud) || isNaN(latitud)) return;

                        const markerElement = document.createElement('div');
                        markerElement.className = 'user-marker-container';

                        const usuarioCoords = usuario.coords.replace(/\s/g, '');
                        const isCurrentUser = usuario.username === currentUsername && usuarioCoords === currentCoords;

                        const displayName = isCurrentUser ? 'Tú' : usuario.username;

                        markerElement.innerHTML = `
                            <div class="user-marker-content ${isCurrentUser ? 'current-user' : ''}">
                                <div class="user-marker-icon">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div class="user-marker-name">${displayName}</div>
                            </div>
                        `;

                        new mapboxgl.Marker(markerElement)
                            .setLngLat([longitud, latitud])
                            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
                                <div class="map-popup-content">
                                    <h6>${displayName}</h6>
                                    ${!isCurrentUser ? `<button class="btn btn-sm btn-primary" onclick="verPublicacionesUsuario('${usuario.uid}')">
                                        Ver publicaciones
                                    </button>` : ''}
                                </div>
                            `))
                            .addTo(map);
                    } catch (error) {
                        console.error('Error al crear marcador:', error);
                    }
                });
            } catch (error) {
                console.error('Error al cargar datos:', error);
            }
        }
    }
});

// ===================== Función global para ver publicaciones =====================
function verPublicacionesUsuario(uid) {
    if (!uid) {
        alert("Error: Usuario no válido");
        return;
    }
    window.location.href = `/publicaciones/usuario/${uid}/`;
}