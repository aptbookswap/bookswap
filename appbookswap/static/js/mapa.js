document.addEventListener('DOMContentLoaded', function() {
    // Configuración inicial
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';
    
    // Verificar sesión
    if (localStorage.getItem('usuarioActivo')) {
        document.getElementById('mapLoginOverlay').style.display = 'none';
        document.getElementById('realMap').style.display = 'block';
        initMap();
    }

    function initMap() {        
        // 1. Obtener datos del usuario actual
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
        
        // 2. Validar coordenadas
        if (!centerCoords) {
            document.getElementById('realMap').innerHTML = `
                <div class="alert alert-warning">
                    No se pudo cargar la ubicación. Valor recibido: "${coordsStr || 'vacío'}"
                </div>
            `;
            return;
        }
        
        // 3. Crear mapa
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: centerCoords,
            zoom: 15
        });

        // 4. Variables para controlar el GPS
        let watchingPosition = false;
        let currentPosition = null;
        let userMarker = null;

        // 5. Función para actualizar la posición del usuario
        function updateUserPosition(position) {
            currentPosition = position;
            
            // Crear o actualizar el marcador del usuario
            if (!userMarker) {
                // Crear elemento personalizado para el punto azul
                const el = document.createElement('div');
                el.className = 'user-location-marker';
                el.innerHTML = '<div class="user-location-dot"></div>';
                
                userMarker = new mapboxgl.Marker(el)
                    .setLngLat([position.coords.longitude, position.coords.latitude])
                    .addTo(map);
            } else {
                userMarker.setLngLat([position.coords.longitude, position.coords.latitude]);
            }
            
            // Mover el mapa manteniendo el zoom
            map.flyTo({
                center: [position.coords.longitude, position.coords.latitude],
                zoom: 15,
                essential: true,
                speed: 0.8
            });
        }

        // 6. Configurar geolocalización
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

        // 7. Botón personalizado para geolocalización
        const geoButton = document.createElement('button');
        geoButton.className = 'mapboxgl-ctrl-geolocate';
        geoButton.innerHTML = '<i class="fas fa-location-arrow"></i>';
        geoButton.title = 'Centrar en mi ubicación actual';
        geoButton.addEventListener('click', function() {
            geolocate.trigger();
        });

        // 8. Añadir controles al mapa
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

        // 9. Cargar marcadores
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
                
                usuariosData.forEach(function(usuario) {
                    try {
                        const [longitud, latitud] = usuario.coords.split(',').map(Number);
                        if (isNaN(longitud) || isNaN(latitud)) return;

                        const markerElement = document.createElement('div');
                        markerElement.className = 'user-marker-container';
                        
                        // Verificar si es el usuario actual para mostrar "Tú"
                        const displayName = (usuario.username === currentUsername) ? 'Tú' : usuario.username;
                        const isCurrentUser = usuario.username === currentUsername;
                        
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
                                    <a href="/perfil/${usuario.username}" class="btn btn-sm btn-primary">
                                        Ver perfil
                                    </a>
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