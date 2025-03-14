function inicializarBuscador() {
    const inputDireccion = document.getElementById('direccion');
    const sugerencias = document.getElementById('sugerencias');

    inputDireccion.addEventListener('input', () => {
        const query = inputDireccion.value;
        if (query.length > 3) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
                .then(response => response.json())
                .then(data => {
                    sugerencias.innerHTML = '';
                    data.forEach(resultado => {
                        const opcion = document.createElement('div');
                        opcion.className = 'sugerencia';
                        opcion.textContent = resultado.display_name;
                        opcion.addEventListener('click', () => {
                            inputDireccion.value = resultado.display_name;
                            sugerencias.innerHTML = '';
                        });
                        sugerencias.appendChild(opcion);
                    });
                });
        } else {
            sugerencias.innerHTML = '';
        }
    });
}

document.addEventListener('DOMContentLoaded', inicializarBuscador);