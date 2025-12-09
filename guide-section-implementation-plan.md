# Guide Section Implementation Plan
Last updated: 2025-12-09

## Goals
- Add a general-purpose guides area (e.g., Railjack primer, Endo farming, Focus) separate from build-specific guides but still able to reference builds.
- Reuse the existing `Editor` used in build guides for authoring and rendering, keeping serialization compatible with current storage.
- Ship quickly with mock/seed data, keeping API and storage layers swappable for future backend support.

## Content model
- `Guide`: `id/slug`, `title`, `summary`, `category` (enum: systems/resources/modes/warframes/gear), `tags[]`, `coverImage`, `readingTime`, `updatedAt`, `author`, `content` as `SerializedEditorState`, `relatedBuildIds[]` (optional), `relatedGuideIds[]` (optional).
- Draft vs published flag to separate WIP content from listings.
- Seed a few examples: Railjack basics, Endo farming routes, Mod fusion/endo efficiency.

## Pages & IA
- `/guides`: list with search, category/tag filters, sort (recent/default). Cards show title, summary, category pill, updated date, reading time.
- `/guides/[slug]`: render lexical content; show metadata, category/tags, updated date, related guides, and “Builds referenced” populated from build IDs.
- Navigation: add “Guides” to main nav and footer; breadcrumb on detail pages; surface 3–5 featured guides on homepage or a hero strip.

## Fumadocs-inspired UX
- Shell: left sidebar (categories/tags tree), sticky top bar with search and breadcrumbs, main content with fumadocs prose styling (typography, spacing, code blocks, callouts).
- Reader view: simple, read-only header with title, summary, “Last updated,” reading time, and category/tag pills; guides like Affinity/Endo/Railjack open directly from the list or sidebar.
- Actions: top-right “New guide” button on `/guides` visible only to authorized users; on `/guides/[slug]`, show “Edit/Publish” controls only when authorized.
- Styling: import fumadocs theme tokens into Tailwind (colors, fonts, spacing); wrap rendered content in a `prose` container tuned to the fumadocs look; align code block and callout styles to match.

## Auth and publishing
- Roles: `editor`/`admin` can create, edit, and publish; readers see only published guides.
- States: draft vs published; list and sidebar use published guides, while authorized users can open draft preview.
- CTA behavior: conditionally render top-right “New guide” (list) and “Edit/Publish” (detail) when authorized; hide otherwise.

## Editing workflow
- Authoring UI uses existing `Editor` component with the same toolbar/state shape. Include metadata form (title, category, tags, cover image).
- Autosave draft to localStorage keyed by `guide_<slug>`; explicit Publish/Update buttons for persisted state.
- Validation: require title + category + content (non-empty root).
- If/when auth exists, gate publish/edit; otherwise hide edit controls behind an env flag.

## Data layer
- Start with filesystem/JSON seed plus optional mock API route (Next API or route handlers) returning `Guide` objects.
- Wrap persistence in a small data module so backend swap (DB/supabase) does not touch UI.
- Client-side draft storage mirrors existing build-guide pattern; published data comes from the data module/API.

## Rendering
- Use the same lexical renderer as build guides; if missing, add a lightweight renderer for serialized nodes we use in the editor.
- Support code blocks, lists, images, callouts, and inline links as currently available in the editor.

## SEO & sharing
- Add page metadata (title/description/og image) per guide; canonical URLs for `/guides/[slug]`.
- Add basic JSON-LD Article schema and share/copy-link buttons on guide detail.

## Testing & quality
- Unit: serialization/deserialization of guide content; data module fetch for seed/mock.
- Component/integration: render `/guides/[slug]` with sample content and ensure metadata surfaces.
- Smoke: navigation to `/guides`, filter/search behavior, and draft autosave flow.

## Rollout steps
- Add content model/types + seed data.
- Build data module + mock API routes.
- Implement `/guides` list + `/guides/[slug]` detail with renderer.
- Add guide creation/edit UI leveraging existing `Editor`.
- Wire nav/footer entry points; add featured strip on homepage.
- Ship with 2–3 seeded guides; verify tests and manual smoke pass.
