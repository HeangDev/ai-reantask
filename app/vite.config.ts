import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The API only allows port 3000 by default (CORS_ALLOWED_ORIGINS), so fail instead of moving to another port.
  server: { port: 3000, strictPort: true },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
})
