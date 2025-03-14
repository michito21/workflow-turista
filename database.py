import sqlite3

def init_db():
    conn = sqlite3.connect('paradas.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS paradas
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  nombre TEXT,
                  direccion TEXT,
                  latitud REAL,
                  longitud REAL)''')
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()