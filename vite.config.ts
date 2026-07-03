import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served from the root of its own subdomain (bunch-demo.ryanmohammad.com),
  // not from a /bunch-demo/ sub-path anymore.
  base: '/',
  plugins: [react()],
});
