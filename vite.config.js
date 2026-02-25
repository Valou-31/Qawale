import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      '/socket.io': {
        // En Docker, SOCKET_SERVER_URL=http://server:3001 (nom du service)
        // En local, on laisse le défaut http://localhost:3001
        target: process.env.SOCKET_SERVER_URL || 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
