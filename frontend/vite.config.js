import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://backend:8000',
                changeOrigin: true,
                rewrite: (path) => path,
            },
        },
    },
    test: {
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        globals: true,
    },
});
