import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'SETX 360',
        short_name: 'SETX 360',
        description: 'Your regional social platform powered by community',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo-setx-blue.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo-setx-blue.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/framer-motion')) return 'vendor';
          if (id.includes('node_modules/leaflet')) return 'leaflet';
          if (id.includes('node_modules/@supabase')) return 'supabase';
        }
      }
    }
  }
})
