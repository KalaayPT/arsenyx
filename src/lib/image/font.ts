import { readFile } from "node:fs/promises";
import { join } from "node:path";

let regularFontCache: ArrayBuffer | null = null;
let boldFontCache: ArrayBuffer | null = null;

async function loadFontFile(filename: string): Promise<ArrayBuffer> {
  const fontPath = join(
    process.cwd(),
    "node_modules/geist/dist/fonts/geist-sans",
    filename
  );
  const buffer = await readFile(fontPath);
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}

/**
 * Load Geist fonts as ArrayBuffers for satori.
 * Cached after first load.
 */
export async function loadFonts(): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: "normal" }>
> {
  if (!regularFontCache) {
    regularFontCache = await loadFontFile("Geist-Regular.ttf");
  }
  if (!boldFontCache) {
    boldFontCache = await loadFontFile("Geist-Bold.ttf");
  }

  return [
    { name: "Geist", data: regularFontCache, weight: 400, style: "normal" as const },
    { name: "Geist", data: boldFontCache, weight: 700, style: "normal" as const },
  ];
}
