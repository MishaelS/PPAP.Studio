import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // File events from macOS bind mounts are unreliable inside Docker.
    watch: { usePolling: Boolean(process.env.DOCKER) },
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
