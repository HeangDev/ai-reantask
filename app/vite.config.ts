import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The API only allows this origin by default (CORS_ALLOWED_ORIGINS).
  server: { port: 3000 },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
