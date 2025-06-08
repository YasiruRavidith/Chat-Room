import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx', // Apply JSX loader for .js files
    include: [
      // Only apply JSX loader to .js files in src directory
      'src/**/*.js',
      // Or be more specific if needed
      // 'src/components/**/*.js',
    ],
  },
})
