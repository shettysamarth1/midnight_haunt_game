import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths so assets load correctly in all environments
  server: {
    port: 5173,
    open: true
  }
});
