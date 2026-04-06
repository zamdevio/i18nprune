import nextra from "nextra";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Nextra v4 - theme is configured in app/layout.tsx, not here
// Content directory is automatically detected from the content/ folder
const withNextra = nextra({
  // Add Nextra-specific options here if needed
});

export default withNextra({
  // When this app lives inside a repo that has another lockfile at the parent, pin Turbopack root here.
  turbopack: {
    root: __dirname,
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
