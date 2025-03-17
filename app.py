from flask import Flask, render_template, request, jsonify
import sqlite3
from geopy.geocoders import Nominatim
import requests
import os

app = Flask(__name__)
geolocator = Nominatim(user_agent="ruta_optima")

def get_db_connection():
    conn = sqlite3.connect('paradas.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_coordinates(direccion):
    location = geolocator.geocode(direccion)
    return (location.latitude, location.longitude) if location else (None, None)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/agregar_parada', methods=['POST'])
def agregar_parada():
    data = request.form
    latitud, longitud = get_coordinates(data['direccion'])
    if latitud is None or longitud is None:
        return jsonify({"status": "error", "message": "Dirección no válida"}), 400

    conn = get_db_connection()
    conn.execute("INSERT INTO paradas (nombre, apellidos, correo, telefono, direccion, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?)",
                 (data['nombre'], data['apellidos'], data['correo'], data['telefono'], data['direccion'], latitud, longitud))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "latitud": latitud, "longitud": longitud})

@app.route('/obtener_paradas')
def obtener_paradas():
    conn = get_db_connection()
    paradas = conn.execute("SELECT * FROM paradas").fetchall()
    conn.close()
    return jsonify([dict(parada) for parada in paradas])

@app.route('/calcular_ruta_optima')
def calcular_ruta_optima():
    ubicacion_actual = request.args.get('ubicacion_actual')
    if not ubicacion_actual:
        return jsonify({"status": "error", "message": "Ubicación actual no proporcionada"}), 400

    lat_actual, lon_actual = map(float, ubicacion_actual.split(','))
    conn = get_db_connection()
    paradas = conn.execute("SELECT * FROM paradas").fetchall()
    conn.close()

    if not paradas:
        return jsonify({"status": "error", "message": "Se necesita al menos una parada para calcular la ruta"}), 400

    def calcular_distancia(origen, destino):
        url = f"http://router.project-osrm.org/route/v1/driving/{origen[1]},{origen[0]};{destino[1]},{destino[0]}?overview=false"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            return data['routes'][0]['distance'], data['routes'][0]['duration']
        return float('inf'), float('inf')

    paradas_ordenadas = sorted(paradas, key=lambda parada: calcular_distancia((lat_actual, lon_actual), (parada['latitud'], parada['longitud']))[0])

    siguiente_parada = paradas_ordenadas[0]
    distancia, duracion = calcular_distancia((lat_actual, lon_actual), (siguiente_parada['latitud'], siguiente_parada['longitud']))

    puntos = [(lat_actual, lon_actual)] + [(parada['latitud'], parada['longitud']) for parada in paradas_ordenadas]
    coordenadas = ";".join([f"{punto[1]},{punto[0]}" for punto in puntos])
    url = f"http://router.project-osrm.org/route/v1/driving/{coordenadas}?overview=full&geometries=geojson"

    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        ruta = [[coord[1], coord[0]] for coord in data['routes'][0]['geometry']['coordinates']]
        return jsonify({
            "status": "success",
            "ruta": ruta,
            "duracion_total": data['routes'][0]['duration'],
            "distancia_total": data['routes'][0]['distance'],
            "siguiente_parada": {
                "nombre": siguiente_parada['nombre'],
                "apellidos": siguiente_parada['apellidos'],
                "correo": siguiente_parada['correo'],
                "telefono": siguiente_parada['telefono'],
                "direccion": siguiente_parada['direccion'],
                "distancia": distancia,
                "duracion": duracion
            },
            "orden_paradas": [dict(parada) for parada in paradas_ordenadas]
        })
    return jsonify({"status": "error", "message": "No se pudo calcular la ruta"}), 500

@app.route('/eliminar_parada/<int:id>', methods=['DELETE'])
def eliminar_parada(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM paradas WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))