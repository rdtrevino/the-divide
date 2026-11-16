import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// In development the site runs on Vite and talks to the Worker started by `npm run dev -w @divide/server`.
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 5173,
    fs: { allow: ['../../..'] },
    proxy: { '/api': { target: 'http://127.0.0.1:8787', ws: true, changeOrigin: true } },
  },
  build: { target: 'es2022', sourcemap: false },
});
