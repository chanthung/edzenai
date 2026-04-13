

## Plan: Remove all current carousel slides

**What changes:**

1. **Delete all 6 slide image imports** from the top of `src/pages/Index.tsx` (lines 6-11: `slideStudents`, `slideExcelAi1`, `slideExcelAi2`, `slideWhatsapp1`, `slideWhatsapp2`, `slideParentLink`)

2. **Empty the `dashboardSlides` array** (lines 564-571) — set it to `[]` or comment it out temporarily

3. **Delete the 6 image files** from `src/assets/`:
   - `slide-students.png`
   - `slide-excel-ai1.png`
   - `slide-excel-ai2.png`
   - `slide-whatsapp1.png`
   - `slide-whatsapp2.png`
   - `slide-parent-link.png`

After this, the carousel section will be empty and ready for you to upload new screenshots to replace them.

**Files affected:**
- `src/pages/Index.tsx` — remove imports + empty the slides array
- `src/assets/slide-*.png` — delete all 6 files

