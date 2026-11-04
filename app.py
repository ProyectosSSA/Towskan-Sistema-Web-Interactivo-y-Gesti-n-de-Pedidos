import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import pooling

app = Flask(__name__)
# Permitir peticiones desde tu frontend
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuración de la base de datos MySQL (ajusta usuario y contraseña)
DB_CONFIG = {
    "host": "localhost",
    "user": "root",           # Tu usuario de MySQL (por defecto 'root' en XAMPP o local)
    "password": "",           # Tu contraseña (deja vacío "" si usas XAMPP por defecto)
    "database": "towskan_db",
    "port": 3306,
    "pool_name": "towskan_pool",
    "pool_size": 5
}

# Pool de conexiones para mayor velocidad
try:
    connection_pool = mysql.connector.pooling.MySQLConnectionPool(**DB_CONFIG)
    print(">>> Conexión exitosa al pool de MySQL")
except Exception as e:
    print(f"Error al inicializar pool MySQL: {e}")
    connection_pool = None

def get_db():
    if connection_pool:
        return connection_pool.get_connection()
    return mysql.connector.connect(**DB_CONFIG)

# Función para encriptar contraseñas
def hash_pass(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


# ==========================================
# 1. OBTENER PRODUCTOS DEL MENÚ (GET)
# ==========================================
@app.route('/api/productos', methods=['GET'])
def get_productos():
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, nombre, descripcion, precio, categoria, imagen FROM productos")
        productos = cursor.fetchall()
        cursor.close()
        return jsonify({"ok": True, "productos": productos}), 200
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


# ==========================================
# 2. CREAR UN NUEVO PEDIDO (POST)
# ==========================================
@app.route('/api/pedidos', methods=['POST'])
def crear_pedido():
    data = request.get_json()
    if not data:
        return jsonify({"ok": False, "error": "Datos no enviados"}), 400

    usuario_id = data.get("usuario_id")
    cliente_nombre = data.get("cliente_nombre", "Cliente Mostrador")
    telefono = data.get("telefono", "")
    direccion = data.get("direccion", "Recoger en tienda")
    metodo_pago = data.get("metodo_pago", "contraentrega")
    total = data.get("total", 0)
    items = data.get("items", [])

    if not items:
        return jsonify({"ok": False, "error": "El carrito está vacío"}), 400

    conn = None
    try:
        conn = get_db()
        conn.start_transaction()
        cursor = conn.cursor()

        # Insertar pedido principal
        sql_pedido = """
            INSERT INTO pedidos (usuario_id, cliente_nombre, telefono, direccion, metodo_pago, total)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql_pedido, (usuario_id, cliente_nombre, telefono, direccion, metodo_pago, total))
        pedido_id = cursor.lastrowid

        # Insertar cada plato en pedido_detalles
        sql_detalle = """
            INSERT INTO pedido_detalles (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario)
            VALUES (%s, %s, %s, %s, %s)
        """
        for it in items:
            p_id = it.get("id")
            cursor.execute(sql_detalle, (
                pedido_id,
                p_id if isinstance(p_id, int) else None,
                it.get("nombre", "Producto"),
                it.get("cantidad", 1),
                it.get("precio", 0)
            ))

        conn.commit()
        cursor.close()

        return jsonify({
            "ok": True,
            "mensaje": f"¡Pedido #{pedido_id} registrado en MySQL!",
            "pedido_id": pedido_id
        }), 201

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


# ==========================================
# 3. REGISTRO DE USUARIOS (POST)
# ==========================================
@app.route('/api/auth/registro', methods=['POST'])
def registro():
    data = request.get_json()
    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")
    telefono = data.get("telefono", "")
    direccion = data.get("direccion", "")

    if not nombre or not email or not password:
        return jsonify({"ok": False, "error": "Faltan datos obligatorios"}), 400

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM usuarios WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({"ok": False, "error": "El correo ya está registrado"}), 409

        # Guardar usuario con contraseña hasheada
        sql = """
            INSERT INTO usuarios (nombre, email, password_hash, telefono, direccion)
            VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (nombre, email, hash_pass(password), telefono, direccion))
        conn.commit()
        usuario_id = cursor.lastrowid
        cursor.close()

        return jsonify({
            "ok": True,
            "mensaje": "Usuario creado correctamente",
            "usuario": {"id": usuario_id, "nombre": nombre, "email": email}
        }), 201
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


# ==========================================
# 4. INICIO DE SESIÓN (POST)
# ==========================================
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, nombre, email, telefono, direccion FROM usuarios WHERE email = %s AND password_hash = %s",
            (email, hash_pass(password))
        )
        user = cursor.fetchone()
        cursor.close()

        if user:
            return jsonify({"ok": True, "usuario": user}), 200
        return jsonify({"ok": False, "error": "Correo o contraseña incorrectos"}), 401
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


if __name__ == '__main__':
    print("Iniciando servidor de Towskan en http://127.0.0.1:5000")
    app.run(debug=True, port=5000)