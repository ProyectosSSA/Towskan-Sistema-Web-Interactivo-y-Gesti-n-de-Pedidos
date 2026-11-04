/**
 * TOWSKAN - Authentication Module (Demo LocalStorage)
 * Registration, login, validation, secure password hashing, session management
 */

import { showToast, showAlert, setFieldError, clearFieldError } from './ui.js';

const USER_STORAGE_KEY = 'towskan_user';
const SESSION_STORAGE_KEY = 'towskan_session';

const LEGACY_USER_KEY = 'usuarioTouskan';
const LEGACY_SESSION_KEY = 'sesionTouskan';

/**
 * Hash password using browser's native Web Crypto SHA-256
 */
export async function hashPassword(plainText) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Tu navegador no soporta cifrado seguro con Web Crypto.');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Get active user session
 */
export function getActiveSession() {
    try {
        const session = localStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(LEGACY_SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Get registered user details
 */
export function getRegisteredUser() {
    try {
        const user = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem(LEGACY_USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Log out active user
 */
export function logoutUser() {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        localStorage.removeItem(LEGACY_SESSION_KEY);
        showToast('Sesión cerrada correctamente.', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    } catch (e) {
        console.error(e);
    }
}

/**
 * Handle user registration form submit
 */
export async function handleRegister(event) {
    if (event) event.preventDefault();

    const nombreInput = document.getElementById('nombre');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const terminosInput = document.getElementById('terminos');

    let hasErrors = false;

    // Validate Name
    if (!nombreInput || nombreInput.value.trim().length < 3) {
        setFieldError(nombreInput, 'Ingresa tu nombre completo (mínimo 3 caracteres).');
        hasErrors = true;
    } else {
        clearFieldError(nombreInput);
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput || !emailRegex.test(emailInput.value.trim().toLowerCase())) {
        setFieldError(emailInput, 'Ingresa un correo electrónico válido.');
        hasErrors = true;
    } else {
        clearFieldError(emailInput);
    }

    // Validate Password
    if (!passwordInput || passwordInput.value.length < 8) {
        setFieldError(passwordInput, 'La contraseña debe tener al menos 8 caracteres.');
        hasErrors = true;
    } else {
        clearFieldError(passwordInput);
    }

    // Validate Confirm Password
    if (!confirmPasswordInput || confirmPasswordInput.value !== passwordInput.value) {
        setFieldError(confirmPasswordInput, 'Las contraseñas no coinciden.');
        hasErrors = true;
    } else {
        clearFieldError(confirmPasswordInput);
    }

    // Validate Terms
    if (terminosInput && !terminosInput.checked) {
        showToast('Debes aceptar los términos y condiciones para continuar.', 'warning');
        hasErrors = true;
    }

    if (hasErrors) return;

    try {
        const hashedPassword = await hashPassword(passwordInput.value);
        const newUser = {
            nombre: nombreInput.value.trim(),
            email: emailInput.value.trim().toLowerCase(),
            hash: hashedPassword,
            registeredAt: new Date().toISOString()
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));

        await showAlert({
            title: '¡Cuenta creada con éxito! 🎉',
            message: `Bienvenido a Towskan, ${newUser.nombre}. Ahora puedes iniciar sesión con tu correo y contraseña.`,
            buttonText: 'Ir a Iniciar Sesión',
            type: 'success'
        });

        window.location.href = 'login.html';
    } catch (error) {
        showToast(error.message || 'Error al crear la cuenta.', 'error');
    }
}

/**
 * Handle user login form submit
 */
export async function handleLogin(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    let hasErrors = false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput || !emailRegex.test(emailInput.value.trim().toLowerCase())) {
        setFieldError(emailInput, 'Ingresa un correo electrónico válido.');
        hasErrors = true;
    } else {
        clearFieldError(emailInput);
    }

    if (!passwordInput || passwordInput.value.trim() === '') {
        setFieldError(passwordInput, 'Ingresa tu contraseña.');
        hasErrors = true;
    } else {
        clearFieldError(passwordInput);
    }

    if (hasErrors) return;

    const storedUser = getRegisteredUser();

    if (!storedUser) {
        showToast('No hay ninguna cuenta registrada en este navegador. Por favor regístrate primero.', 'warning');
        return;
    }

    try {
        const inputHash = await hashPassword(passwordInput.value);

        if (storedUser.email !== emailInput.value.trim().toLowerCase() || storedUser.hash !== inputHash) {
            showToast('Correo electrónico o contraseña incorrectos.', 'error');
            setFieldError(passwordInput, 'Credenciales no coinciden.');
            return;
        }

        const session = {
            nombre: storedUser.nombre,
            email: storedUser.email,
            loggedInAt: new Date().toISOString()
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

        showToast(`¡Bienvenido de nuevo, ${storedUser.nombre}!`, 'success');
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 600);
    } catch (error) {
        showToast(error.message || 'Error al iniciar sesión.', 'error');
    }
}

export function handleGoogleAuth() {
    showAlert({
        title: 'Acceso con Google',
        message: 'La integración OAuth de Google está en proceso de verificación por la API de Google Console. Por favor usa el registro con correo por ahora.',
        type: 'info'
    });
}

// Global window bindings
window.TowskanAuth = {
    hashPassword,
    getActiveSession,
    logoutUser,
    handleRegister,
    handleLogin,
    handleGoogleAuth
};

