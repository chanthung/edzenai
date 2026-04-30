# Stale-Cache Self-Healing: Kill-Switch + Build Banner

## Why
edzenai.com is healthy server-side (returns 200 OK), but users can hit a blank/stuck page when their browser holds an old service worker, cached HTML shell, or stale JS chunk pointing at deleted hashed files. This plan ships two small, safe mechanisms so this self-resolves without user action.

## What we'll add

### 1. Service-worker kill-switch (`public/sw-killswitch.js`)
A tiny script loaded from `index.html` that runs on every page load and:
- Calls `navigator.serviceWorker.getRegistrations()` and unregisters any SW found (we don't ship one, but past deploys or third-party tools may have registered one).
- Iterates `caches.keys()` and deletes every Cache Storage entry.
- Runs once per session (guarded by `sessionStorage` flag) so it's a no-op after the first load.
- Wrapped in `try/catch` and feature-detected — safe on every browser.

### 2. Chunk-load failure auto-recovery (in `src/main.tsx`)
React's lazy chunks fail with `ChunkLoadError` / `Failed to fetch dynamically imported module` when an old `index.html` references a hashed JS file that no longer exists after a redeploy. We add a global `window` listener:
- On `error` or `unhandledrejection` matching that pattern, set a `sessionStorage` flag and `location.reload()` once.
- The flag prevents reload loops (only one auto-reload per session).

### 3. Build version banner (bottom-right corner)
A tiny `<BuildBadge />` component rendered inside `App.tsx`:
- Shows `v{shortHash} · {buildDate}` in 10px muted text, fixed bottom-right, `pointer-events: none` except for a copy button on hover.
- Reads from `import.meta.env.VITE_BUILD_ID` and `VITE_BUILD_TIME`.
- Hidden on the parent view (`/view/:name/:token`) to keep that screen clean for parents.

### 4. Vite config — inject build metadata
In `vite.config.ts`, add a `define` block:
```ts
define: {
  'import.meta.env.VITE_BUILD_ID': JSON.stringify(
    process.env.VITE_BUILD_ID || Date.now().toString(36)
  ),
  'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
}
```
This guarantees every build has a unique ID even without CI env vars.

### 5. Cache-busting headers for `index.html`
Already correct on Lovable hosting (`cache-control: no-cache, must-revalidate, max-age=0` confirmed in earlier curl). No change needed — just noting it as the foundation that makes the above work.

## Files touched
- `public/sw-killswitch.js` — new
- `index.html` — add `<script src="/sw-killswitch.js"></script>` in `<head>` (synchronous, ~20 lines, runs before app boots)
- `src/main.tsx` — add chunk-error auto-reload listener
- `src/components/BuildBadge.tsx` — new, ~25 lines
- `src/App.tsx` — render `<BuildBadge />` once, route-aware
- `vite.config.ts` — add `define` block

## What this does NOT do
- Does not register a new service worker (we stay SW-free).
- Does not change any backend, RLS, or edge function.
- Does not affect the parent view layout.
- Does not break offline behavior (we have none today).

## Result
Next time a user hits a stale shell:
1. Kill-switch wipes any rogue SW + caches on first load.
2. If a chunk 404s mid-session, the page silently reloads once and recovers.
3. The version badge lets you (and support) instantly verify which build a user is on when they report an issue — just ask "what does the bottom-right say?"
