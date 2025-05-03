import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',
  },
  optimizeDeps: {
    include: ['react-bootstrap', 'bootstrap']
  },
  server: {
    port: 5002,
    host: true
  }
})
