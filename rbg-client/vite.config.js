// vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    // Add the configuration object to the plugin
    tailwindcss({
      // This is the crucial part for your Linux build!
      // Ensure this path matches your folder's casing EXACTLY.
      content: ['./src/**/*.{js,jsx,ts,tsx}'], 
    }),
  ],
})