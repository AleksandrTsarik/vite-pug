import { defineConfig } from 'vite'

export default defineConfig({
  root: 'dist', // Vite запускается из dist
  server: {
    port: 5173,
    open: true
  }
})