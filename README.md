<div align="center">

# 🍔 Towskan - Comida Rápida Gourmet

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript ES6+](https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Bootstrap 5](https://img.shields.io/badge/Bootstrap_5.3-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**Plataforma web moderna y responsiva de comida rápida gourmet ("Towskan"), diseñada bajo estándares Mobile-First, accesibilidad WCAG y módulos Vanilla JavaScript de alto rendimiento.**

[Explorar Menú](#-características-principales) • [Ver Estructura](#-estructura-del-proyecto) • [Instalación Local](#-ejecución-en-local) • [Despliegue en GitHub Pages](#-despliegue-en-github-pages)

---

</div>

## 📌 Descripción del Proyecto

**Towskan** es una aplicación web frontend para una hamburguesería y restaurante de comida rápida gourmet. Combina la velocidad de atención de la comida rápida con la elegancia y calidad visual de un restaurante de alta cocina.

La arquitectura fue refactorizada a estándares de producción profesional utilizando **Vanilla HTML5 semántico**, **CSS3 modular con variables de diseño** y **JavaScript moderno (ES6+ Modules)** sin dependencias de frameworks pesados, garantizando tiempos de carga ultrarrápidos y una experiencia de usuario fluida.

---

## 🚀 Características Principales

### 📱 1. Experiencia Mobile-First & UI/UX
- **Diseño 100% Responsivo:** Optimizado para smartphones, tablets y pantallas de escritorio.
- **Zonas Táctiles Accesibles:** Botones, inputs y enlaces con un tamaño mínimo de **44x44px** cumpliendo los lineamientos táctiles de iOS y Android.
- **Badge Dinámico del Carrito:** Contador flotante en tiempo real ubicado en la barra de navegación que se actualiza al instante con animaciones sutiles.
- **Formateador de Moneda Local:** Implementación con la API nativa `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' })` para mostrar precios colombianos correctos (ej. `$ 18.000`).

### 🛒 2. Carrito de Compras & Persistencia Segura
- **Manejo Seguro de `localStorage`:** Lecturas y escrituras blindadas con bloques `try/catch` y valores por defecto para prevenir fallos por almacenamiento corrupto o modo incógnito restringido.
- **Eventos Personalizados:** Despacho de eventos `towskan:cart-updated` que sincronizan en tiempo real todas las vistas y componentes abiertos.
- **Cálculo Financiero Transparente:** Desglose automático de Subtotal, Impuesto al Consumo en Restaurantes (8%), y Costo de Envío dinámico (con umbral de envío gratis).

### 💬 3. Modo Restaurante & Checkout vía WhatsApp
- **Confirmación Inmediata por WhatsApp:** Genera un mensaje formateado con viñetas, emojis y resumen codificado con `encodeURIComponent` listo para enviar al número del restaurante (`https://wa.me/573001234567?text=...`).
- **Simulador de Pagos Multicanal:**
  - **Tarjeta Débito/Crédito:** Máscara visual automática en formato `XXXX XXXX XXXX XXXX`, detección de marca (Visa, Mastercard, Amex), validación de fecha de vencimiento (`MM/AA`) y CVV.
  - **Billeteras Digitales:** Selector rápido de **Nequi** y **Daviplata** con validación de celular colombiano (10 dígitos).
  - **Pago Contra Entrega:** Opciones para pago en efectivo al recibir.

### 🛡️ 4. Seguridad, Notificaciones y Accesibilidad
- **Sin `alert()` ni `confirm()` nativos:** Sistema propio y elegante de **Toasts/Snackbars** con animaciones CSS y modales accesibles para confirmaciones críticas.
- **Prevención de Ataques XSS:** Inserción protegida mediante `.textContent`, métodos de creación DOM seguros y sanitización básica para datos de usuario.
- **Validación de Formularios en Vivo:** Alertas inline debajo de cada campo con soporte para lectores de pantalla mediante atributos `aria-invalid`.
- **Cifrado Web Crypto:** Hash SHA-256 nativo del navegador para credenciales en la demostración de login/registro.

---

## 📂 Estructura del Proyecto

```plaintext
towskan/
├── assets/
│   ├── css/
│   │   ├── main.css           # Variables de diseño, navbar, footer, toasts y modales
│   │   ├── style.css          # Estilos de la portada principal (Hero, favoritos, por qué)
│   │   ├── menu.css           # Estilos del menú, filtros y carrito lateral
│   │   ├── pedidos.css        # Vista de bolsa de compra y extras upsell
│   │   ├── pago.css           # Formulario de checkout, métodos y tarjetas
│   │   ├── sesion.css         # Estilos de inicio de sesión con paleta corporativa
│   │   ├── registro.css       # Estilos de creación de cuenta y términos
│   │   └── servicios.css      # Centro de soporte, buscador y preguntas frecuentes
│   ├── img/
│   │   ├── bebidas.jpg
│   │   ├── elcielo-restaurant-bogota.jpg
│   │   ├── hamburguesa.jpg
│   │   ├── patatas-fritas.jpg
│   │   └── salsa-barbacoa.avif
│   └── js/
│       ├── app.js             # Inicializador global y sincronizador de sesión
│       ├── cart.js            # Lógica del carrito, cálculos y almacenamiento seguro
│       ├── checkout.js        # Máscaras de pago, validación y pedidos por WhatsApp
│       ├── auth.js            # Registro, inicio de sesión y cifrado SHA-256
│       └── ui.js              # Toasts, modales personalizados, formateador COP
├── .gitignore                 # Exclusión de archivos de sistema e IDEs
├── index.html                 # Portada principal definitiva unificada
├── menu.html                  # Catálogo de productos interactivo
├── pedidos.html               # Resumen del pedido y carrito ampliado
├── pago.html                  # Pasarela simulada y checkout
├── login.html                 # Inicio de sesión estilizado
├── registro.html              # Registro de nuevos usuarios
├── servicio.html              # Centro de atención y preguntas frecuentes
└── README.md                  # Documentación profesional del proyecto
```

---

## 💻 Ejecución en Local

No necesitas instalar Node.js ni compiladores pesados para probar o desarrollar este proyecto:

### Opción 1: Con Python (Recomendado)
Abre una terminal en la raíz del proyecto y ejecuta:

```bash
# Python 3
python -m http.server 8000
```
Luego abre tu navegador en: [http://localhost:8000](http://localhost:8000)

### Opción 2: Con VS Code (Live Server)
1. Instala la extensión **Live Server** en Visual Studio Code.
2. Haz clic derecho sobre `index.html` y selecciona **"Open with Live Server"**.

### Opción 3: Con Node.js / npx
```bash
npx serve .
```

---

## 🌐 Despliegue en GitHub Pages

Para publicar este proyecto gratuitamente en **GitHub Pages**:

1. Sube el repositorio a tu cuenta de GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: modernizacion frontend y ui/ux de Towskan"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/towskan.git
   git push -u origin main
   ```
2. En GitHub, ve a la pestaña **Settings** (Configuración) de tu repositorio.
3. En la barra lateral izquierda, selecciona **Pages**.
4. En **Build and deployment > Source**, selecciona `Deploy from a branch`.
5. Elige la rama `main` y la carpeta `/ (root)`, luego haz clic en **Save**.
6. En un par de minutos, tu sitio estará en línea en:
   `https://TU-USUARIO.github.io/towskan/`

---

## 📝 Buenas Prácticas Implementadas

- **Nomenclatura Estandarizada:** Nombre de marca homogéneo **"Towskan"** en títulos, pie de página, textos y metadatos.
- **Rutas Relativas Portables:** Todos los enlaces y recursos estáticos (`assets/css/`, `assets/img/`, `assets/js/`) funcionan sin importar el subdirectorio de despliegue.
- **Semántica HTML5 Completa:** Uso adecuado de etiquetas `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>` y `<footer>`.
- **Compatibilidad Hacia Atrás:** Soporte en memoria para leer registros de `localStorage` de versiones previas (`carritoTouskan`, `usuarioTouskan`).

---

<div align="center">
  <sub>Desarrollado con ❤️ para <strong>Towskan Gourmet</strong> • 2026</sub>
</div>
