import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/tickets': 'http://localhost:8000',
      '/documents': 'http://localhost:8000',
      '/ask': 'http://localhost:8000',
    }
  }
})
