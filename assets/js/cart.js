/**
 * TOWSKAN - Cart Management Module
 * Safe localStorage handling, reactive state, totals calculation, item operations
 */

import { showToast, formatCOP, updateCartBadges } from './ui.js';

const STORAGE_KEY = 'towskan_cart';
const LEGACY_STORAGE_KEY = 'carritoTouskan';

// Tax Rate (8% Impuesto Nacional al Consumo en Restaurantes de Colombia)
const TAX_RATE = 0.08;
// Standard Shipping Cost
const SHIPPING_COST = 5000;
// Free shipping threshold
const FREE_SHIPPING_THRESHOLD = 60000;

/**
 * Safely retrieve cart from localStorage with fallback and error handling
 */
export function getCart() {
    try {
        const primary = localStorage.getItem(STORAGE_KEY);
        if (primary) {
            const parsed = JSON.parse(primary);
            return Array.isArray(parsed) ? parsed : [];
        }

        // Backward compatibility check with legacy key
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
            const parsedLegacy = JSON.parse(legacy);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
                saveCart(parsedLegacy);
                localStorage.removeItem(LEGACY_STORAGE_KEY);
                return parsedLegacy;
            }
        }
    } catch (error) {
        console.warn('Towskan: Error leyendo el carrito de localStorage:', error);
    }
    return [];
}

/**
 * Safely persist cart to localStorage and dispatch update event
 */
export function saveCart(cart) {
    try {
        const safeCart = Array.isArray(cart) ? cart : [];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(safeCart));
        notifyCartChange(safeCart);
    } catch (error) {
        console.error('Towskan: Error guardando el carrito:', error);
        showToast('No se pudo guardar el carrito localmente.', 'error');
    }
}

/**
 * Calculate financial totals
 */
export function calculateTotals(cart = getCart()) {
    let subtotal = 0;
    let totalItems = 0;

    cart.forEach(item => {
        const price = Number(item.precio) || 0;
        const qty = Number(item.cantidad) || 0;
        subtotal += price * qty;
        totalItems += qty;
    });

    const tax = Math.round(subtotal * TAX_RATE);
    const shipping = subtotal > 0 ? (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST) : 0;
    const total = subtotal + tax + shipping;

    return {
        subtotal,
        tax,
        shipping,
        total,
        totalItems,
        isFreeShipping: subtotal >= FREE_SHIPPING_THRESHOLD && subtotal > 0
    };
}

/**
 * Notify all subscribers of cart changes
 */
function notifyCartChange(cart = getCart()) {
    const totals = calculateTotals(cart);
    updateCartBadges(totals.totalItems);

    document.dispatchEvent(new CustomEvent('towskan:cart-updated', {
        detail: { cart, totals }
    }));
}

/**
 * Add a product to the cart
 */
export function addToCart(product, options = { notify: true }) {
    if (!product || !product.nombre) return;

    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.nombre.trim() === product.nombre.trim());

    if (existingIndex > -1) {
        cart[existingIndex].cantidad += (product.cantidad || 1);
    } else {
        cart.push({
            nombre: String(product.nombre).trim(),
            precio: Number(product.precio) || 0,
            imagen: String(product.imagen || 'assets/img/hamburguesa.jpg'),
            descripcion: String(product.descripcion || ''),
            cantidad: Number(product.cantidad) || 1
        });
    }

    saveCart(cart);

    if (options.notify) {
        showToast(`¡"${product.nombre}" agregado al pedido!`, 'success');
    }
}

/**
 * Remove an item from the cart by index
 */
export function removeFromCart(index) {
    const cart = getCart();
    if (index >= 0 && index < cart.length) {
        const removed = cart.splice(index, 1)[0];
        saveCart(cart);
        if (removed) {
            showToast(`"${removed.nombre}" eliminado del pedido.`, 'info');
        }
    }
}

/**
 * Update the quantity of an item
 */
export function updateQuantity(index, delta) {
    const cart = getCart();
    if (index >= 0 && index < cart.length) {
        const newQty = (cart[index].cantidad || 1) + delta;
        if (newQty <= 0) {
            removeFromCart(index);
        } else {
            cart[index].cantidad = newQty;
            saveCart(cart);
        }
    }
}

/**
 * Empty the entire cart
 */
export function clearCart() {
    saveCart([]);
}

// ==========================================================================
// BACKWARD COMPATIBILITY EXPORTS FOR INLINE HTML HANDLERS
// ==========================================================================

window.agregarProducto = function(nombre, precio, imagen, descripcion = '') {
    addToCart({ nombre, precio, imagen, descripcion });
};

window.addProduct = function(nombre, precio, imagen, descripcion = '') {
    addToCart({ nombre, precio, imagen, descripcion });
};

window.eliminarProducto = function(index) {
    removeFromCart(index);
};

window.aumentarCantidad = function(index) {
    updateQuantity(index, 1);
};

window.disminuirCantidad = function(index) {
    updateQuantity(index, -1);
};

window.calcularTotales = calculateTotals;
window.actualizarCarrito = () => notifyCartChange(getCart());

