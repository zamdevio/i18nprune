import nextra from "nextra";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Monorepo root (has pnpm-lock.yaml). Turbopack needs this in Next 16 + pnpm workspaces so `next` resolves. */
const monorepoRoot = resolve(__dirname, "..", "..");

// Nextra v4 - theme is configured in app/layout.tsx, not here
// Content directory is automatically detected from the content/ folder
const withNextra = nextra({
  // Add Nextra-specific options here if needed
});

export default withNextra({
  // pnpm monorepo: default Turbo root inference breaks `next build` (cannot resolve `next` from `app/`).
  turbopack: {
    root: monorepoRoot,
  },
  // Static export configuration for Cloudflare Pages and Vercel
  output: 'export',
  distDir: 'out',
  
  // Disable image optimization for static export (not needed for docs)
  images: {
    unoptimized: true,
  },
  // Ensure all routes are statically generated
  generateBuildId: async () => {
    // Use a static build ID for consistent builds
    return 'static-build'
  },
});
