# Tuition Fee Automation + Financial Integrity Fix

## What This Solves

1. Admins can set total=₹3,000 but add installments totaling ₹60,000 -- no validation
2. Overpayment in one category hides real dues in other categories (negative pending)
3. No way to auto-generate monthly or term-based installments

## Changes

### 1. Database Migration

Add a `generation_type` column to `fee_structures`:

```sql
ALTER TABLE fee_structures ADD COLUMN generation_type text NOT NULL DEFAULT 'manual';
```

Values: `manual`, `monthly`, `term`, `full`. Existing rows default to `manual` -- no breaking change.

### 2. Fee Structure Creation Dialog (FeeSetup.tsx)

Replace the current "Add Fee Structure" dialog with an enhanced version:

- **Fee Type selector** (radio group): Monthly / Term-wise (3 parts) / Full Payment / Custom (manual)
- When **Monthly** is selected: show academic year start/end date pickers, auto-calculate monthly amount and preview installment count (e.g. "₹5,000 x 12 = ₹60,000") 
  Eg: out of 60000, 1st installment can be 13000
  2nd installment = 10000, so now 37000 divided into 12 month. 3,083 becomes monthly fee. With Edit option for school admins
- When **Term** is selected: auto-split into 3 equal installments
- When **Full Payment** is selected: single installment = total (current default behavior)
- When **Custom** is selected: current manual flow (add installments individually)

On save, auto-generate the installments in the hook (`useCreateFeeStructure`).

### 3. Installment Total Validation (FeeSetup.tsx + useFeeStructures.ts)

- In the `FeeStructureCard`, when `generation_type = 'manual'`: show a **red warning** if `SUM(installments) != total_amount` and block adding more installments that would exceed the total
- In the "Add Installment" dialog: validate that adding this installment won't exceed the structure total
- For auto-generated types (monthly/term/full): hide the "Add Installment" button since installments are system-controlled

### 4. Mismatch Warning for Existing Data

In `FeeStructureCard`, if `installmentTotal != structure.total_amount`, show:

> "Fee structure total does not match installments. Please review."

This handles legacy data gracefully without breaking anything.

### 5. Payment Calculation Fix (useParentView.ts)

Clamp per-structure amounts so overpayment in one category never hides debt in another:

```typescript
const clampedPaid = Math.min(totalPaid, Number(structure.total_amount));
const pendingAmount = Math.max(0, Number(structure.total_amount) - totalPaid);
```

The summary then sums clamped values, preventing cross-category cancellation.

### 6. Overpayment Display (ParentFeesTab.tsx)

When `rawPaid > total_amount` for a structure, show an "Advance: ₹X" badge so overpayment is visible rather than silently ignored.

## Files Changed

- `src/pages/admin/FeeSetup.tsx` -- enhanced creation dialog, validation warnings, generation type UI
- `src/hooks/useFeeStructures.ts` -- auto-installment generation logic in `useCreateFeeStructure`, new types
- `src/hooks/useParentView.ts` -- per-structure clamping fix
- `src/components/parent/ParentFeesTab.tsx` -- overpayment badge display
- Database migration: add `generation_type` column

## What Stays the Same

- `total_amount` column untouched
- Existing manual fee structures continue working identically
- No changes to payment recording, payment proofs, or RLS policies
- All existing installment data preserved