// assets/js/api.js
const API_URL = "http://127.0.0.1:5000/api";

const TowskanAPI = {
    // 1. Obtener menú desde MySQL
    async obtenerProductos() {
        try {
            const res = await fetch(`${API_URL}/productos`);
            const data = await res.json();
            return data.ok ? data.productos : [];
        } catch (err) {
            console.warn("Backend no disponible, usando fallback local:", err);
            return [];
        }
    },

    // 2. Guardar un pedido en MySQL
    async enviarPedido(pedidoData) {
        try {
            const res = await fetch(`${API_URL}/pedidos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pedidoData)
            });
            return await res.json();
        } catch (err) {
            return { ok: false, error: "No se pudo conectar con el servidor" };
        }
    },

    // 3. Login de usuario
    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            return await res.json();
        } catch (err) {
            return { ok: false, error: "Error de red" };
        }
    },

    // 4. Registro de usuario
    async registro(usuario) {
        try {
            const res = await fetch(`${API_URL}/auth/registro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(usuario)
            });
            return await res.json();
        } catch (err) {
            return { ok: false, error: "Error de red" };
        }
    }
};