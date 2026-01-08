import '@testing-library/jest-dom'

// Global test utilities
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback
    }
    observe() { }
    unobserve() { }
    disconnect() { }
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    observe() { return null }
    unobserve() { return null }
    disconnect() { return null }
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { }
    })
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: {
        write: vi.fn().mockResolvedValue(undefined),
        writeText: vi.fn().mockResolvedValue(undefined),
        read: vi.fn().mockResolvedValue([]),
        readText: vi.fn().mockResolvedValue('')
    }
})
