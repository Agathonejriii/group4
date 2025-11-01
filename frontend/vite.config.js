import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
  },

  // Server configuration for development
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to Django backend during development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },

  // Base public path
  base: '/',
})
