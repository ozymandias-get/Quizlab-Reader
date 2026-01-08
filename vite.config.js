import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    root: './src/renderer',
    publicDir: 'public',
    base: './',
    build: {
        outDir: '../../dist',
        emptyOutDir: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/renderer/src')
        }
    },
    server: {
        port: 5173,
        strictPort: true
    }
})
