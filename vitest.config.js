import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.js'],
        include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
        exclude: ['node_modules', 'dist', 'release'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules',
                'src/test/setup.js',
                '*.config.js',
                'src/main/**' // Main process için ayrı test environment gerek
            ]
        }
    },
    resolve: {
        alias: {
            '@': '/src/renderer/src'
        }
    }
})
