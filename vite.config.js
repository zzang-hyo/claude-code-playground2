import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves a project site from /<repo-name>/, so every asset URL
// needs that prefix in production. Override with VITE_BASE_PATH if the repo
// is ever renamed or deployed elsewhere.
const base = process.env.VITE_BASE_PATH || '/claude-code-playground2/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: '2048 Puzzle',
        short_name: '2048',
        description: '방향키나 스와이프로 타일을 합쳐 2048을 만드는 퍼즐 게임',
        start_url: '.',
        display: 'standalone',
        background_color: '#faf8ef',
        theme_color: '#faf8ef',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only precache our own build output; never let the service worker
        // intercept Firestore's realtime traffic.
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        navigateFallbackDenylist: [/^\/__/],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
