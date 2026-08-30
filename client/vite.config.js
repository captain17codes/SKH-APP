import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react-map-gl/maplibre', 'maplibre-gl'],
    exclude: ['maplibre-gl/dist/maplibre-gl-worker.mjs']
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure maplibre worker is a separate chunk with predictable naming
        manualChunks(id) {
          if (id.includes('maplibre-gl')) return 'maplibre';
          if (id.includes('flood/scenarios') || id.includes('flood/buildings') || id.includes('flood/water-features')) return 'flood-data';
        }
      }
    },
    // Raise chunk warning limit for large GeoJSON data files
    chunkSizeWarningLimit: 3000
  },
  worker: {
    format: 'es'
  }
})

