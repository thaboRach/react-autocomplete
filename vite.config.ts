/// <reference types="vitest" />

import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dts({ include: ['lib'], exclude: ['src'] })],
  // resolve: {
  //   alias: {
  //     '@src/': path.resolve(__dirname, './src'),
  //     '@lib/': path.resolve(__dirname, './lib'),
  //     root: path.resolve(__dirname, './'),
  //   },
  // },
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    copyPublicDir: false,
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom'],
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
  },
});
