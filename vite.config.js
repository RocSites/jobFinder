import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['mongodb']  // do NOT bundle server-side packages
  }
});
