import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Site servi à la racine du domaine (Apache cPanel):
  // la valeur par défaut est '/', on l'explicite pour éviter toute régression
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
