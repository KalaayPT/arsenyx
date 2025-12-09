Implementation Plan: Build Guide & Description Editor
=====================================================

Overview
--------
- Add a rich-text editor for builds using shadcn-editor.
- Trigger it from a single `Open Guide` button on the build page.
- Allow editing and saving both a build "Guide" and "Description".


1. Data Model & API
-------------------
- Extend the build model (DB + TypeScript) with:
  - `guide: string | null`
  - `description: string | null`
- Add or extend a server action/API endpoint, e.g. `updateBuildGuide(buildId, { guide, description })`:
  - Validates the caller can edit the build.
  - Persists `guide` and `description` for the specified `buildId`.
- Ensure build detail loading already returns `id`, `guide`, and `description` so the editor can be seeded with current values.


2. Install & Configure shadcn-editor
------------------------------------
- Follow `https://shadcn-editor.vercel.app/docs`:
  - Install the editor package and any peer dependencies.
  - Import any required CSS and fonts in the global layout (e.g. `src/app/layout.tsx`).
  - If the editor requires a provider (theme, tiptap, etc.), wrap the relevant part of the tree (likely at the app root).
- Decide the stored content format:
  - Prefer HTML or JSON consistently for both `guide` and `description`.
  - Match the recommended format from shadcn-editor for easiest rendering later.


3. Create `GuideEditorDialog` Component
--------------------------------------
- File: `src/components/GuideEditorDialog.tsx` (or similar shared components folder).
- Props:
  - `buildId: string`
  - `initialGuide?: string | null`
  - `initialDescription?: string | null`
  - Optional callbacks: `onSaved?(payload: { guide: string; description: string })`
- Internal state:
  - `open: boolean` (dialog open/closed state).
  - `activeTab: "guide" | "description"` (which text the editor is showing).
  - `guideValue: string` and `descriptionValue: string` (editor content).
  - `isSaving: boolean` (save in-flight).
- Structure using shadcn/ui `Dialog`:
  - `DialogTrigger`:
    - A button labeled `Open Guide` (primary/secondary as fits the UI).
  - `DialogContent`:
    - Title: e.g. `Edit Build Guide`.
    - Optional description text explaining what the guide is for.
    - Tabs (shadcn `Tabs`) to switch between:
      - `Guide`
      - `Description`
    - Body:
      - A single shadcn-editor instance whose content depends on `activeTab`:
        - `value = activeTab === "guide" ? guideValue : descriptionValue`
        - `onChange` updates the corresponding state.
    - Footer:
      - `Cancel` button: closes the dialog, discarding unsaved changes.
      - `Save` button: triggers the server update; disabled while `isSaving`.


4. Wire Up the Editor
---------------------
- Inside `GuideEditorDialog`, integrate shadcn-editor:
  - Import the editor component from shadcn-editor.
  - Pass:
    - `value` (HTML/JSON string).
    - `onChange` callback to update `guideValue` or `descriptionValue` based on `activeTab`.
  - Configure toolbar:
    - Headings, bold/italic/underline.
    - Lists, links, code blocks, etc. as desired.
- Handle initial values:
  - On mount/open, seed `guideValue` and `descriptionValue` with `initialGuide` / `initialDescription` (fallback to `""`).
  - If the dialog can be reopened with updated props, consider resetting state when `buildId` or `initial*` props change.


5. Save Behavior
----------------
- `onClick` of `Save`:
  - Set `isSaving = true`.
  - Call the server action/API `updateBuildGuide(buildId, { guide: guideValue, description: descriptionValue })`.
  - On success:
    - Optionally invoke `onSaved` to allow the parent to update local state (e.g. sidebar preview).
    - Show a toast via shadcn/ui `useToast` (e.g. `Guide updated`).
    - Close the dialog (`setOpen(false)`).
  - On failure:
    - Show an error toast (e.g. `Failed to save guide`).
    - Keep the dialog open to allow retry.
  - Always set `isSaving = false` in a `finally` block.


6. Integrate on Build Page
--------------------------
- In the build details page/component (e.g. `src/app/builds/[id]/page.tsx` or `src/components/builds/BuildDetail.tsx`):
  - Ensure `build` includes `id`, `guide`, and `description`.
  - Render the dialog trigger via the new component:
    - `<GuideEditorDialog buildId={build.id} initialGuide={build.guide} initialDescription={build.description} onSaved={handleGuideSaved} />`
- `handleGuideSaved` can:
  - Update local component state for `guide` and `description`.
  - Or call `router.refresh()` (Next.js app router) to re-fetch fresh data.
- Place the `Open Guide` button:
  - Near other build actions (save/share).
  - Or in a sidebar section labeled “Guide / Notes”.


7. Render Guide & Description for Users
---------------------------------------
- Decide where the guide and description should appear:
  - Build summary sidebar.
  - Dedicated “Guide” tab on the build view.
- Implement rendering component(s) (e.g. `BuildGuideView`, `BuildDescriptionView`):
  - Accept HTML/JSON from `build.guide` and `build.description`.
  - Use the renderer recommended by shadcn-editor:
    - If HTML, sanitize before `dangerouslySetInnerHTML`.
    - If JSON (tiptap or similar), use the provided render utility/component.
- Style the rendered content to match the rest of the app typography.


8. Optional Enhancements
------------------------
- Auto-save:
  - Periodically call the save action while the dialog is open.
  - Show subtle “Saved” / “Saving…” indicators.
- Unsaved changes guard:
  - Track dirty state; confirm before closing the dialog if there are unsaved edits.
- Per-build versioning:
  - Keep a history of guide changes for rollback (future feature).
- Permissions:
  - Only show `Open Guide` to users allowed to edit the build; show read-only render otherwise.

