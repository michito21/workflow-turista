const map = L.map('map').setView([0, 0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let ubicacionActualMarker = null;
let ubicacionActualCoords = null;
let calculandoRuta = false;
const UMBRAL_DISTANCIA = 0.01;
let velocidadActual = null;

function obtenerUbicacion() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed } = position.coords;
                const nuevaUbicacion = [latitude, longitude];

                velocidadActual = speed;

                if (!ubicacionActualCoords || distanciaEntreCoords(ubicacionActualCoords, nuevaUbicacion) > UMBRAL_DISTANCIA) {
                    ubicacionActualCoords = nuevaUbicacion;
                    console.log("Nueva ubicación:", ubicacionActualCoords);

                    map.setView(ubicacionActualCoords, 13);

                    if (ubicacionActualMarker) {
                        ubicacionActualMarker.setLatLng(ubicacionActualCoords);
                    } else {
                        ubicacionActualMarker = L.marker(ubicacionActualCoords).addTo(map)
                            .bindPopup('Ubicación actual')
                            .openPopup();
                    }

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
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

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
                map.eachLayer(layer => {
                    if (layer instanceof L.Polyline || (layer instanceof L.Marker && layer !== ubicacionActualMarker)) {
                        map.removeLayer(layer);
                    }
                });

                const ruta = data.ruta;
                L.polyline(ruta, { color: 'blue' }).addTo(map);

                const siguienteParada = data.siguiente_parada;

                document.getElementById('siguiente-parada-nombre').textContent = siguienteParada.nombre;

                const ordenParadas = document.getElementById('orden-paradas').getElementsByTagName('tbody')[0];
                ordenParadas.innerHTML = '';
                data.orden_paradas.forEach((parada, index) => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${parada.nombre}</td>
                        <td>${parada.telefono}</td>
                        <td>${parada.usuario}</td>
                        <td>${parada.latitud}, ${parada.longitud}</td>
                    `;
                    ordenParadas.appendChild(fila);
                });

                data.orden_paradas.forEach((parada, index) => {
                    L.marker([parada.latitud, parada.longitud]).addTo(map)
                        .bindPopup(`<b>${parada.nombre}</b><br>${parada.distrito}`);
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
            this.reset();
            obtenerParadas();
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

function obtenerParadas() {
    fetch('/obtener_paradas')
        .then(response => response.json())
        .then(data => {
            const listaParadas = document.getElementById('lista-paradas');
            listaParadas.innerHTML = '';
            data.forEach(parada => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = `${parada.nombre} - ${parada.telefono} - ${parada.usuario} - ${parada.latitud}, ${parada.longitud}`;
                listaParadas.appendChild(li);
            });
        })
        .catch(error => {
            console.error("Error al obtener las paradas:", error);
        });
}

function eliminarParada(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta parada?")) {
        fetch(`/eliminar_parada/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                obtenerParadas();
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

setInterval(() => {
    if (ubicacionActualCoords && document.getElementById('lista-paradas').children.length > 0) {
        calcularRutaOptima();
    }
}, 10000);

document.addEventListener('DOMContentLoaded', obtenerParadas);
document.getElementById('calcular-ruta').addEventListener('click', calcularRutaOptima);
obtenerUbicacion();

