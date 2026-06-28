import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        // Vendors isolés : mis en cache au-delà des déploiements et téléchargés
        // en parallèle du code applicatif au lieu d'un seul gros chunk bloquant.
        advancedChunks: {
          groups: [
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            // STT local (Whisper) : chunk dédié, tiré en dynamic-import au 1er usage
            // de la saisie vocale seulement. Exclu du précache PWA (globIgnores).
            { name: 'transformers', test: /node_modules[\\/](@huggingface|onnxruntime-web)[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        // Saisie vocale (outil juge, non public) : on NE précache RIEN du STT local.
        // Un visiteur lambda ne doit jamais le télécharger ; ces assets ne sont tirés
        // qu'à la visite de /judge/voix, au runtime. On ignore le chunk transformers
        // ET les binaires onnxruntime (.wasm, jusqu'à ~24 Mo). Les poids du modèle
        // Whisper viennent du CDN Hugging Face → hors dist, jamais précachés non plus.
        globIgnores: ['**/transformers-*.js', '**/*.wasm', '**/ort-*', '**/jszip*'],
      },
      manifest: {
        name: 'WakeRef',
        short_name: 'WakeRef',
        description: 'Référentiel de figures wakeboard & wakeskate',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
