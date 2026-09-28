import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the app from /tracemind/; locally it lives at /
  base: process.env.VITE_BASE ?? '/',
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8000' },
    // the browser analyzer imports ../server/app/analyzer.py directly
    fs: { allow: ['..'] },
  },
})
