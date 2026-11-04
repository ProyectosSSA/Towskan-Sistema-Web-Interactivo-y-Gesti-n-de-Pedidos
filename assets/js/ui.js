/**
 * TOWSKAN - UI & Interaction Utilities
 * Toast notifications, custom modals, currency formatting, accessibility helpers
 */

// Currency Formatter for Colombian Pesos (COP)
const copCurrencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
});

export function formatCOP(amount) {
    const num = Number(amount) || 0;
    return copCurrencyFormatter.format(Math.round(num));
}

// XSS Sanitizer for rendering safe text
export function sanitize(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// ==========================================================================
// TOAST NOTIFICATION SYSTEM (Replaces alert)
// ==========================================================================

function getToastContainer() {
    let container = document.getElementById('towskanToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'towskanToastContainer';
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        document.body.appendChild(container);
    }
    return container;
}

const TOAST_ICONS = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-triangle-fill',
    warning: 'bi-exclamation-circle-fill',
    info: 'bi-info-circle-fill'
};

export function showToast(message, type = 'success', duration = 3200) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    const safeType = TOAST_ICONS[type] ? type : 'info';
    const iconClass = TOAST_ICONS[safeType];

    toast.className = `towskan-toast toast-${safeType}`;
    toast.setAttribute('role', 'alert');

    toast.innerHTML = `
        <i class="bi ${iconClass} toast-icon" aria-hidden="true"></i>
        <div class="toast-content">${sanitize(message)}</div>
        <button type="button" class="toast-close" aria-label="Cerrar notificación">
            <i class="bi bi-x"></i>
        </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    // Trigger reflow for CSS animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    if (duration > 0) {
        setTimeout(dismiss, duration);
    }

    return toast;
}

// ==========================================================================
// CUSTOM CONFIRMATION & ALERT MODALS (Replaces confirm and alert)
// ==========================================================================

export function showConfirm({
    title = '¿Estás seguro?',
    message = '',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDanger = false,
    icon = 'bi-question-circle-fill'
} = {}) {
    return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'towskan-modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');

        const confirmBtnClass = isDanger ? 'btn-danger' : 'btn-towskan-primary';

        backdrop.innerHTML = `
            <div class="towskan-modal-card">
                <div class="towskan-modal-icon">
                    <i class="bi ${icon}" aria-hidden="true"></i>
                </div>
                <h3 class="towskan-modal-title">${sanitize(title)}</h3>
                <p class="towskan-modal-message">${sanitize(message)}</p>
                <div class="towskan-modal-actions">
                    <button type="button" class="btn btn-towskan-secondary btn-cancel">${sanitize(cancelText)}</button>
                    <button type="button" class="btn ${confirmBtnClass} btn-confirm">${sanitize(confirmText)}</button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        requestAnimationFrame(() => backdrop.classList.add('active'));

        const cleanup = (result) => {
            backdrop.classList.remove('active');
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
                resolve(result);
            }, 250);
        };

        backdrop.querySelector('.btn-cancel').addEventListener('click', () => cleanup(false));
        backdrop.querySelector('.btn-confirm').addEventListener('click', () => cleanup(true));
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup(false);
        });

        // Trap focus or allow Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                cleanup(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
    });
}

export function showAlert({
    title = 'Atención',
    message = '',
    buttonText = 'Entendido',
    type = 'info'
} = {}) {
    return new Promise((resolve) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'towskan-modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');

        const iconClass = type === 'success' ? 'bi-check-circle-fill' : (type === 'error' ? 'bi-x-circle-fill' : 'bi-info-circle-fill');
        const iconColor = type === 'success' ? 'icon-success' : '';

        backdrop.innerHTML = `
            <div class="towskan-modal-card">
                <div class="towskan-modal-icon ${iconColor}">
                    <i class="bi ${iconClass}" aria-hidden="true"></i>
                </div>
                <h3 class="towskan-modal-title">${sanitize(title)}</h3>
                <p class="towskan-modal-message">${sanitize(message)}</p>
                <div class="towskan-modal-actions">
                    <button type="button" class="btn btn-towskan-primary btn-close-modal" style="min-width: 140px;">
                        ${sanitize(buttonText)}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        requestAnimationFrame(() => backdrop.classList.add('active'));

        const cleanup = () => {
            backdrop.classList.remove('active');
            setTimeout(() => {
                if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
                resolve(true);
            }, 250);
        };

        backdrop.querySelector('.btn-close-modal').addEventListener('click', cleanup);
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) cleanup();
        });
    });
}

// ==========================================================================
// DYNAMIC CART BADGE UPDATER
// ==========================================================================

export function updateCartBadges(totalItems) {
    const count = Number(totalItems) || 0;
    const badges = document.querySelectorAll('.cart-badge, #cartNumber, #cartNumber2, #cantidadArticulos');

    badges.forEach(badge => {
        badge.textContent = count;
        if (badge.classList.contains('cart-badge')) {
            badge.classList.add('bump');
            setTimeout(() => badge.classList.remove('bump'), 250);
        }
    });
}

// ==========================================================================
// FORM VALIDATION ERROR HELPERS
// ==========================================================================

export function setFieldError(inputEl, message) {
    if (!inputEl) return;
    const parent = inputEl.closest('.form-group-towskan') || inputEl.parentElement;
    if (parent) {
        parent.classList.add('has-error');
        let errorMsg = parent.querySelector('.form-error-msg');
        if (!errorMsg) {
            errorMsg = document.createElement('div');
            errorMsg.className = 'form-error-msg';
            parent.appendChild(errorMsg);
        }
        errorMsg.innerHTML = `<i class="bi bi-exclamation-circle"></i> ${sanitize(message)}`;
        inputEl.setAttribute('aria-invalid', 'true');
    }
}

export function clearFieldError(inputEl) {
    if (!inputEl) return;
    const parent = inputEl.closest('.form-group-towskan') || inputEl.parentElement;
    if (parent) {
        parent.classList.remove('has-error');
        inputEl.removeAttribute('aria-invalid');
    }
}

// Attach to window for backwards compatibility with inline onclick handlers
window.TowskanUI = {
    formatCOP,
    sanitize,
    showToast,
    showConfirm,
    showAlert,
    updateCartBadges,
    setFieldError,
    clearFieldError
};

