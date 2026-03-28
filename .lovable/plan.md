

# Dynamic Pricing Calculator with Volume Discounts

## Summary

Add a volume discount system to the Platform Admin's Subscription Settings page. Platform admins can configure discount tiers (e.g., 500-999 students → 5%, 1000+ → 10%), and a live pricing calculator previews the effect. The public pricing page will also reflect these discount tiers.

## Database Changes

**New table: `volume_discount_tiers`**
- `id` (uuid, PK)
- `min_students` (integer, not null)
- `max_students` (integer, nullable — null means unlimited)
- `discount_percent` (numeric, not null)
- `updated_at` (timestamptz, default now())

Seeded with two rows: (500, 999, 5) and (1000, null, 10).

**RLS policies:**
- Platform admins: full access (ALL)
- Public/anon: SELECT (so pricing page can read tiers)

## Frontend Changes

### 1. `src/hooks/useVolumeDiscounts.ts` (new)
- `useVolumeDiscounts()` — fetches tiers ordered by `min_students`
- `useUpdateVolumeDiscount()` — mutation to update a tier
- `useCreateVolumeDiscount()` / `useDeleteVolumeDiscount()` — CRUD mutations
- `getApplicableDiscount(studentCount, tiers)` — pure helper that returns the matching discount percent

### 2. `src/pages/platform/SubscriptionSettings.tsx` (updated)
Add a new section below the existing plan cards:

**Volume Discount Tiers Editor:**
- Table listing each tier: min students, max students, discount %
- Editable inline fields for each tier
- Add/remove tier buttons
- Save button per tier

**Live Pricing Calculator:**
- Plan toggle (Starter / Pro)
- Student count input with slider (10-2000)
- Real-time display showing:
  - Base total (rate x students)
  - Applicable discount tier and percentage
  - Discount amount
  - Final monthly fee
  - Effective per-student price after discount
- Tooltips on discount tiers explaining thresholds

### 3. `src/pages/Pricing.tsx` and `src/pages/Index.tsx` (updated)
- Fetch volume discount tiers via `useVolumeDiscounts()`
- Show discount badges/notes below the calculator (e.g., "5% off for 500+ students, 10% off for 1000+")
- Apply discount in the displayed totals when student count crosses thresholds

### 4. `src/components/platform/BillingBreakdown.tsx` (updated)
- Accept optional `volumeDiscountTiers` prop
- Auto-apply volume discount based on student count when rendering billing for a school

## Technical Notes
- No new secrets required
- Volume discount is separate from the per-school `discount_percent` field on the `schools` table (which is for custom school-specific discounts)
- The calculator is purely client-side math using fetched tier data

