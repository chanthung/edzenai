

## Problem

The `send-payment-confirmation` edge function exists and works, but it is **never called** from the "Verify & Mark Paid" flow in `PaymentProofVerifier.tsx`. The WhatsApp call was only wired into `PaymentRecorder.tsx` (manual payment entry), not the proof verification path.

## Fix

**File: `src/components/admin/PaymentProofVerifier.tsx`**

Add a non-blocking call to `send-payment-confirmation` after successful verification in `handleVerify()`:

```typescript
// After verifyProof.mutateAsync succeeds (line ~121):
supabase.functions.invoke('send-payment-confirmation', {
  body: { studentId: proof.students.id, amount: proof.installments.amount },
}).then(({ error }) => {
  if (error) console.warn('WhatsApp confirmation failed:', error);
}).catch(console.warn);
```

This is a fire-and-forget call — it won't block the UI or affect the verification flow. If WhatsApp fails, a warning is logged but the admin sees the normal success toast.

### What changes
| File | Change |
|------|--------|
| `src/components/admin/PaymentProofVerifier.tsx` | Add `supabase.functions.invoke('send-payment-confirmation', ...)` after successful verify |

One file, ~5 lines added. No database changes needed.

