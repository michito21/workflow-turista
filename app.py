from flask import Flask, render_template, request, jsonify
import sqlite3
from geopy.geocoders import Nominatim
import folium
import requests
import networkx as nx
from networkx.algorithms.approximation import christofides

app = Flask(__name__)

# Inicializar geocoder
geolocator = Nominatim(user_agent="ruta_optima")

def get_coordinates(direccion):
    location = geolocator.geocode(direccion)
    return (location.latitude, location.longitude)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/agregar_parada', methods=['POST'])
def agregar_parada():
    nombre = request.form['nombre']
    apellidos = request.form['apellidos']
    correo = request.form['correo']
    telefono = request.form['telefono']
    direccion = request.form['direccion']
    latitud, longitud = get_coordinates(direccion)
    
    conn = sqlite3.connect('paradas.db')
    c = conn.cursor()
    c.execute("INSERT INTO paradas (nombre, apellidos, correo, telefono, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)",
              (nombre, apellidos, correo, telefono, direccion, latitud, longitud))
    conn.commit()
    conn.close()
    
    return jsonify({"status": "success", "latitud": latitud, "longitud": longitud})

@app.route('/obtener_paradas')
def obtener_paradas():
    conn = sqlite3.connect('paradas.db')
    c = conn.cursor()
    c.execute("SELECT nombre, apellidos, correo, telefono, direccion, latitud, longitud FROM paradas")
    paradas = c.fetchall()
    conn.close()
    
    return jsonify(paradas)

@app.route('/calcular_ruta_optima')
def calcular_ruta_optima():
    # Obtener la ubicación actual (simulada o desde el frontend)
    ubicacion_actual = request.args.get('ubicacion_actual')
    if not ubicacion_actual:
        return jsonify({"status": "error", "message": "Ubicación actual no proporcionada"})

    lat_actual, lon_actual = map(float, ubicacion_actual.split(','))

    # Obtener las paradas desde la base de datos
    conn = sqlite3.connect('paradas.db')
    c = conn.cursor()
    c.execute("SELECT nombre, apellidos, correo, telefono, direccion, latitud, longitud FROM paradas")
    paradas = c.fetchall()
    conn.close()

    # Verificar que haya al menos una parada
    if len(paradas) < 1:
        return jsonify({"status": "error", "message": "Se necesita al menos una parada para calcular la ruta"})

    # Calcular la distancia entre la ubicación actual y cada parada
    def calcular_distancia(origen, destino):
        url = f"http://router.project-osrm.org/route/v1/driving/{origen[1]},{origen[0]};{destino[1]},{destino[0]}?overview=false"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data['routes'][0]['distance']  # Distancia en metros
        else:
            return float('inf')  # Si hay un error, devolvemos infinito

    # Ordenar las paradas por distancia desde la ubicación actual
    paradas_ordenadas = sorted(
        paradas,
        key=lambda parada: calcular_distancia((lat_actual, lon_actual), (parada[5], parada[6]))
    )

    # Crear una lista de coordenadas para la ruta (ubicación actual + paradas ordenadas)
    puntos = [(lat_actual, lon_actual)] + [(parada[5], parada[6]) for parada in paradas_ordenadas]

    # Formatear las coordenadas para OSRM
    coordenadas = ";".join([f"{punto[1]},{punto[0]}" for punto in puntos])
    url = f"http://router.project-osrm.org/route/v1/driving/{coordenadas}?overview=full&geometries=geojson"

    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        ruta = data['routes'][0]['geometry']['coordinates']
        duracion_total = data['routes'][0]['duration']  # Duración total en segundos
        distancia_total = data['routes'][0]['distance']  # Distancia total en metros

        # Extraer los tiempos entre paradas (duración de cada "leg")
        tiempos_entre_paradas = []
        if 'legs' in data['routes'][0]:
            for leg in data['routes'][0]['legs']:
                tiempos_entre_paradas.append(leg['duration'])  # Duración de cada tramo en segundos

        # Convertir coordenadas a formato [lat, lon]
        ruta = [[coord[1], coord[0]] for coord in ruta]

        return jsonify({
            "status": "success",
            "ruta": ruta,
            "duracion_total": duracion_total,
            "distancia_total": distancia_total,
            "tiempos_entre_paradas": tiempos_entre_paradas,
            "orden_paradas": paradas_ordenadas  # Incluir detalles de las paradas
        })
    else:
        return jsonify({"status": "error", "message": "No se pudo calcular la ruta"})

def calcular_distancia(origen, destino):
    url = f"http://router.project-osrm.org/route/v1/driving/{origen[1]},{origen[0]};{destino[1]},{destino[0]}?overview=false"
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data['routes'][0]['distance']  # Distancia en metros
    else:
        return float('inf')  # Si hay un error, devolvemos infinito

if __name__ == '__main__':
    app.run(debug=True)