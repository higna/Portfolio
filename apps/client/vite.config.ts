import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const rootDir = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  envDir: rootDir,
  plugins: [react(), tailwindcss()],
  server: {
    port: 2000,
    watch: {
      // Polling avoids inotify ENOSPC failures on dev machines with many watchers.
      usePolling: process.env.VITE_USE_POLLING !== 'false',
      interval: 1000,
    },
  },
});
