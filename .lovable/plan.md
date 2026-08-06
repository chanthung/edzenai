# Pre-select all pending installments in Record Payment

Today, when an accountant opens Record Payment for a student, the "Select Installments to Pay" list starts with nothing ticked, so every fee has to be checked one by one. The change flips this: everything pending is ticked by default, and the accountant only unticks what the parent isn't paying right now.

## Behaviour

- Opening the Record Payment dialog pre-ticks every unpaid installment (across all fee categories and groups).
- The accountant can untick any item; the payment total updates as it does today.
- The "Select All / Deselect All" toggle keeps working — with everything ticked on open, it reads "Deselect All".
- After a payment is recorded, the remaining unpaid installments (if any) are re-ticked, so a second partial payment starts from the same full-selection default.
- Closing the dialog resets state as before.
- Nothing changes for restricted (view-only) schools or for students with no fees assigned.

## Technical notes

- Single file: `src/components/admin/PaymentRecorder.tsx`.
- Replace the empty initial `selectedInstallments` state with an effect that seeds it from `unpaidInstallments` when the dialog is open and fee/payment data has loaded, guarded so it only seeds once per open (not on every re-render) and doesn't undo manual unticks.
- After `handleRecordPayment` succeeds, re-seed from the refreshed unpaid list instead of clearing to an empty array.
- No database, hook, or API changes.
