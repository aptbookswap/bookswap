
document.addEventListener('DOMContentLoaded', function () {
    // Mostrar login modal desde botón en el mapa
    const mapLoginBtn = document.getElementById('mapLoginBtn');
    if (mapLoginBtn) {
        mapLoginBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('loginModal'));
            modal.show();
        });
    }

    // Si hay sesión activa, mostrar mapa y ocultar overlay
    const sessionData = localStorage.getItem('usuarioActivo');
    if (sessionData) {
        const mapLoginOverlay = document.getElementById('mapLoginOverlay');
        const realMap = document.getElementById('realMap');

        mapLoginOverlay.style.display = 'none';
        realMap.style.display = 'block';

        // Esperar que se renderice antes de inicializar el mapa
        setTimeout(() => {
            initMap();
        }, 100);
    }

    // Mapa con Mapbox
    let map = null;
    let geolocate = null;
    let userLocation = null;

    // Función para inicializar el mapa
    function initMap() {
        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';
        
        const defaultCoords = [-71.542969, -33.015347];

        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/outdoors-v12',
            center: defaultCoords,
            zoom: 5,
            dragRotate: false,
            touchZoomRotate: false
        });
        
        geolocate = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: false
            },
            trackUserLocation: false,
            showUserLocation: true,
            showAccuracyCircle: false
        });
        map.addControl(geolocate);
        
        // Evento de geolocalización
        geolocate.on('geolocate', (e) => {
            userLocation = [e.coords.longitude, e.coords.latitude];
            map.flyTo({
                center: userLocation,
                zoom: 13,
                essential: true
            });
        });
        
        // Evento al cargar el mapa
        map.on('load', () => {
            geolocate.trigger();
        });
        
        // Evento para agregar marcadores y capturar coordenadas
        map.on('contextmenu', (e) => {
            e.preventDefault();
            
            // Coordenadas del punto donde hiciste clic derecho
            const longitude = e.lngLat.lng;
            const latitude = e.lngLat.lat;
            
            // Mostrar en consola
            console.log('Coordenadas capturadas:', {
                longitude: longitude,
                latitude: latitude
            });
            
        });
        
        // Añadir controles de navegación
        map.addControl(new mapboxgl.NavigationControl());
    }

    // Función para obtener direcciones
    function getDirections(start, end) {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}&language=es`;
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const route = data.routes[0];
                drawRoute(route.geometry);
            })
            .catch(error => {
                console.error('Error al obtener las indicaciones:', error);
                removeRoute();
            });
    }
    
    
});
