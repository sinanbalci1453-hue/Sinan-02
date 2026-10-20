import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: "Benim Yapay Zekâm - Akıllı Stüdyo & Otopilot",
          short_name: "Benim AI",
          description: "Sıfır ayar ve anahtarsız çalışan; 4K görsel, video, seslendirme, sosyal medya otopilotu ve canlı görüntülü görüşme stüdyosu.",
          theme_color: "#2563eb",
          background_color: "#0b0f19",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable"
            },
            {
              src: "/icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any"
            }
          ],
          shortcuts: [
            {
              name: "Sohbet & Akıllı Asistan",
              short_name: "Sohbet",
              description: "Yapay zekâ ile anında sohbet başlat",
              url: "/?tab=chat",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            },
            {
              name: "4K Görsel Üretimi",
              short_name: "Fotoğraf",
              description: "Ultra gerçekçi 4K görseller oluştur",
              url: "/?tab=image",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            },
            {
              name: "Video & Sinematik Stüdyo",
              short_name: "Video",
              description: "60s sinematik videolar üret",
              url: "/?tab=video",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            },
            {
              name: "Sosyal Medya Otopilotu",
              short_name: "Sosyal",
              description: "Instagram, X ve WhatsApp otomasyonu",
              url: "/?tab=social",
              icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
