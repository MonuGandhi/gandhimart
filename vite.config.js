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
      injectRegister: 'inline',
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
        ],
        screenshots: [
          {
            src: '/screenshot-mobile.png',
            sizes: '771x1600',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'G Mart - Home Screen (Mobile)'
          },
          {
            src: '/screenshot-desktop.png',
            sizes: '1898x847',
            type: 'image/png',
            form_factor: 'wide',
            label: 'G Mart - Home Screen (Desktop)'
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
