/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // Setting base to '/' ensures assets load correctly on snhu.aibry.shop
    base: '/',
    
    plugins: [react(), tailwindcss(), cloudflare()],

    define: {
      // Allows access to the API key via process.env.GEMINI_API_KEY in non-Vite contexts if needed
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        // Updated to point specifically to the src directory for cleaner imports
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      // HMR is managed here to ensure stability during your local dev sessions
      hmr: process.env.DISABLE_HMR !== 'true',
      // Useful for testing on mobile devices over the same WiFi
      host: true, 
    },

    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // Optimizes the build for Vercel deployment
      minify: 'esbuild',
    }
  };
});