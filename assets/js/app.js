/**
 * TOWSKAN - Main Application Initializer
 * Wires together cart, UI, session rendering, page view logic
 */

import { getCart, calculateTotals, removeFromCart, updateQuantity } from './cart.js';
import { formatCOP, updateCartBadges, sanitize, showConfirm } from './ui.js';
import { getActiveSession, logoutUser } from './auth.js';
import { sendOrderWhatsApp } from './checkout.js';

/**
 * Render user session state in the Navbar
 */
function renderNavbarSession() {
    const session = getActiveSession();
    const authContainer = document.getElementById('navbarAuthSection');
    if (!authContainer) return;

    if (session && session.nombre) {
        authContainer.innerHTML = `
            <div class="dropdown d-inline-block">
                <button class="nav-user-pill dropdown-toggle border-0 bg-transparent" type="button" id="userMenuDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-person-circle text-primary"></i>
                    <span>${sanitize(session.nombre.split(' ')[0])}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="userMenuDropdown">
                    <li class="px-3 py-2 border-bottom">
                        <small class="text-muted d-block">Conectado como</small>
                        <strong class="text-truncate d-block" style="max-width: 180px;">${sanitize(session.email)}</strong>
                    </li>
                    <li><a class="dropdown-item py-2" href="pedidos.html"><i class="bi bi-receipt me-2 text-primary"></i> Mis Pedidos</a></li>
                    <li><a class="dropdown-item py-2" href="servicio.html"><i class="bi bi-headset me-2 text-primary"></i> Centro de Ayuda</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <button class="dropdown-item py-2 text-danger" id="btnLogoutSession">
                            <i class="bi bi-box-arrow-right me-2"></i> Cerrar sesión
                        </button>
                    </li>
                </ul>
            </div>
        `;

        document.getElementById('btnLogoutSession')?.addEventListener('click', logoutUser);
    } else {
        authContainer.innerHTML = `
            <li class="nav-item">
                <a class="nav-link" href="login.html">
                    <i class="bi bi-person me-1"></i> Iniciar sesión
                </a>
            </li>
            <li class="nav-item">
                <a class="btn-nav-cta" href="registro.html">
                    Registrarse
                </a>
            </li>
        `;
    }
}

/**
 * Render cart items in menu.html side panel
 */
function renderMenuCart(cart = getCart()) {
    const container = document.getElementById('cartItems');
    if (!container) return;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart text-center p-4">
                <i class="bi bi-cart3 text-muted" style="font-size: 42px;"></i>
                <p class="mt-2 mb-1 fw-bold text-dark">Tu carrito está vacío</p>
                <small class="text-muted">Selecciona un producto del menú para comenzar tu pedido.</small>
            </div>
        `;
        return;
    }

    cart.forEach((item, index) => {
        const itemTotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 1);
        const el = document.createElement('div');
        el.className = 'cart-product p-2 border-bottom d-flex align-items-center justify-content-between gap-3';
        el.innerHTML = `
            <div class="cart-product-image" style="width: 50px; height: 50px; flex-shrink: 0; border-radius: 8px; overflow: hidden;">
                <img src="${sanitize(item.imagen)}" alt="${sanitize(item.nombre)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/img/hamburguesa.jpg'">
            </div>
            <div class="cart-product-info flex-grow-1" style="min-width: 0;">
                <h6 class="mb-0 text-truncate fw-bold" style="font-size: 14px;">${sanitize(item.nombre)}</h6>
                <div class="d-flex align-items-center gap-2 mt-1">
                    <small class="text-muted">${formatCOP(item.precio)} x ${item.cantidad}</small>
                </div>
            </div>
            <div class="text-end">
                <div class="fw-bold text-primary mb-1" style="font-size: 14px;">${formatCOP(itemTotal)}</div>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-secondary btn-sm px-2 py-0" data-action="decrease" data-index="${index}">-</button>
                    <span class="px-2 py-0 small fw-bold d-flex align-items-center">${item.cantidad}</span>
                    <button type="button" class="btn btn-outline-secondary btn-sm px-2 py-0" data-action="increase" data-index="${index}">+</button>
                </div>
            </div>
        `;

        el.querySelector('[data-action="decrease"]')?.addEventListener('click', () => updateQuantity(index, -1));
        el.querySelector('[data-action="increase"]')?.addEventListener('click', () => updateQuantity(index, 1));

        container.appendChild(el);
    });
}

/**
 * Render cart items in pedidos.html full list
 */
function renderPedidosList(cart = getCart()) {
    const list = document.getElementById('listaCarrito');
    const emptyState = document.getElementById('carritoVacio');
    if (!list) return;

    list.innerHTML = '';

    if (cart.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    cart.forEach((item, index) => {
        const itemTotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 1);
        const card = document.createElement('div');
        card.className = 'product-card mb-3 p-3 bg-white rounded-3 shadow-sm border d-flex gap-3 align-items-center flex-wrap flex-sm-nowrap';

        card.innerHTML = `
            <div class="product-image rounded-2 overflow-hidden flex-shrink-0" style="width: 90px; height: 90px;">
                <img src="${sanitize(item.imagen)}" alt="${sanitize(item.nombre)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/img/hamburguesa.jpg'">
            </div>
            <div class="product-info flex-grow-1" style="min-width: 0;">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="mb-1 fw-bold text-dark">${sanitize(item.nombre)}</h5>
                        <p class="text-muted small mb-2 text-truncate" style="max-width: 380px;">${sanitize(item.descripcion || 'Ingredientes frescos de calidad gourmet')}</p>
                    </div>
                    <button type="button" class="btn btn-outline-danger btn-sm rounded-circle p-1" style="width: 32px; height: 32px;" title="Eliminar producto" data-action="delete" data-index="${index}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                    <strong class="text-primary fs-5">${formatCOP(itemTotal)}</strong>
                    <div class="quantity-controller d-inline-flex align-items-center border rounded-pill px-2 py-1 bg-light">
                        <button type="button" class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none fw-bold" data-action="decrease" data-index="${index}">−</button>
                        <span class="px-2 fw-bold text-dark small">${item.cantidad}</span>
                        <button type="button" class="btn btn-sm btn-link text-dark p-0 px-2 text-decoration-none fw-bold" data-action="increase" data-index="${index}">+</button>
                    </div>
                </div>
            </div>
        `;

        card.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
            const confirmed = await showConfirm({
                title: 'Eliminar producto',
                message: `¿Deseas quitar "${item.nombre}" de tu pedido?`,
                confirmText: 'Sí, quitar',
                cancelText: 'Conservar',
                isDanger: true,
                icon: 'bi-trash-fill'
            });
            if (confirmed) removeFromCart(index);
        });

        card.querySelector('[data-action="decrease"]')?.addEventListener('click', () => updateQuantity(index, -1));
        card.querySelector('[data-action="increase"]')?.addEventListener('click', () => updateQuantity(index, 1));

        list.appendChild(card);
    });
}

/**
 * Render items in pago.html summary
 */
function renderCheckoutItems(cart = getCart()) {
    const container = document.getElementById('productosPago');
    if (!container) return;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<p class="text-muted text-center py-3">No hay productos seleccionados.</p>`;
        return;
    }

    cart.forEach(item => {
        const itemTotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 1);
        const row = document.createElement('div');
        row.className = 'd-flex justify-content-between align-items-center py-2 border-bottom small';
        row.innerHTML = `
            <div class="text-truncate me-2">
                <span class="badge bg-secondary-subtle text-dark me-1">${item.cantidad}x</span>
                <span class="fw-medium">${sanitize(item.nombre)}</span>
            </div>
            <strong class="text-dark">${formatCOP(itemTotal)}</strong>
        `;
        container.appendChild(row);
    });
}

/**
 * Update all financial totals on screen
 */
function updateDOMTotals(totals = calculateTotals()) {
    const updateText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    updateText('subtotal', formatCOP(totals.subtotal));
    updateText('impuestos', formatCOP(totals.tax));
    updateText('envio', totals.shipping === 0 ? (totals.subtotal > 0 ? 'GRATIS' : '$0') : formatCOP(totals.shipping));
    updateText('total', formatCOP(totals.total));

    updateText('subtotalPago', formatCOP(totals.subtotal));
    updateText('impuestosPago', formatCOP(totals.tax));
    updateText('envioPago', totals.shipping === 0 ? (totals.subtotal > 0 ? 'GRATIS' : '$0') : formatCOP(totals.shipping));
    updateText('totalPago', formatCOP(totals.total));
    updateText('textoTotal', formatCOP(totals.total));

    updateCartBadges(totals.totalItems);
}

/**
 * Global App Initialization
 */
export function initApp() {
    renderNavbarSession();

    const initialCart = getCart();
    const initialTotals = calculateTotals(initialCart);

    renderMenuCart(initialCart);
    renderPedidosList(initialCart);
    renderCheckoutItems(initialCart);
    updateDOMTotals(initialTotals);

    // Subscribe to cart change events
    document.addEventListener('towskan:cart-updated', (event) => {
        const { cart, totals } = event.detail;
        renderMenuCart(cart);
        renderPedidosList(cart);
        renderCheckoutItems(cart);
        updateDOMTotals(totals);
    });

    // Wire WhatsApp buttons if present
    document.querySelectorAll('.btn-whatsapp-order').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            sendOrderWhatsApp();
        });
    });

    // Close mobile navbar on link click
    const navLinks = document.querySelectorAll('.navbar-collapse .nav-link:not(.dropdown-toggle)');
    const navCollapse = document.getElementById('menuPrincipal');
    if (navCollapse && window.bootstrap) {
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                const bsCollapse = window.bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) bsCollapse.hide();
            });
        });
    }
}

// Auto-run on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

window.TowskanApp = {
    initApp,
    renderNavbarSession,
    updateDOMTotals
};

