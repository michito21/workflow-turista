# Workflow Turista - Aplicación Web

## Tecnologías
- **Python**
- **Flask**
- **Leaflet**
- **Bootstrap**

## Descripción
Aplicación web que permite establecer paradas y calcular la ruta más óptima para llegar a todas las paradas establecidas, utilizando Flask, SQLite y herramientas de código abierto como Leaflet y OSRM. La aplicación también incluye un buscador de direcciones y muestra el tiempo y la distancia estimados entre paradas.

## Características
- **Cálculo de ruta óptima:** Usa el algoritmo del vecino más cercano para calcular la ruta más corta.
- **Ubicación en tiempo real:** Utiliza la geolocalización del navegador para calcular rutas desde tu ubicación actual.
- **Buscador de direcciones:** Integra un buscador de direcciones similar a Google Maps.
- **Interfaz responsiva:** Diseño adaptado para dispositivos móviles y de escritorio.
- **Gestión de paradas:** Permite agregar, eliminar y editar paradas.

## Requisitos
- Python 3.8 o superior.
- Flask.
- SQLite3.
- Bibliotecas de Python: `flask`, `sqlite3`, `requests`, `geopy`, `folium`.

## Instalación
Sigue estos pasos para configurar el proyecto en tu máquina local:

1. Clona el repositorio:
    ```bash
    git clone https://github.com/michito21/workflow-turista.git
    cd workflow-turista
    ```

2. Crea un entorno virtual (opcional pero recomendado):
    ```bash
    python -m venv venv
    source venv/bin/activate  # En Windows: venv\Scripts\activate
    ```

3. Instala las dependencias:
    ```bash
    pip install -r requirements.txt
    ```

4. Inicializa la base de datos:
    ```bash
    python database.py
    ```

5. Ejecuta la aplicación:
    ```bash
    python app.py
    ```

6. Abre la aplicación en tu navegador:
   Visita `http://127.0.0.1:5000/`.

## Uso
### Agregar paradas:
- Completa el formulario con el nombre, apellidos, correo, teléfono y dirección de la parada.
- Haz clic en "Agregar Parada".

### Calcular ruta óptima:
- Haz clic en "Calcular Ruta Óptima" para obtener la ruta más corta desde tu ubicación actual hasta las paradas.

### Ver detalles de la ruta:
- La aplicación mostrará el tiempo total, la distancia total y el tiempo estimado hasta la siguiente parada.
- El mapa mostrará la ruta optimizada y los marcadores de las paradas.

### Eliminar o editar paradas:
- Usa los botones "Eliminar" o "Editar" en la tabla de paradas para gestionarlas.

## Estructura del Proyecto
- **app.py:** Contiene la lógica del backend (Flask).
- **database.py:** Inicializa la base de datos SQLite.
- **static/:** Contiene archivos estáticos (CSS, JavaScript).
- **templates/:** Contiene las plantillas HTML.

## Tecnologías Utilizadas
### Frontend:
- HTML, CSS, JavaScript.
- Bootstrap para el diseño responsivo.
- Leaflet para la visualización de mapas.

### Backend:
- Flask para el servidor web.
- SQLite para la base de datos.
- OSRM para el cálculo de rutas.

### APIs:
- OpenStreetMap Nominatim para la geocodificación de direcciones.
- OSRM para el cálculo de rutas.

## Contribución
¡Las contribuciones son bienvenidas! Si deseas mejorar este proyecto, sigue estos pasos:

1. Haz un fork del repositorio.
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`).
3. Realiza tus cambios y haz commit (`git commit -m 'Agrega nueva funcionalidad'`).
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`).
5. Abre un Pull Request.

## Licencia
Este proyecto está bajo la licencia MIT. Consulta el archivo LICENSE para más detalles.

## Autor
Michael Paz - [GitHub](https://github.com/michito21)

## Agradecimientos
- A la comunidad de OpenStreetMap por proporcionar datos geográficos gratuitos.
- A Leaflet por la librería de mapas interactivos.
- A Bootstrap por el diseño responsivo.