/**
 * TOWSKAN - Checkout & Payment Processing Module
 * Credit card masking, validation, digital wallets, WhatsApp order dispatcher
 */

import { getCart, clearCart, calculateTotals } from './cart.js';
import { formatCOP, showToast, showConfirm, showAlert, setFieldError, clearFieldError, sanitize } from './ui.js';

// Restaurant WhatsApp Contact Number (Format: CountryCode + Number)
const RESTAURANT_WHATSAPP_NUMBER = '573052897641';

let currentPaymentMethod = 'tarjeta';
let currentWallet = 'Nequi';

/**
 * Detect Credit Card Brand (Visa, Mastercard, Amex, etc.)
 */
export function detectCardBrand(number) {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return { brand: 'Visa', icon: 'bi-credit-card-2-front' };
    if (/^5[1-5]/.test(clean)) return { brand: 'Mastercard', icon: 'bi-credit-card-2-front-fill' };
    if (/^3[47]/.test(clean)) return { brand: 'Amex', icon: 'bi-credit-card' };
    return { brand: 'Tarjeta', icon: 'bi-credit-card' };
}

/**
 * Format Credit Card Number with 4-digit groups (XXXX XXXX XXXX XXXX)
 */
export function formatCardNumber(input) {
    if (!input) return;
    let value = input.value.replace(/\D/g, '').substring(0, 16);
    let formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    input.value = formatted;

    // Optional card brand indicator
    const cardIcon = document.getElementById('cardBrandIcon');
    if (cardIcon) {
        const detection = detectCardBrand(value);
        cardIcon.className = `bi ${detection.icon}`;
    }
}

/**
 * Format Expiry Date (MM/AA)
 */
export function formatExpiryDate(input) {
    if (!input) return;
    let value = input.value.replace(/\D/g, '').substring(0, 4);
    if (value.length >= 3) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    input.value = value;
}

/**
 * Validate Expiry Date MM/AA
 */
function isExpiryValid(expiry) {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return false;
    const [month, yearStr] = expiry.split('/');
    const expMonth = parseInt(month, 10);
    const expYear = parseInt('20' + yearStr, 10);

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    if (expYear < curYear) return false;
    if (expYear === curYear && expMonth < curMonth) return false;
    return true;
}

/**
 * Switch payment methods (tarjeta, billetera, efectivo)
 */
export function setPaymentMethod(method) {
    currentPaymentMethod = method;

    const btnTarjeta = document.getElementById('btnTarjeta');
    const btnBilletera = document.getElementById('btnBilletera');
    const btnEfectivo = document.getElementById('btnEfectivo');

    const formTarjeta = document.getElementById('formTarjeta');
    const formBilletera = document.getElementById('formBilletera');
    const formEfectivo = document.getElementById('formEfectivo');

    [btnTarjeta, btnBilletera, btnEfectivo].forEach(b => b?.classList.remove('activo'));
    [formTarjeta, formBilletera, formEfectivo].forEach(f => f?.classList.add('oculto'));

    if (method === 'tarjeta') {
        btnTarjeta?.classList.add('activo');
        formTarjeta?.classList.remove('oculto');
    } else if (method === 'billetera') {
        btnBilletera?.classList.add('activo');
        formBilletera?.classList.remove('oculto');
    } else if (method === 'efectivo') {
        btnEfectivo?.classList.add('activo');
        formEfectivo?.classList.remove('oculto');
    }
}

/**
 * Select digital wallet (Nequi or Daviplata)
 */
export function setWallet(wallet) {
    currentWallet = wallet;
    const btnNequi = document.getElementById('btnNequi');
    const btnDaviplata = document.getElementById('btnDaviplata');

    btnNequi?.classList.toggle('activo', wallet === 'Nequi');
    btnDaviplata?.classList.toggle('activo', wallet === 'Daviplata');
}

/**
 * Generate structured text and open WhatsApp to finalize order
 */
export function sendOrderWhatsApp() {
    const cart = getCart();
    if (cart.length === 0) {
        showToast('Tu carrito está vacío. Agrega productos para pedir por WhatsApp.', 'warning');
        return;
    }

    const totals = calculateTotals(cart);

    // Read delivery inputs if present on page
    const nombreInput = document.getElementById('nombreCliente') || document.getElementById('nombreTarjeta');
    const telefonoInput = document.getElementById('telefonoCliente') || document.getElementById('numeroBilletera');
    const direccionInput = document.getElementById('direccionCliente');
    const notasInput = document.getElementById('notasPedido');

    const clienteNombre = nombreInput?.value?.trim() || 'Cliente Towskan';
    const clienteTelefono = telefonoInput?.value?.trim() || 'No especificado';
    const clienteDireccion = direccionInput?.value?.trim() || 'A convenir';
    const clienteNotas = notasInput?.value?.trim() || '';

    // Build message
    let msg = `🍔 *¡HOLA TOWSKAN! QUIERO CONFIRMAR MI PEDIDO* 🍔\n\n`;
    msg += `📋 *RESUMEN DEL PEDIDO:*\n`;

    cart.forEach(item => {
        const itemTotal = (Number(item.precio) || 0) * (Number(item.cantidad) || 1);
        msg += `• ${item.cantidad}x ${item.nombre} - ${formatCOP(itemTotal)}\n`;
    });

    msg += `\n💰 *Subtotal:* ${formatCOP(totals.subtotal)}`;
    msg += `\n🧾 *Impuestos (8%):* ${formatCOP(totals.tax)}`;
    msg += `\n🛵 *Envío:* ${totals.shipping === 0 ? '¡GRATIS!' : formatCOP(totals.shipping)}`;
    msg += `\n🔥 *TOTAL A PAGAR:* ${formatCOP(totals.total)}\n`;

    msg += `\n📍 *DATOS DE ENTREGA:*`;
    msg += `\n👤 *Cliente:* ${clienteNombre}`;
    msg += `\n📱 *Teléfono:* ${clienteTelefono}`;
    msg += `\n🏠 *Dirección:* ${clienteDireccion}`;
    msg += `\n💳 *Método de pago deseado:* ${currentPaymentMethod === 'tarjeta' ? 'Tarjeta' : (currentPaymentMethod === 'billetera' ? currentWallet : 'Efectivo contra entrega')}`;

    if (clienteNotas) {
        msg += `\n📝 *Notas:* ${clienteNotas}`;
    }

    msg += `\n\n_¡Quedo a la espera de la confirmación! Muchas gracias._`;

    const encoded = encodeURIComponent(msg);
    const whatsappUrl = `https://wa.me/${RESTAURANT_WHATSAPP_NUMBER}?text=${encoded}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    showToast('Abriendo WhatsApp con el resumen de tu pedido...', 'success');
}

/**
 * Validate checkout form and process payment simulation
 */
export async function processCheckout() {
    const cart = getCart();
    if (cart.length === 0) {
        showAlert({
            title: 'Carrito Vacío',
            message: 'No tienes productos en tu pedido. Por favor, explora nuestro menú para agregar platillos deliciosos.',
            type: 'warning'
        });
        return;
    }

    // Common customer fields
    const nombreCliente = document.getElementById('nombreCliente');
    const direccionCliente = document.getElementById('direccionCliente');
    const telefonoCliente = document.getElementById('telefonoCliente');

    let hasErrors = false;

    if (nombreCliente && !nombreCliente.value.trim()) {
        setFieldError(nombreCliente, 'Por favor ingresa tu nombre completo.');
        hasErrors = true;
    } else if (nombreCliente) {
        clearFieldError(nombreCliente);
    }

    if (direccionCliente && !direccionCliente.value.trim()) {
        setFieldError(direccionCliente, 'Por favor ingresa tu dirección de entrega.');
        hasErrors = true;
    } else if (direccionCliente) {
        clearFieldError(direccionCliente);
    }

    if (telefonoCliente) {
        const phone = telefonoCliente.value.replace(/\D/g, '');
        if (phone.length < 7) {
            setFieldError(telefonoCliente, 'Ingresa un número telefónico válido (mínimo 7 dígitos).');
            hasErrors = true;
        } else {
            clearFieldError(telefonoCliente);
        }
    }

    // Method specific validation
    if (currentPaymentMethod === 'tarjeta') {
        const nombreTarjeta = document.getElementById('nombreTarjeta');
        const numeroTarjeta = document.getElementById('numeroTarjeta');
        const vencimiento = document.getElementById('vencimiento');
        const cvv = document.getElementById('cvv');

        if (nombreTarjeta && !nombreTarjeta.value.trim()) {
            setFieldError(nombreTarjeta, 'Ingresa el nombre del titular de la tarjeta.');
            hasErrors = true;
        } else if (nombreTarjeta) {
            clearFieldError(nombreTarjeta);
        }

        if (numeroTarjeta) {
            const rawNumber = numeroTarjeta.value.replace(/\s/g, '');
            if (rawNumber.length < 15) {
                setFieldError(numeroTarjeta, 'Ingresa un número de tarjeta válido (15 o 16 dígitos).');
                hasErrors = true;
            } else {
                clearFieldError(numeroTarjeta);
            }
        }

        if (vencimiento) {
            if (!isExpiryValid(vencimiento.value.trim())) {
                setFieldError(vencimiento, 'Fecha inválida o tarjeta vencida (formato MM/AA).');
                hasErrors = true;
            } else {
                clearFieldError(vencimiento);
            }
        }

        if (cvv) {
            const rawCvv = cvv.value.trim();
            if (rawCvv.length < 3 || rawCvv.length > 4) {
                setFieldError(cvv, 'CVV debe tener 3 o 4 dígitos.');
                hasErrors = true;
            } else {
                clearFieldError(cvv);
            }
        }
    } else if (currentPaymentMethod === 'billetera') {
        const numeroBilletera = document.getElementById('numeroBilletera');
        if (numeroBilletera) {
            const num = numeroBilletera.value.replace(/\D/g, '');
            if (num.length !== 10 || !num.startsWith('3')) {
                setFieldError(numeroBilletera, `Ingresa un número de celular de 10 dígitos que inicie en 3 para ${currentWallet}.`);
                hasErrors = true;
            } else {
                clearFieldError(numeroBilletera);
            }
        }
    }

    if (hasErrors) {
        showToast('Corrige los campos marcados en rojo antes de continuar.', 'error');
        return;
    }

    const totals = calculateTotals(cart);
    let methodDisplay = currentPaymentMethod === 'tarjeta' ? 'Tarjeta de crédito/débito' : (currentPaymentMethod === 'billetera' ? `Billetera ${currentWallet}` : 'Efectivo contra entrega');

    // Confirm dialog (Replacing native confirm)
    const confirmed = await showConfirm({
        title: 'Confirmar Pedido',
        message: `¿Deseas procesar tu pedido por un valor total de ${formatCOP(totals.total)} con ${methodDisplay}?`,
        confirmText: 'Sí, Pagar y Ordenar',
        cancelText: 'Revisar datos',
        icon: 'bi-bag-check-fill'
    });

    if (!confirmed) return;

    // Simulate Payment Processing
    const orderNumber = 'TK-' + Math.floor(100000 + Math.random() * 900000);
    const orderData = {
        orderId: orderNumber,
        date: new Date().toISOString(),
        items: cart,
        totals: totals,
        paymentMethod: methodDisplay,
        customer: {
            nombre: nombreCliente?.value?.trim() || 'Cliente Towskan',
            direccion: direccionCliente?.value?.trim() || 'Dirección no indicada',
            telefono: telefonoCliente?.value?.trim() || ''
        }
    };

    // Store in order history
    try {
        const history = JSON.parse(localStorage.getItem('towskan_orders') || '[]');
        history.unshift(orderData);
        localStorage.setItem('towskan_orders', JSON.stringify(history.slice(0, 10)));
    } catch (e) {
        console.warn('Towskan: Error guardando orden en historial:', e);
    }

    // Clear cart
    clearCart();

    // Show Success Modal
    await showAlert({
        title: '¡Pedido Confirmado con Éxito! 🎉',
        message: `Tu pedido con código #${orderNumber} ha sido recibido y ya se está preparando en la cocina de Towskan. Tiempo estimado de entrega: 25-35 minutos.`,
        buttonText: 'Volver al Menú',
        type: 'success'
    });

    window.location.href = 'menu.html';
}

// Global window bindings for compatibility
window.seleccionarMetodo = setPaymentMethod;
window.seleccionarBilletera = setWallet;
window.formatearTarjeta = formatCardNumber;
window.formatearVencimiento = formatExpiryDate;
window.procesarPago = processCheckout;
window.finalizarPedidoWhatsApp = sendOrderWhatsApp;

