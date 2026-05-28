import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js']
      },
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'G Mart - Grocery Delivery',
        short_name: 'G Mart',
        description: 'Get groceries delivered in 10 minutes',
        theme_color: '#1CA672',
        background_color: '#1CA672',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
})
