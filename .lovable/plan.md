

# Enhanced Platform Admin Dashboard — Billing, Invoices & Payments

## Summary

Add billing cycle support, a GST-compliant invoice modal, manual payment recording, search/filter on the school table, and expanded KPI cards to the existing Platform Admin Dashboard. All data comes from real database records (not mock data).

## Database Changes

### 1. Add columns to `schools` table
- `billing_cycle` (text, default `'monthly'`, values: `monthly` | `annual`)
- `next_billing_date` (date, nullable)
- `pending_amount` (numeric, default 0)

### 2. Create `platform_payments` table
Tracks manual payment recordings by platform admin.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| school_id | uuid NOT NULL | references schools |
| amount | numeric NOT NULL | |
| payment_date | date NOT NULL | |
| reference_number | text | optional |
| notes | text | optional |
| recorded_by | uuid | auth.uid() |
| created_at | timestamptz | now() |

RLS: Platform admins only (ALL + SELECT via `is_platform_admin()`).

### 3. Create `platform_invoices` table
Stores generated invoices for audit trail.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| school_id | uuid NOT NULL | |
| invoice_number | text NOT NULL | auto-generated |
| subtotal | numeric | |
| volume_discount | numeric | |
| annual_discount | numeric | |
| taxable_amount | numeric | |
| cgst | numeric | 9% |
| sgst | numeric | 9% |
| total_amount | numeric | including GST |
| status | text | `pending` / `paid` |
| paid_at | timestamptz | |
| created_at | timestamptz | now() |

RLS: Platform admins only.

## UI Changes

### 1. KPI Cards — expand from 5 to 7 cards (2 rows)
Keep existing 5 cards, add:
- **Total Students** — sum of all student counts
- **Overdue Amount** — sum of `pending_amount` across schools

Update **Monthly Revenue** to become **MRR** — for annual schools, divide their annual fee by 12.

### 2. School Table Enhancements
- Add **search bar** filtering by school name or email
- Add columns: **Billing Cycle**, **Next Billing Date**
- Add **Invoice** button in Actions column
- Annual schools show fee as annual total with "(annual)" suffix

### 3. Invoice Modal (new component `src/components/platform/InvoiceModal.tsx`)
Triggered from the Invoice action button. Shows:
- School name, dummy billing address, dummy GSTIN
- Auto-generated invoice number (`INV-YYYYMMDD-XXXX`)
- Line items: plan, student count, rate, subtotal
- Volume discount line (if applicable)
- Annual discount line (10% off, if annual billing)
- Taxable amount
- GST breakdown: CGST 9% + SGST 9%
- Grand total
- "Mark as Paid" button — records payment, updates `pending_amount`
- "Download PDF" button (placeholder toast)

### 4. Payment Recording Dialog (new component `src/components/platform/RecordPaymentDialog.tsx`)
- Fields: amount, date, reference number (optional), notes (optional)
- On submit: inserts into `platform_payments`, decrements school's `pending_amount`
- Accessible from school row actions or invoice modal

### 5. Edit School Dialog Update
- Add `billing_cycle` selector (Monthly / Annual)
- Add `next_billing_date` date picker

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | New: add columns + 2 tables |
| `src/components/platform/InvoiceModal.tsx` | New |
| `src/components/platform/RecordPaymentDialog.tsx` | New |
| `src/pages/platform/PlatformDashboard.tsx` | Update: KPI cards, table columns, search, action buttons |
| `src/components/platform/EditSchoolDialog.tsx` | Update: billing_cycle + next_billing_date fields |
| `src/hooks/useSubscriptionPricing.ts` | Update: extend `calculateMonthlyFee` to support annual calculation |

## Technical Notes

- Volume discounts are auto-applied from the existing `volume_discount_tiers` table via `getApplicableDiscount()`
- Annual discount is a flat 10% on top of volume discount, applied only when `billing_cycle = 'annual'`
- GST (18%) is only shown on invoices, not in KPI cards or table (standard accounting practice)
- All amounts in ₹ (INR)
- No mock data — uses real Supabase records throughout

