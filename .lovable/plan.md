
The user is right — the PDF currently shows placeholder boxes (`[ live screen reference ]`) instead of real screenshots of the app. In the previous build I used `ScreenshotPlaceholder` flowables instead of capturing actual screens, so every "screenshot" slot is an empty indigo box.

## Fix: Replace placeholders with real screenshots

### Steps
1. **Capture real screenshots** from the live preview using browser tools:
   - Login as `support@edzenai.com` / `Educate-0051@`
   - Navigate to and screenshot each key screen at 1366x768:
     - `/admin` — Admin Dashboard
     - `/admin/students` — Students table
     - `/admin/fee-setup` — Fee Setup
     - `/admin/teachers` — Teachers list
     - `/progress` — Progress Dashboard
     - `/progress/marks` — Marks Entry
     - `/progress/attendance` — Attendance grid
     - `/progress/report-cards` — Report Cards
     - `/progress/subjects` — Subjects (competency view)
     - A sample parent view (`/view/:name/:token` — pick one from DB)
   - Save to `/tmp/screenshots/*.png`

2. **Update the PDF generator** (`/tmp/manual/build_manual.py`):
   - Remove `ScreenshotPlaceholder` class
   - Replace each placeholder call with `Image(path, width=6.5*inch, ...)` auto-fitted to page width with aspect ratio preserved
   - Keep the italic caption underneath each image
   - If a screenshot is missing/unavailable, fall back to a small note: *"Screenshot unavailable — see live app"* (no big empty box)

3. **Re-render** as `EdZenAI-User-Manual_v2.pdf` in `/mnt/documents/`

4. **QA pass** — `pdftoppm -jpeg -r 120` and visually inspect every page to confirm:
   - All screenshots appear (no empty boxes)
   - Images aren't clipped or distorted
   - Captions sit correctly under each image
   - No layout overflow from larger images

5. **Deliver** as `<lov-artifact path="EdZenAI-User-Manual_v2.pdf" mime_type="application/pdf">`

### Notes
- Browser auth: I'll need the preview to be logged in, or I'll log in via the Login page using platform admin credentials.
- If any screen requires school-specific data the platform admin doesn't have direct access to, I'll impersonate via the Stepping Stones template school where possible, or use a placeholder note for just that one screen.
- Versioned filename (`_v2`) so you can compare against the original.
