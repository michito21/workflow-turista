// Inicializar el mapa
const map = L.map('map').setView([0, 0], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

// Ajustar el tamaño del mapa al cambiar el tamaño de la ventana
window.addEventListener('resize', () => {
    map.invalidateSize();
});

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
                li.className = 'list-group-item';
                li.textContent = `${parada[0]} ${parada[1]} - ${parada[4]}`;
                listaParadas.appendChild(li);
            });
        });
}

// Agregar una nueva parada
document.getElementById('form-parada').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    fetch('/agregar_parada', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            cargarParadas();
        }
    });
});

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
                document.getElementById('tiempo-total').textContent = `${tiempoTotal} minutos`;
                document.getElementById('distancia-total').textContent = `${distanciaTotal} km`;

                // Mostrar el tiempo y la distancia hasta la siguiente parada
                const siguienteParada = data.siguiente_parada;
                const tiempoSiguienteParada = (siguienteParada.duracion / 60).toFixed(2); // Convertir a minutos
                const distanciaSiguienteParada = (siguienteParada.distancia / 1000).toFixed(2); // Convertir a kilómetros
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
                        <td>${parada[0]}</td>
                        <td>${parada[1]}</td>
                        <td>${parada[2]}</td>
                        <td>${parada[3]}</td>
                        <td>${parada[4]}</td>
                        <td>
                            <button class="btn btn-danger btn-sm" onclick="eliminarParada(${parada[5]})">Eliminar</button>
                            <button class="btn btn-warning btn-sm" onclick="editarParada(${parada[5]})">Editar</button>
                        </td>
                    `;
                    ordenParadas.appendChild(fila);
                });

                // Añadir marcadores de las paradas en el mapa
                data.orden_paradas.forEach((parada, index) => {
                    L.marker([parada[5], parada[6]]).addTo(map)
                        .bindPopup(`Parada ${index + 1}: ${parada[0]} ${parada[1]}`);
                });
            } else {
                alert("Error al calcular la ruta");
            }
        });
});

// Cargar las paradas al iniciar
cargarParadas();

//##################################################################################
// Eliminar una parada
function eliminarParada(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta parada?")) {
        fetch(`/eliminar_parada/${id}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                cargarParadas();
            }
        });
    }
}

// Editar una parada
function editarParada(id) {
    // Aquí puedes implementar la lógica para editar una parada
    alert(`Editar parada con ID: ${id}`);
}