

## Analysis & Plan

### Current State

1. **Collection rate cap at 100%**: The progress bar already uses `Math.min(feeReports.collectionRate, 100)` for width (line 310 of Dashboard.tsx), but the displayed percentage text can show >100% (line 314). The `useFeeReports` hook and `FeesSummaryCards` don't cap at 100%.

2. **"Total fees collected this month" and "Pending amount" and "% collection rate"**: The dashboard shows all-time totals (Collected, Pending, Collection Rate) in the Collection Summary card and Fee Reports tab. There is NO "this month" filter on the summary cards. The MonthWiseCollectionReport component does show month-by-month breakdowns but doesn't surface the current month total as a summary card.

3. **Auto WhatsApp after payment**: Currently, recording a payment only shows a toast. There is no WhatsApp notification sent to parents after payment. The WhatsApp integration (`send-parent-link` edge function) only sends the parent portal link, not payment confirmations.

### Plan

#### 1. Cap collection rate at 100%
- **`useFeeReports.ts`**: Add `Math.min(collectionRate, 100)` when computing both the summary and class-wise collection rates.
- **`FeesSummaryCards.tsx`**: Cap the displayed rate at 100%.
- **`ClassWiseReport.tsx`**: Same cap on class-level rates.

#### 2. Add "This Month" collection data to summary
- **`useFeeReports.ts`**: Add `totalCollectedThisMonth` field by filtering payments where `payment_date` is within the current month.
- **`FeesSummaryCards.tsx`**: Replace or add a card showing "Collected This Month" alongside the existing total.
- **Dashboard Collection Summary card**: Display this month's collection as a separate line item.

#### 3. Auto WhatsApp confirmation after payment recording
- **New edge function `send-payment-confirmation`**: Accepts `studentId`, `amount`, `studentName`. Sends a WhatsApp message like: "✅ Payment of ₹{{amount}} received for {{studentName}}. View details: {{parentLink}}" using the same Mayavi InfoTech API and `WA_API_KEY`.
- **`PaymentRecorder.tsx`**: After successful payment recording, invoke `supabase.functions.invoke('send-payment-confirmation', ...)` with the student details and amount. Show a secondary toast if WhatsApp send succeeds. Fail silently (log warning) if it doesn't, so payment recording isn't affected.
- **Parent Link auto-update**: The parent view already derives fee status from the database in real-time, so no additional work is needed -- once payment is recorded, the parent link automatically reflects the updated status.

### Files to Create/Edit
| File | Action |
|------|--------|
| `src/hooks/useFeeReports.ts` | Cap collection rate at 100%, add `totalCollectedThisMonth` |
| `src/components/admin/reports/FeesSummaryCards.tsx` | Cap display, add "This Month" card |
| `src/components/admin/reports/ClassWiseReport.tsx` | Cap class-level rate |
| `src/pages/admin/Dashboard.tsx` | Show this-month collection in summary card |
| `supabase/functions/send-payment-confirmation/index.ts` | New edge function for WhatsApp payment receipt |
| `src/components/admin/PaymentRecorder.tsx` | Call WhatsApp confirmation after recording payment |

