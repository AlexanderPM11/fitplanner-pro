import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'FitPlanner Pro',
        short_name: 'FitPlanner',
        description: 'Planifica y registra tu progreso desde el móvil.',
        theme_color: '#07100d',
        background_color: '#07100d',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://localhost:5035', changeOrigin: true },
      '/health': { target: 'http://localhost:5035', changeOrigin: true },
    },
  },
});
