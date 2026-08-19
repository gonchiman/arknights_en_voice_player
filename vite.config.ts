import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/arknights_en_voice_player/',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'supabase',
              test: /node_modules[\\/]@supabase[\\/]/,
              priority: 20,
            },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  plugins: [react()],
})
