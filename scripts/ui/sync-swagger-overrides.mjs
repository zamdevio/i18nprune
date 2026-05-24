#!/usr/bin/env node
/**
 * Regenerate packages/ui/src/swagger/overrides-css.ts from swagger-overrides.css.
 * Run after editing the CSS source (worker /docs inlines the TS export).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

const cssPath = path.join(repoRoot, 'packages/ui/src/styles/swagger-overrides.css');
const outPath = path.join(repoRoot, 'packages/ui/src/swagger/overrides-css.ts');

const header = `/**
 * Bundled swagger-ui overrides (inlined for worker bundles).
 * Keep in sync with ../styles/swagger-overrides.css.
 * Regenerate: pnpm ui:sync:swagger-css
 */
`;

function escapeForTemplateLiteral(css) {
  return css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function main() {
  if (!fs.existsSync(cssPath)) {
    console.error(`sync-swagger-overrides: missing source: ${cssPath}`);
    process.exit(1);
  }

  const css = fs.readFileSync(cssPath, 'utf8');
  const next = `${header}export const swaggerOverridesCss = \`${escapeForTemplateLiteral(css)}\`.trim();\n`;

  let previous = null;
  if (fs.existsSync(outPath)) {
    previous = fs.readFileSync(outPath, 'utf8');
  }

  if (previous === next) {
    console.log('sync-swagger-overrides: overrides-css.ts already up to date');
    return;
  }

  fs.writeFileSync(outPath, next, 'utf8');
  console.log(`sync-swagger-overrides: wrote ${path.relative(repoRoot, outPath)}`);
}

main();