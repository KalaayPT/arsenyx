# Build Image Generation — Design Spec

**Date:** 2026-03-21
**Status:** Approved
**Scope:** Generate shareable PNG build card images for Discord/Reddit

---

## Overview

Users can copy or download a build card image from the build page Share dropdown. The image shows the item, mod layout, arcanes, and build metadata in a 1200x630 card format — ready to paste into Discord or upload to Reddit.

## Use Case

Primary: Share builds visually on Discord/Reddit. User clicks "Copy Image" on a build page, pastes directly into Discord chat. "Download Image" as fallback for Reddit/forums.

---

## API Endpoint

**Route:** `GET /api/builds/[slug]/image`

- Fetches build by slug (public/unlisted builds only)
- Renders the build card using satori (JSX → SVG) + sharp (SVG → PNG)
- Returns `image/png` response with appropriate cache headers
- Rate limited: 10 images/min per IP using existing rate-limit pattern
- No authentication required
- Returns 404 for private/missing builds

**Visibility:** Uses `getBuildBySlug(slug)` with no `viewerId` — returns PUBLIC and UNLISTED builds, returns null for PRIVATE.

**Error responses:**
- 404: Build not found or private — return a simple JSON `{ error: "Build not found" }`
- 429: Rate limited — return JSON `{ error: "Too many requests" }`

**Response headers:**
- `Content-Type: image/png`
- `Cache-Control: public, max-age=60, stale-while-revalidate=300`

---

## Image Layout (1200x630)

Dark background matching the site theme. Horizontal flexbox layout (satori-compatible).

### Header Row
- Item thumbnail (64x64) from WFCD CDN
- Build name (large text)
- Item name, author, forma count (smaller text)
- "ARSENYX" branding text in top-right corner

### Mod Grid
- Aura slot + Exilus slot (top row, if present)
- 8 normal mod slots in 4x2 grid
- Each mod card: colored background/border based on rarity, mod name, rank badge
- Empty slots shown as dim placeholders

### Arcane Row
- Arcane names + rank badges (below mod grid)
- Only shown if arcanes are equipped

### Visual Style
- Simplified mod cards — NOT the existing CompactModCard components (satori only supports flexbox + basic CSS, no layered PNGs)
- Rarity colors from existing `mod-card-config.ts` constants
- Polarity icons rendered inline where relevant
- Geist font (already used by the project)

---

## Share Button Updates

Add a `buildSlug: string` prop to `ShareButtonProps`. Parent page passes `build.slug`.

Add two new options to the existing `DropdownMenu` in `src/components/build/share-button.tsx`:

### "Copy Image"
- Fetches `GET /api/builds/[slug]/image` as blob
- Uses `navigator.clipboard.write()` with `ClipboardItem` to copy PNG to clipboard
- Shows `toast.success("Image copied!")` on success
- Falls back to download if clipboard API unavailable

### "Download Image"
- Fetches same endpoint as blob
- Creates a temporary `<a>` with blob URL and `download` attribute
- Triggers download as `{buildName}-{itemName}.png`

Both options show a loading state while the image is being generated (~200-500ms).

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/api/builds/[slug]/image/route.ts` | GET endpoint — fetch build, call renderer, return PNG |
| `src/lib/image/build-card.tsx` | Satori-compatible JSX template for the 1200x630 card |
| `src/lib/image/render.ts` | `renderBuildImage()` — orchestrates satori + sharp pipeline |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/build/share-button.tsx` | Add "Copy Image" and "Download Image" dropdown items |
| `src/lib/rate-limit.ts` | Add `imageLimiter` (10/min per IP) |

---

## Dependencies

- `satori` — Converts JSX to SVG. Requires font data as `ArrayBuffer`.
- `sharp` — Converts SVG to PNG. Already available via Next.js (verified). Add to `serverExternalPackages` in `next.config.ts` alongside `"pg"` to prevent bundling issues.
- `geist` — Add as explicit dependency (`bun add geist`) to access `.woff` font files. Satori needs the font loaded as `ArrayBuffer` via `fs.readFile()`. Load from `node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff`.

---

## Technical Constraints

### Satori Limitations
- Only supports flexbox (no CSS grid)
- `position: absolute` works within `position: relative` containers (use sparingly)
- Supports `linear-gradient` and `radial-gradient` with color stops
- No `box-shadow`, `backdrop-filter`, `filter`, `conic-gradient`, or complex `transform`
- Images must be fetched as ArrayBuffer and embedded — no `<Image>` component
- Font must be loaded as `ArrayBuffer` and passed to satori `fonts` option

### Text Truncation
- Build name: max ~40 chars, truncate with ellipsis (`overflow: hidden`, `textOverflow: ellipsis`, `whiteSpace: nowrap`)
- Item name: max ~30 chars, same truncation
- Mod names: max ~20 chars, truncate with ellipsis
- Satori does NOT auto-truncate — explicit CSS required on each text element

### Empty Builds
- If a build has zero mods, show the empty slot placeholders (same as normal). This is an uncommon edge case and the grid layout still looks coherent with placeholders.

### Image Fetching
- Item images from `cdn.warframestat.us` need to be fetched server-side and passed as base64/ArrayBuffer to satori
- Mod images from the same CDN
- If an image fails to load, use a placeholder or skip

### Performance
- Target: <500ms generation time
- No caching for now (on-demand generation)
- Satori is fast (~50-200ms for JSX→SVG), sharp is fast (~50-100ms for SVG→PNG)
- Image fetching is the bottleneck — fetch item + mod images in parallel

---

## Not In Scope

- OpenGraph/social card auto-embeds (can add later using same template)
- Multiple templates (compact, stats-only, etc.)
- Image caching / `GeneratedImage` model usage
- ApiKey authentication (public endpoint with rate limiting only)
- Archon shard display on the card
