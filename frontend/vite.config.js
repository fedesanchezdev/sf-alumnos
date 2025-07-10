import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/alumnos/', // Base path para el subdirectorio
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
