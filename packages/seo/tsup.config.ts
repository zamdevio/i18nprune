import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'vite/index': 'src/vite/index.ts',
    'assets/sync': 'src/assets/sync.ts',
    'og/index': 'src/og/index.ts',
    'pages/middleware': 'src/pages/middleware.ts',
  },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  clean: true,
  dts: true,
  splitting: false,
  treeshake: true,
  external: ['@resvg/resvg-wasm', '@resvg/resvg-wasm/index_bg.wasm'],
});
