import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'b1a4506be3a69034-95-20-93-248.serveousercontent.com',
      '5cc6c1934724d087-150-214-127-95.serveousercontent.com',
      'bb2352cbac0ab4b9-150-214-127-95.serveousercontent.com',
      'b4869f616229d93f-95-20-81-23.serveousercontent.com',
      '5be2e24b2c5dc43b-95-20-81-23.serveousercontent.com',
      'f6f5-84-78-244-194.ngrok-free.app',
      'joziah-lithest-noncentrally.ngrok-free.dev'
    ],
    watch: {
      usePolling: true
    }
  }
})
