// Inicializar el mapa
const map = L.map('map').setView([0, 0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Variable para almacenar el marcador de la ubicación actual
let ubicacionActualMarker = null;
let ubicacionActualCoords = null;

// Obtener la ubicación en tiempo real
navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    ubicacionActualCoords = [latitude, longitude];
    map.setView(ubicacionActualCoords, 13);

    // Crear o actualizar el marcador de la ubicación actual
    if (ubicacionActualMarker) {
        ubicacionActualMarker.setLatLng(ubicacionActualCoords);
    } else {
        ubicacionActualMarker = L.marker(ubicacionActualCoords).addTo(map)
            .bindPopup('Tu ubicación actual')
            .openPopup();
    }
}, (error) => {
    console.error("Error al obtener la ubicación:", error);
});

// Función para cargar las paradas
function cargarParadas() {
    fetch('/obtener_paradas')
        .then(response => response.json())
        .then(paradas => {
            const listaParadas = document.getElementById('lista-paradas');
            listaParadas.innerHTML = '';
            paradas.forEach(parada => {
                const li = document.createElement('li');
                li.textContent = `${parada[0]} (${parada[1]}, ${parada[2]})`;
                listaParadas.appendChild(li);
            });

            // Eliminar solo los marcadores de las paradas (no el de la ubicación actual)
            map.eachLayer(layer => {
                if (layer instanceof L.Marker && layer !== ubicacionActualMarker) {
                    map.removeLayer(layer);
                }
            });

            // Dibujar las paradas en el mapa
            paradas.forEach(parada => {
                L.marker([parada[1], parada[2]]).addTo(map)
                    .bindPopup(parada[0]);
            });
        });
}

// Calcular la ruta óptima
document.getElementById('calcular-ruta').addEventListener('click', () => {
    if (!ubicacionActualCoords) {
        alert("Esperando la ubicación actual...");
        return;
    }

    // Enviar la ubicación actual al backend
    const ubicacionActual = `${ubicacionActualCoords[0]},${ubicacionActualCoords[1]}`;
    fetch(`/calcular_ruta_optima?ubicacion_actual=${ubicacionActual}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Dibujar la ruta en el mapa
                const ruta = data.ruta;
                L.polyline(ruta, { color: 'blue' }).addTo(map);

                // Mostrar el tiempo total y la distancia
                const tiempoTotal = (data.duracion_total / 60).toFixed(2); // Convertir a minutos
                const distanciaTotal = (data.distancia_total / 1000).toFixed(2); // Convertir a kilómetros
                document.getElementById('tiempo-total').textContent = `Tiempo total: ${tiempoTotal} minutos`;
                document.getElementById('distancia-total').textContent = `Distancia total: ${distanciaTotal} km`;

                // Mostrar el tiempo hasta la próxima parada
                if (data.tiempos_entre_paradas && data.tiempos_entre_paradas.length > 0) {
                    const tiempoProximaParada = (data.tiempos_entre_paradas[0] / 60).toFixed(2); // Convertir a minutos
                    document.getElementById('tiempo-proxima-parada').textContent = `Tiempo hasta la próxima parada: ${tiempoProximaParada} minutos`;
                } else {
                    document.getElementById('tiempo-proxima-parada').textContent = "No hay tiempos disponibles para las paradas.";
                }
            } else {
                alert("Error al calcular la ruta");
            }
        });
});

// Cargar las paradas al iniciar
cargarParadas();