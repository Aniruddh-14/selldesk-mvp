import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/gemini': {
        target: 'https://generativelanguage.googleapis.com',
        rewrite: (path) => path.replace(/^\/api\/gemini/, ''),
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
