import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@engine': resolve(__dirname, 'src/engine'),
      '@packs': resolve(__dirname, 'src/packs'),
    },
  },
})
