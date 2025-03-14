const map = L.map('map').setView([0, 0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let ubicacionActualMarker = null; // Marcador de la ubicación actual
let ubicacionActualCoords = null; // Coordenadas de la ubicación actual
let calculandoRuta = false;
const UMBRAL_DISTANCIA = 0.01; // 10 metros

// Función para obtener la ubicación en tiempo real
function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const nuevaUbicacion = [latitude, longitude];

                // Verificar si la ubicación ha cambiado significativamente
                if (!ubicacionActualCoords || distanciaEntreCoords(ubicacionActualCoords, nuevaUbicacion) > UMBRAL_DISTANCIA) {
                    ubicacionActualCoords = nuevaUbicacion;
                    console.log("Nueva ubicación:", ubicacionActualCoords); // Log para verificar la ubicación

                    // Centrar el mapa en la ubicación actual
                    map.setView(ubicacionActualCoords, 13);

                    // Crear o actualizar el marcador de la ubicación actual
                    if (ubicacionActualMarker) {
                        ubicacionActualMarker.setLatLng(ubicacionActualCoords);
                    } else {
                        ubicacionActualMarker = L.marker(ubicacionActualCoords).addTo(map)
                            .bindPopup('Tu ubicación actual')
                            .openPopup();
                    }

                    // Recalcular la ruta si hay paradas y no se está calculando otra ruta
                    if (document.getElementById('lista-paradas').children.length > 0 && !calculandoRuta) {
                        calcularRutaOptima();
                    }
                }
            },
            (error) => {
                console.error("Error al obtener la ubicación:", error);
                alert("No se pudo obtener la ubicación. Asegúrate de permitir el acceso a la ubicación.");
            },
            {
                enableHighAccuracy: true, // Mayor precisión
                timeout: 5000, // Tiempo máximo de espera
                maximumAge: 0 // No usar ubicaciones en caché
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

// Función para calcular la distancia entre dos coordenadas (en kilómetros)
function distanciaEntreCoords(coord1, coord2) {
    const [lat1, lon1] = coord1;
    const [lat2, lon2] = coord2;
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en km
}

// Función para calcular la ruta óptima
function calcularRutaOptima() {
    if (!ubicacionActualCoords) {
        alert("Esperando la ubicación actual...");
        return;
    }

    if (calculandoRuta) {
        return;
    }
    calculandoRuta = true;

    const ubicacionActual = `${ubicacionActualCoords[0]},${ubicacionActualCoords[1]}`;
    fetch(`/calcular_ruta_optima?ubicacion_actual=${ubicacionActual}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Limpiar solo las polilíneas y los marcadores de las paradas (no el marcador de la ubicación actual)
                map.eachLayer(layer => {
                    if (layer instanceof L.Polyline || (layer instanceof L.Marker && layer !== ubicacionActualMarker)) {
                        map.removeLayer(layer);
                    }
                });

                // Dibujar la nueva ruta en el mapa
                const ruta = data.ruta;
                L.polyline(ruta, { color: 'blue' }).addTo(map);

                // Mostrar el tiempo total y la distancia
                const tiempoTotal = (data.duracion_total / 60).toFixed(2);
                const distanciaTotal = (data.distancia_total / 1000).toFixed(2);
                document.getElementById('tiempo-total').textContent = `${tiempoTotal} minutos`;
                document.getElementById('distancia-total').textContent = `${distanciaTotal} km`;

                // Mostrar el tiempo y la distancia hasta la siguiente parada
                const siguienteParada = data.siguiente_parada;
                const tiempoSiguienteParada = (siguienteParada.duracion / 60).toFixed(2);
                const distanciaSiguienteParada = (siguienteParada.distancia / 1000).toFixed(2);
                document.getElementById('siguiente-parada').innerHTML = `
                    <p><strong>Próxima parada:</strong> ${siguienteParada.nombre} ${siguienteParada.apellidos}</p>
                    <p><strong>Distancia:</strong> ${distanciaSiguienteParada} km</p>
                    <p><strong>Tiempo estimado:</strong> ${tiempoSiguienteParada} minutos</p>
                `;

                // Mostrar el orden de las paradas
                const ordenParadas = document.getElementById('orden-paradas').getElementsByTagName('tbody')[0];
                ordenParadas.innerHTML = '';
                data.orden_paradas.forEach((parada, index) => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${parada.nombre}</td>
                        <td>${parada.apellidos}</td>
                        <td>${parada.correo}</td>
                        <td>${parada.telefono}</td>
                        <td>${parada.direccion}</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="eliminarParada(${parada.id})">Eliminar</button>
                        </td>
                    `;
                    ordenParadas.appendChild(fila);
                });

                // Añadir marcadores de las paradas en el mapa
                data.orden_paradas.forEach((parada, index) => {
                    L.marker([parada.latitud, parada.longitud]).addTo(map)
                        .bindPopup(`Parada ${index + 1}: ${parada.nombre} ${parada.apellidos}`);
                });
            } else {
                alert("Error al calcular la ruta");
            }
        })
        .catch((error) => {
            console.error("Error al calcular la ruta:", error);
            alert("Error al calcular la ruta. Inténtalo de nuevo.");
        })
        .finally(() => {
            calculandoRuta = false;
        });
}

// Función para manejar el envío del formulario de agregar parada
document.getElementById('form-parada').addEventListener('submit', function (e) {
    e.preventDefault();
    const formData = new FormData(this);

    fetch('/agregar_parada', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Limpiar el formulario
            this.reset();
            // Actualizar la lista de paradas
            obtenerParadas();
            // Recalcular la ruta
            calcularRutaOptima();
        } else {
            alert("Error al agregar la parada");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error al agregar la parada");
    });
});

// Función para obtener y mostrar las paradas actuales
function obtenerParadas() {
    fetch('/obtener_paradas')
        .then(response => response.json())
        .then(data => {
            const listaParadas = document.getElementById('lista-paradas');
            listaParadas.innerHTML = '';
            data.forEach(parada => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = `${parada.nombre} ${parada.apellidos} - ${parada.direccion}`;
                listaParadas.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error al obtener las paradas:", error);
        });
}

// Función para eliminar una parada
function eliminarParada(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta parada?")) {
        fetch(`/eliminar_parada/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Actualizar la lista de paradas
                obtenerParadas();
                // Recalcular la ruta
                calcularRutaOptima();
            } else {
                alert("Error al eliminar la parada");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error al eliminar la parada");
        });
    }
}

// Recalcular la ruta cada 10 segundos
setInterval(() => {
    if (ubicacionActualCoords && document.getElementById('lista-paradas').children.length > 0) {
        calcularRutaOptima();
    }
}, 10000);

// Llamar a obtenerParadas al cargar la página
document.addEventListener('DOMContentLoaded', obtenerParadas);

// Asignar la función al botón de calcular ruta
document.getElementById('calcular-ruta').addEventListener('click', calcularRutaOptima);

// Iniciar la obtención de la ubicación
obtenerUbicacion();