import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],

  // Фронт и API на одном домене, сайт отдаётся из корня — базовый путь всегда '/'.
  // Возни с базовым путём, как на GitHub Pages, больше нет.
  base: '/',

  server: {
    port: 5173,
    // В разработке фронт на 5173, API на 3000. Прокси делает так, что
    // в коде можно писать относительные адреса и не думать про CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
