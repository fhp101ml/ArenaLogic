import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'b1a4506be3a69034-95-20-93-248.serveousercontent.com'
    ]
  }
})
