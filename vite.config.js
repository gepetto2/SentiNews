import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Sentiment Map",
        short_name: "SentimentMap",
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        icons: [
          {
            src: "/app-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/app-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
