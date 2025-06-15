import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
  plugins: [
    react(),
    imagetools() // Add image optimization
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Core libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['tailwindcss', '@headlessui/react', '@heroicons/react'],
          
          // Application code
          'app-core': ['./src/App.tsx', './src/main.tsx'],
          'app-components': ['./src/components/BlueprintYourSound.tsx', './src/components/TrackGuide.tsx'],
          'app-midi': ['./src/components/MidiGeneratorComponent.tsx', './src/services/midiService.ts', './src/services/audioService.ts'],
          'app-services': ['./src/services/geminiService.ts', './src/services/apiService.ts']
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true
  }
});
