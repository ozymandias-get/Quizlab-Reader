import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

/**
 * Toast Context - Kullanıcıya bildirim göstermek için
 * 
 * Kullanım:
 * const { showToast, showError, showSuccess } = useToast()
 * showError('PDF dosyası bozuk!')
 * showSuccess('PDF yüklendi')
 */
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const timeoutRefs = useRef({}) // setTimeout cleanup için

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random()

        setToasts(prev => [...prev, { id, message, type }])

        // Önceki timeout'u temizle (eğer varsa)
        if (timeoutRefs.current[id]) {
            clearTimeout(timeoutRefs.current[id])
        }

        // Otomatik kaldır
        timeoutRefs.current[id] = setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
            delete timeoutRefs.current[id]
        }, duration)

        return id
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Tüm timeout'ları temizle
            Object.values(timeoutRefs.current).forEach(timeoutId => {
                if (timeoutId) clearTimeout(timeoutId)
            })
            timeoutRefs.current = {}
        }
    }, [])

    const removeToast = useCallback((id) => {
        // Timeout'u temizle
        if (timeoutRefs.current[id]) {
            clearTimeout(timeoutRefs.current[id])
            delete timeoutRefs.current[id]
        }
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const showToast = useCallback((message, type = 'info') => {
        return addToast(message, type)
    }, [addToast])

    const showError = useCallback((message) => {
        return addToast(message, 'error', 5000)
    }, [addToast])

    const showSuccess = useCallback((message) => {
        return addToast(message, 'success', 3000)
    }, [addToast])

    const showWarning = useCallback((message) => {
        return addToast(message, 'warning', 4000)
    }, [addToast])

    return (
        <ToastContext.Provider value={{ showToast, showError, showSuccess, showWarning, removeToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto
                            px-4 py-3 rounded-xl shadow-lg backdrop-blur-md
                            flex items-center gap-3
                            animate-slide-in
                            max-w-sm
                            ${toast.type === 'error'
                                ? 'bg-red-500/90 text-white border border-red-400/30'
                                : toast.type === 'success'
                                    ? 'bg-emerald-500/90 text-white border border-emerald-400/30'
                                    : toast.type === 'warning'
                                        ? 'bg-amber-500/90 text-white border border-amber-400/30'
                                        : 'bg-stone-800/90 text-stone-100 border border-stone-700/30'
                            }
                        `}
                        onClick={() => removeToast(toast.id)}
                    >
                        {/* Icon */}
                        {toast.type === 'error' && (
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                        )}
                        {toast.type === 'success' && (
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                        )}
                        {toast.type === 'warning' && (
                            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 9v4M12 17h.01" />
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                        )}

                        {/* Message */}
                        <span className="text-sm font-medium">{toast.message}</span>

                        {/* Close button */}
                        <button
                            className="ml-auto opacity-70 hover:opacity-100 transition-opacity"
                            onClick={() => removeToast(toast.id)}
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export default ToastContext
