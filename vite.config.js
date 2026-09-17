import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080
  },
  preview: {
    port: 8080
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          xlsx: ['xlsx']
        }
      }
    }
  }
});
