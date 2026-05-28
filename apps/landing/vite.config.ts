import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

function vendorChunkByPackage(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  const match = id.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/);
  const pkg = match?.[1];
  if (!pkg) return undefined;
  if (pkg === 'motion' || pkg === 'shiki') return undefined;
  const normalized = pkg.replace('@', '').replace('/', '-');
  return `vendor-${normalized}`;
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: vendorChunkByPackage,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
