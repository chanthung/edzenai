

## QR Payment Proof — OCR-first parent flow + admin assist + alerts

### What's already built (kept as-is)
QR display, UPI deep-link, file upload, admin review/verify/reject with reasons, parent rejection re-upload, Razorpay "Pay Online (Instant)" path. **All existing UX stays.**

### New work — 5 changes

**1. Database (1 migration)**
Add to `payment_proofs`:
- `amount_paid numeric` — confirmed by parent (entered/edited)
- `ocr_amount numeric` · `ocr_transaction_id text` · `ocr_date date`
- `ocr_status text` — `pending` | `success` | `failed`
- `ocr_confidence text` — `high` | `medium` | `low`
- `ocr_raw jsonb` — full model response (audit)

Partial unique index on `reference_number` per school (where not null) → blocks duplicate UTRs with a friendly error.

**2. New edge function: `ocr-payment-proof`**
- Called from the parent uploader **right after the screenshot is picked** (before submit)
- Downloads the just-uploaded file from `payment-proofs` bucket
- Calls Lovable AI Gateway `google/gemini-2.5-flash` with a tool-call schema returning `{ amount, transaction_id, date, confidence }`
- Returns extracted values to the client for auto-fill
- PDFs / failures → returns `ocr_status: 'failed'` so UI falls back to manual entry
- Never auto-approves — OCR is assistive only

**3. Parent-side: OCR-first uploader**
Update `PaymentProofUploader.tsx` flow:

```text
1. Parent picks screenshot
2. Show inline "🔍 Scanning screenshot…" spinner
3. Upload file → call ocr-payment-proof
4. On success: pre-fill Amount + UTR fields (highlight as "auto-detected")
   On failure: show "Could not detect details — please enter manually"
5. Both fields remain fully editable
6. Note above submit button: "Please confirm the details before submitting"
7. Submit → insert payment_proofs row with both entered_* and ocr_* values
```

- **Amount Paid (₹)** — required (pre-filled from OCR or installment amount)
- **Transaction ID (UTR)** — required (pre-filled from OCR if detected)
- Friendly error if UTR already submitted for this school

**4. Admin verifier: comparison panel**
Update `PaymentProofVerifier.tsx` — add a comparison block above existing Verify/Reject buttons:

```text
                  Expected    Parent Entered    OCR Detected    Match
Amount            ₹ 5,000     ₹ 5,000           ₹ 5,000         🟢
UTR / Txn ID      —           UPI123ABC         UPI123ABC       🟢
Date              —           —                 21 Apr 2026     🟡
Confidence: HIGH
```
- 🟢 all match · 🟡 partial / low confidence / OCR unavailable · 🔴 mismatch
- New reject reason: `amount_mismatch_ocr`
- Existing screenshot preview, Verify/Reject actions unchanged

**5. Real-time toast + beep for new submissions**
New hook `useNewProofAlerts(schoolId)` mounted in `AdminLayout`:
- Subscribes to Supabase Realtime `INSERT` on `payment_proofs` filtered to school's students
- On insert → sonner toast `"New payment submitted: ₹X – {Student Name}"` + plays `/notify.mp3` once (no loop)
- **🔔 bell toggle** in admin top bar, persisted in `localStorage` (`edzen_proof_alert_sound`, default ON)
- Gracefully handles browser autoplay blocks — toast still fires
- Enables realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE payment_proofs`

### Files
- New: `supabase/functions/ocr-payment-proof/index.ts`
- New: `src/hooks/useNewProofAlerts.ts`
- New: `public/notify.mp3` (~80 KB short beep)
- Modified: `src/components/parent/PaymentProofUploader.tsx`
- Modified: `src/components/admin/PaymentProofVerifier.tsx`
- Modified: `src/components/admin/AdminLayout.tsx`
- Modified: `src/hooks/usePaymentProofs.ts` (new fields + duplicate-UTR error)
- 1 DB migration

### Safety
- OCR never auto-approves — admin click still required
- OCR failure → manual entry (no blocking)
- Duplicate UTR blocked at DB level
- Existing RLS policies cover new columns automatically

### Not changing
- File picker UX, status pills, rejection re-upload flow
- UPI deep-link tap-to-pay
- Razorpay instant flow
- 30-word reject message limit

