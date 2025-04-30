
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
    let destinationMarker = null;
    let destinationPopup = null;
    const routeLayerId = 'route';

    function initMap() {
        if (map) return;

        mapboxgl.accessToken = 'pk.eyJ1IjoiY2hjYW5lbyIsImEiOiJjbThuNmZpYjQwbjBmMmpwd3M1aXc1N21vIn0.z40V0PC46BKyTYipeK4Uqw';

        // 📍 Coordenadas por defecto: Viña del Mar
        const defaultCoords = [-71.542969, -33.015347];

        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/outdoors-v12',
            center: defaultCoords,
            zoom: 12
        });

        // Agrega control de geolocalización
        geolocate = new mapboxgl.GeolocateControl({ trackUserLocation: false, showUserLocation: true });
        map.addControl(geolocate);

        geolocate.on('geolocate', (e) => {
            userLocation = [e.coords.longitude, e.coords.latitude];
            map.flyTo({ center: userLocation, zoom: 13 });
        });

        map.on('load', () => {
            geolocate.trigger();
        });

        map.on('contextmenu', (e) => {
            if (destinationMarker) destinationMarker.remove();
            if (destinationPopup) destinationPopup.remove();

            destinationMarker = new mapboxgl.Marker().setLngLat([e.lngLat.lng, e.lngLat.lat]).addTo(map);
            destinationPopup = new mapboxgl.Popup()
                .setLngLat([e.lngLat.lng, e.lngLat.lat])
                .setHTML('Libro 123 - Luis Pérez')
                .addTo(map);

            if (userLocation) {
                getDirections(userLocation, [e.lngLat.lng, e.lngLat.lat]);
            }
        });

        map.addControl(new mapboxgl.NavigationControl());
    }

    function getDirections(start, end) {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        fetch(url)
            .then(res => res.json())
            .then(data => drawRoute(data.routes[0].geometry))
            .catch(() => removeRoute());
    }

    function drawRoute(geometry) {
        removeRoute();
        map.addSource('route', {
            'type': 'geojson',
            'data': { 'type': 'Feature', 'geometry': geometry }
        });
        map.addLayer({
            'id': routeLayerId,
            'type': 'line',
            'source': 'route',
            'layout': { 'line-join': 'round', 'line-cap': 'round' },
            'paint': { 'line-color': '#3887be', 'line-width': 5 }
        });
    }

    function removeRoute() {
        if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
        if (map.getSource('route')) map.removeSource('route');
    }
});
