import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * Toast Management System - Solid & Performant
 * Supports: Queueing (max 3), i18n, Progress Bar, Pause-on-hover, Framer Motion
 */
const ToastContext = createContext(null);

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(({ message, title, type = 'info', params = {}, duration = DEFAULT_DURATION }) => {
        const id = Math.random().toString(36).substring(2, 9);

        setToasts((prev) => {
            const newToast = { id, message, title, type, params, duration };
            const updated = [...prev, newToast];

            // Queue Mechanism: Max 3 toasts. If more, remove the oldest one.
            if (updated.length > MAX_TOASTS) {
                return updated.slice(updated.length - MAX_TOASTS);
            }
            return updated;
        });

        return id;
    }, []);

    // Convenience Methods
    const showSuccess = useCallback((message, title, params, duration) =>
        addToast({ message, title, type: 'success', params, duration }), [addToast]);

    const showError = useCallback((message, title, params, duration) =>
        addToast({ message, title, type: 'error', params, duration }), [addToast]);

    const showWarning = useCallback((message, title, params, duration) =>
        addToast({ message, title, type: 'warning', params, duration }), [addToast]);

    const showInfo = useCallback((message, title, params, duration) =>
        addToast({ message, title, type: 'info', params, duration }), [addToast]);

    const value = React.useMemo(() => ({
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo
    }), [toasts, addToast, removeToast, showSuccess, showError, showWarning, showInfo]);

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export default ToastContext;
