import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Aponta para a raiz
  server: {
    port: 5173,
  },
});
