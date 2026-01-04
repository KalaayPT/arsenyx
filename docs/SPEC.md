# Build Guide Editor Rework

## Overview

Replace the complex Lexical WYSIWYG editor with a simpler markdown-based guide system, and add partner builds linking functionality.

---

## Current State

- Lexical WYSIWYG editor with 15+ plugins (images, embeds, tables, code highlighting, etc.)
- Single `content` field stored as JSON blob
- Overkill for the actual use case

---

## New Guide Structure

### 1. Summary (optional)
- 3-line textarea with 400 character limit
- Character counter shown only when >300 chars (approaching limit)
- Not displayed on browse/list pages (keep build cards minimal)
- Displayed on build detail page only

### 2. Partner Builds (optional)
- Link related builds (exalted weapons, companions, specific weapon builds, etc.)
- **Maximum 10 partner builds** per build (hard limit)
- **Own builds only**: Can only link builds you created
- **Any visibility**: Can link to any of your own builds (public, unlisted, or private)
- **NOT auto-bidirectional**: Each build manages its own partner list independently
  - Build A can link to Build B without B linking back
  - Prevents "20 frames pointing to 1 weapon" flooding that weapon's partner list
- **Visibility inheritance on view**: Partner links only shown to viewers who can access both builds
  - If all partner builds are inaccessible, hide the entire Partner Builds section
  - Example: Public build links to unlisted build → viewers without the unlisted link see nothing

### 3. Description (optional)
- Raw markdown textarea with toggle preview mode
- Preserve approximate scroll position when switching edit/preview
- Basic toolbar: bold, italic, link, heading, list
- Smart toolbar behavior: wrap if text selected, otherwise insert with placeholder selected
- Images via external URLs only (`![alt](https://...)`) - no upload/storage
- Rendered with react-markdown on view page
- Basic syntax highlighting for code blocks (common languages)
- Show full content on view page, no truncation

---

## Partner Builds UI/UX Details

### Editor: Partner Build Selector
- Type-to-search combobox (not dropdown of all builds)
- Search results show: `Build Name (Category)` format (e.g., "Steel Path Slayer (Warframe)")
- Already-linked builds appear grayed out/disabled with "Already linked" indicator
- Current build filtered from search results (prevent self-linking)
- If user has no other builds: show disabled section with message "Create more builds to link partners"

### Editor: Removing Partner Links
- X button on partner card
- Confirmation dialog: "Remove this partner build?"

### View: Partner Build Cards
- Minimal display: item image, build name, forma count
- Full card is clickable (navigates to that build)
- Position: below the description section

### View: Deleted Build Placeholder
- If a linked build is deleted, show static "Build no longer available" placeholder card
- Non-interactive (no click action)

---

## Guide Editor Dialog UX

### Layout
```
┌─────────────────────────────────────────────┐
│ Build Guide                            [X]  │
├─────────────────────────────────────────────┤
│ Summary                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Brief description of this build...      │ │
│ │                                  356/400│ │ ← only when >300
│ └─────────────────────────────────────────┘ │
│                                             │
│ Partner Builds                              │
│ ┌─────────────────────────────────────────┐ │
│ │ [Search your builds...              v]  │ │
│ │ ┌─────────┐ ┌─────────┐                 │ │
│ │ │Exalted  │ │Companion│                 │ │
│ │ │Blade [x]│ │Build[x] │                 │ │
│ │ └─────────┘ └─────────┘                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Description                 [Edit|Preview]  │
│ ┌─────────────────────────────────────────┐ │
│ │ [B][I][H][Link][List]                   │ │ ← basic toolbar
│ ├─────────────────────────────────────────┤ │
│ │ ## Playstyle                            │ │
│ │ This build focuses on...                │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│                      [Save]  [Save & Close] │
│                      (secondary)  (primary) │
└─────────────────────────────────────────────┘
```

### Save Behavior
- Single save: one action saves summary, partners, and description together
- "Save & Close" (primary): save and close dialog
- "Save" (secondary): save and remain in editor

### Draft & Close Behavior
- NO localStorage auto-save
- Unsaved changes warning: confirm "Discard unsaved changes?" when closing with edits
- To "delete" a guide: clear all fields and save (no explicit delete action)

---

## Build View Page: Guide Section

### For builds with a guide:
1. Summary (if present)
2. Description (rendered markdown, if present)
3. Partner Builds section (if any accessible partner builds)

### For builds without a guide:
- Show "No guide yet" message to all viewers
- Build owner sees "Edit Guide" button

---

## Schema Changes

```prisma
model BuildGuide {
  id          String   @id @default(cuid())
  buildId     String   @unique
  build       Build    @relation(...)

  summary     String?  @db.VarChar(400)  // Short summary, 400 char limit
  description String?  @db.Text          // Raw markdown

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Partner builds: explicit many-to-many (not auto-bidirectional)
model Build {
  // ... existing fields

  // Builds this build links TO as partners
  partnerBuilds   Build[] @relation("PartnerBuilds")
  // Builds that link TO this build (inverse, for querying)
  partneredBy     Build[] @relation("PartnerBuilds")
}
```

Note: The `partnerBuilds` relation is directional. If Build A adds Build B as a partner, only A's `partnerBuilds` contains B. B's `partneredBy` would contain A, but B's `partnerBuilds` would not.

---

## Migration Plan

### Data Migration
- **Discard all existing Lexical content** - clean break, users re-write in markdown
- Drop the `content` column from BuildGuide table entirely

### Dependency Cleanup
- Remove all Lexical packages from package.json:
  - `lexical`
  - `@lexical/*` (all scoped packages)
  - Any related plugins/dependencies

### File Changes
1. **Delete**: `src/components/blocks/editor-x/` (entire Lexical editor directory)
2. **Replace**: `guide-editor-dialog.tsx` → new simple form component
3. **Replace**: `guide-reader.tsx` → react-markdown renderer
4. **New**: Partner build selector component
5. **Update**: Build display pages to show partner builds section

---

## Implementation Steps

1. **Schema Updates**
   - Update Prisma schema: BuildGuide fields (drop content, add summary/description)
   - Add partner builds relation on Build model
   - Run `bunx prisma db push`

2. **Remove Lexical**
   - Delete `src/components/blocks/editor-x/` directory
   - Remove Lexical packages from package.json
   - Run `bun install` to clean up

3. **Create Guide Editor Components**
   - New `guide-editor-dialog.tsx` with:
     - Summary textarea (400 char limit, counter at >300)
     - Partner build search/selector combobox
     - Markdown textarea with toggle preview
     - Basic toolbar (bold, italic, link, heading, list)
     - Save + Save & Close buttons
     - Unsaved changes warning

4. **Create Partner Build Selector**
   - Type-to-search combobox
   - Filter: user's own builds (any visibility), exclude current build and already-linked
   - Display: name + category
   - Remove with confirmation dialog

5. **Create Guide Viewer**
   - react-markdown renderer with:
     - Basic syntax highlighting (common languages)
     - External image support
   - Partner builds cards section (minimal: image, name, forma)
   - Full card clickable navigation

6. **Update Server Actions**
   - CRUD for new schema (summary, description, partner links)
   - Visibility checks for partner build access
   - 10 partner limit enforcement

7. **Update Build Pages**
   - Add "No guide yet" / "Edit Guide" empty state
   - Render guide section with summary, description, partners
   - Partner cards below description

---

## Technical Notes

### Markdown Rendering
- Use `react-markdown` (~30KB gzipped)
- Add syntax highlighting plugin for common languages (~15KB extra)
- Support standard markdown + external images

### Partner Build Visibility
```typescript
// When fetching partner builds for display:
const visiblePartners = build.partnerBuilds.filter(partner =>
  userCanAccessBuild(currentUser, partner)
);

// Hide entire section if no visible partners
if (visiblePartners.length === 0) {
  return null;
}
```

### Character Counter
```typescript
// Only show when approaching limit
{summary.length > 300 && (
  <span className="text-muted-foreground text-sm">
    {summary.length}/400
  </span>
)}
```
