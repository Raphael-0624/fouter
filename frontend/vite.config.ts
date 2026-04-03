import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/fouter/',
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:80',
      '/v1': 'http://localhost:80'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
