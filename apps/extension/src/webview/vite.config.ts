import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function vendorChunkByPackage(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  const match = id.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/);
  const pkg = match?.[1];
  if (!pkg) return undefined;
  if (pkg === 'motion' || pkg === 'shiki') return undefined;
  if (pkg === '@shikijs/langs') {
    const lang = id.match(/@shikijs\/langs\/([^/.]+)/)?.[1];
    return lang ? `vendor-shiki-lang-${lang}` : 'vendor-shiki-langs';
  }
  const normalized = pkg.replace('@', '').replace('/', '-');
  return `vendor-${normalized}`;
}

export default defineConfig(() => {
  return {
    base: './',
    build: {
      outDir: path.resolve(__dirname, '../../dist/webview'),
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name].js',
          assetFileNames: 'assets/[name][extname]',
          manualChunks: vendorChunkByPackage,
        },
      },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      hmr: false,
    },
  };
});
