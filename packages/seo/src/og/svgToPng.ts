import { initWasm, Resvg } from '@resvg/resvg-wasm';
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm';

import { loadOgFontBuffers } from './ogFonts.js';

let wasmReady: Promise<void> | undefined;

function ensureResvgWasm(): Promise<void> {
  if (!wasmReady) {
    wasmReady = initWasm(resvgWasm);
  }
  return wasmReady;
}

/** Rasterize OG SVG (1200×630) to PNG bytes for social crawlers. */
export async function renderSvgToPng(svg: string, origin: string): Promise<Uint8Array> {
  await ensureResvgWasm();
  const fontBuffers = await loadOgFontBuffers(origin);
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      fontBuffers,
      loadSystemFonts: false,
      defaultFontFamily: 'Outfit',
    },
  });
  return resvg.render().asPng();
}
