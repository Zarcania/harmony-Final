import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Site servi à la racine du domaine (Apache cPanel):
  // la valeur par défaut est '/', on l'explicite pour éviter toute régression
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    host: true, // permet d'accéder via l'IP de la machine si besoin, tout en gardant localhost:5173
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
