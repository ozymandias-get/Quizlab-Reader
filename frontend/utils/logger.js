/**
 * Simple Logger wrapper to prevent console pollution in production.
 * Only logs in development environment.
 */
const isDev = process.env.NODE_ENV === 'development';

export const Logger = {
    log: (...args) => {
        if (isDev) console.log(...args);
    },
    warn: (...args) => {
        if (isDev) console.warn(...args);
    },
    error: (...args) => {
        // Errors are critical, so we might want to keep them or at least log them uniquely.
        // For now, we pass them through but we could wrap them if needed.
        console.error(...args);
    },
    info: (...args) => {
        if (isDev) console.info(...args);
    }
};
