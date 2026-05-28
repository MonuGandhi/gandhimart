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
      injectRegister: false,
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
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait',
        dir: 'ltr',
        lang: 'en',
        scope: '/',
        scope_extensions: [
          {
            type: 'origin',
            origin: 'https://gandhimart-c9e7.vercel.app'
          }
        ],
        shortcuts: [
          {
            name: 'Search Groceries',
            short_name: 'Search',
            description: 'Search for fresh groceries and delivery items',
            url: '/search',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'My Cart',
            short_name: 'Cart',
            description: 'View your grocery shopping cart',
            url: '/cart',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Track Order',
            short_name: 'Track',
            description: 'Check active delivery status',
            url: '/orders',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
          }
        ],
        launch_handler: {
          client_mode: ['focus-existing', 'auto']
        },
        start_url: '/',
        categories: ['shopping', 'food', 'lifestyle'],
        prefer_related_applications: false,
        related_applications: [
          {
            platform: 'windows',
            url: 'https://gandhimart-c9e7.vercel.app/',
            id: 'GandhiMart.App'
          }
        ],
        iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
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
