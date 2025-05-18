document.addEventListener('DOMContentLoaded', function() {
    // Configuración inicial del token (IMPORTANTE que vaya primero)
    mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';
    
    // Control de login (tu código existente)
    const mapLoginBtn = document.getElementById('mapLoginBtn');
    if (mapLoginBtn) {
        mapLoginBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
        });
    }

    // Verificar sesión y mostrar mapa
    const sessionData = localStorage.getItem('usuarioActivo');
    if (sessionData) {
        document.getElementById('mapLoginOverlay').style.display = 'none';
        document.getElementById('realMap').style.display = 'block';
        initMap();
    }

    // Función principal del mapa
    function initMap() {
        // Obtener coordenadas del usuario actual
        let centerCoords = [-71.542969, -33.015347]; // Default Chile
        
        try {
            const usuarioActualData = document.getElementById('usuario-actual-data').textContent.trim();
            if (usuarioActualData) {
                const usuarioActual = JSON.parse(usuarioActualData);
                if (usuarioActual.coords) {
                    const [lng, lat] = usuarioActual.coords.split(',').map(Number);
                    if (!isNaN(lng) && !isNaN(lat)) {
                        centerCoords = [lng, lat];
                    }
                }
            }
        } catch(e) {
            console.warn('Error leyendo coordenadas usuario actual:', e);
        }
        
        const map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: centerCoords,
            zoom: 15,
            dragRotate: false,
            touchZoomRotate: false
        });

        // Añadir controles al mapa
        map.addControl(new mapboxgl.NavigationControl());
        
        // Configurar geolocalización CON comportamiento controlado
        const geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: false,
            showUserLocation: true,
            showAccuracyCircle: false,
            fitBoundsOptions: {
                maxZoom: 10
            }
        });
        map.addControl(geolocate);

        // Evento cuando el mapa se carga completamente
        map.on('load', function() {
            // 1. Primero cargar marcadores
            loadUserMarkers(map);
            
            // 2. Luego manejar la geolocalización manualmente
            setTimeout(() => {
                geolocate.trigger();
                
                geolocate.on('geolocate', function(e) {
                    map.flyTo({
                        center: [e.coords.longitude, e.coords.latitude],
                        zoom: 15,
                        essential: true
                    });
                });
            }, 1000);
        });

        // Función para cargar marcadores
        function loadUserMarkers(map) {
            try {
                const usuariosData = JSON.parse(document.getElementById('usuarios-data').textContent || '[]');
                
                // Crear marcadores para todos los usuarios
                usuariosData.forEach(function(usuario) {
                    try {
                        const [longitud, latitud] = usuario.coords.split(',').map(Number);
                        if (isNaN(longitud) || isNaN(latitud)) return;

                        const markerElement = document.createElement('div');
                        markerElement.className = 'user-marker';
                        markerElement.innerHTML = '<i class="fas fa-user"></i>';
                        
                        new mapboxgl.Marker(markerElement)
                            .setLngLat([longitud, latitud])
                            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
                                <div style="padding:10px;min-width:200px;">
                                    <h6>${usuario.username}</h6>
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
