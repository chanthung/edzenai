# Teacher Portal as an Installable Offline App (PWA)

Turn the teacher side of EdZen AI into an app teachers can install on their phone home screen, launch full-screen, and use to mark attendance even when the network drops.

Nothing about the admin, platform, parent or landing experience changes. All work is additive.

## What teachers get

1. **Install prompt** — visiting `/progress` on a phone offers "Add to Home Screen". Tapping the EdZen icon opens the Teacher Dashboard full-screen, without browser chrome.
2. **Opens at the Teacher Dashboard** — launch target is `/progress`; signed-out users still land on login as today.
3. **Works offline** — the app shell loads without internet. Attendance marked while offline is queued on the device and uploaded automatically as soon as the phone reconnects, with a clear "Saved offline — will sync" indicator and a pending-count badge.
4. **Auto-update** — new releases install in the background; no manual cache clearing.

## Scope guard

- Only the teacher attendance save path gets offline queuing. Marks entry, fee flows, admin pages and parent views keep their current online-only behaviour.
- Offline mode is only active in the published app. Inside the Lovable editor preview it stays disabled on purpose, so previews never serve stale screens.

## Technical approach

**Installability**
- Add `public/manifest.webmanifest` (name "EdZen AI Teacher", short name "EdZen", `display: standalone`, `start_url: /progress`, `scope: /`, theme/background colours from the existing indigo/purple tokens).
- Generate 192px, 512px and maskable app icons plus an `apple-touch-icon` from the existing EdZen mark into `public/`.
- Add manifest, `theme-color` and apple touch tags to `index.html` head. No metadata or existing tags removed.

**Service worker**
- Add `vite-plugin-pwa` in `generateSW` mode: `registerType: "autoUpdate"`, `injectRegister: null`, `devOptions.enabled: false`, output at `/sw.js`.
- HTML navigations use `NetworkFirst`; hashed same-origin build assets use `CacheFirst`. `/~oauth` excluded from navigation fallback.
- Single registration wrapper `src/lib/pwa/registerSW.ts`, called once from `src/main.tsx`. It refuses to register (and unregisters any existing `/sw.js`) when not production, when inside an iframe, on `id-preview--*` / `preview--*` / `lovableproject.com` / `lovableproject-dev.com` / `beta.lovable.dev` hosts, or when the URL has `?sw=off`.
- The existing `public/sw-killswitch.js` currently unregisters every worker on load, which would fight the new one. It gets narrowed so it only clears legacy registrations and leaves `/sw.js` alone in production.

**Offline attendance queue**
- New `src/lib/offline/attendanceQueue.ts`: an IndexedDB-backed outbox holding pending attendance batches (school, date, entries, marked time, subject).
- `useSaveAttendance` in `src/hooks/useAttendance.ts` gains a fallback: on network failure the batch is written to the outbox, the React Query cache is updated optimistically, and the mutation resolves as a success with an `offline` flag.
- New `src/hooks/useAttendanceSync.ts` flushes the outbox on `online` events and on app focus, retrying with backoff and invalidating attendance queries after each successful flush. Upserts are idempotent on `(student_id, date)`, so replays are safe.
- `src/pages/progress/Attendance.tsx` gets a small status strip: online/offline state, count of unsynced batches, and a manual "Sync now" action. Existing marking UI is untouched.

**Files touched**
- New: manifest, icons, `src/lib/pwa/registerSW.ts`, `src/lib/offline/attendanceQueue.ts`, `src/hooks/useAttendanceSync.ts`.
- Edited: `index.html` (head tags), `vite.config.ts` (plugin), `src/main.tsx` (one registration call), `public/sw-killswitch.js` (narrowed), `src/hooks/useAttendance.ts` (offline fallback), `src/pages/progress/Attendance.tsx` (status strip).
- No database, RLS, or edge function changes.

## Caveats

- Install and offline behaviour can only be verified on the published site, not in the editor preview.
- iOS installs cache manifest fields such as `start_url` at install time; later changes to those need a reinstall.
- Offline queuing covers attendance only; a teacher opening a page whose data was never loaded online will still see empty data.
