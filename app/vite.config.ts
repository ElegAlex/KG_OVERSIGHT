import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@features': resolve(__dirname, './src/features'),
      '@shared': resolve(__dirname, './src/shared'),
      '@data': resolve(__dirname, './src/data'),
    },
  },
  // Configuration pour le mode desktop Tauri
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
})
