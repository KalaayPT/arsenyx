import satori from "satori";
import sharp from "sharp";
import { loadFonts } from "./font";
import { BuildCardTemplate, type BuildCardProps } from "./build-card";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Fetch an image and return as base64 data URI for embedding in satori.
 * Returns undefined if fetch fails.
 */
async function fetchImageAsDataUri(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return undefined;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") ?? "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return undefined;
  }
}

export interface RenderBuildImageInput {
  buildState: BuildCardProps["buildState"];
  buildName: string;
  itemName: string;
  authorName: string;
  itemImageUrl?: string; // CDN URL (will be fetched and converted to base64)
}

/**
 * Render a build card as a PNG buffer.
 */
export async function renderBuildImage(
  input: RenderBuildImageInput
): Promise<Buffer> {
  const [fonts, itemImageSrc] = await Promise.all([
    loadFonts(),
    input.itemImageUrl
      ? fetchImageAsDataUri(input.itemImageUrl)
      : Promise.resolve(undefined),
  ]);

  const element = BuildCardTemplate({
    buildState: input.buildState,
    buildName: input.buildName,
    itemName: input.itemName,
    authorName: input.authorName,
    itemImageSrc,
  });

  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return png;
}
