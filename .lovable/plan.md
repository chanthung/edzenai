# Close the public-read holes without breaking parent access

Parent links must keep working exactly as they do today (no login, just the token URL). The fix is to stop letting the whole internet read tables directly, and instead serve parent data through token-checked backend functions — the same pattern already used for marks and attendance.

## What is open today

These tables currently have a "Public can view ..." rule with no condition at all (anyone with the public API key can read every row):

`students` (via school/other paths), `schools`, `student_fees`, `fee_structures`, `fee_categories`, `installments`, `payments`, `payment_proofs`, `student_marks`, `component_marks`, `assessments`, `attendance`, `competencies`, `student_competency_scores`, `student_enrollments`, `subjects`, `subject_class_assignments`.

Only two of the parent screens actually need open access-style reads; the rest are already token-scoped:
- Progress tab: already uses `get_student_marks_by_access_token` (safe).
- Attendance tab: already uses `get_student_attendance_by_access_token` (safe).
- Fees tab (`useParentView`): reads `schools`, `student_fees`, `payments`, `payment_proofs`, `students` directly — this is the only piece that depends on the open rules.

## The fix

1. Add one backend function `get_parent_fees_by_access_token(_access_token)` that takes the parent's token, resolves the student, and returns exactly that student's school payment details (name, UPI ID, QR code, phone, email), fee structures, installments, payments, and payment proofs — nothing else, no other student.
2. Rewrite `useParentView` to call that single function instead of five direct table reads. Same data shape returned to the UI, so the Fees tab, QR code, UPI deep link and proof uploader stay identical.
3. Tighten proof submission: parents submit through a token-checked function instead of a direct insert/delete on `payment_proofs`, so nobody can post or delete proofs for a student they don't have a link for.
4. Remove all the unconditional "Public can view" rules on the tables listed above. Keep public reads only on `subscription_pricing` and `volume_discount_tiers` (public pricing page, non-sensitive).
5. Leave admin/teacher/accountant rules untouched — they are already scoped by school membership.

## Accessibility / no-regression checks

- Open a real parent link and confirm: student header, Fees tab totals, installment statuses, QR code image, UPI "Pay via GPay" button, proof upload, Progress tab, Attendance tab.
- Confirm a wrong/random token returns nothing (no data leak, clean empty state).
- Confirm admin dashboard, fee reports, payment verification and progress screens still load.
- Re-run the security scan to confirm the public-read findings clear.

## Technical notes

- New functions are `SECURITY DEFINER ... SET search_path = public`, keyed on `students.access_token`, mirroring the existing `get_student_*_by_access_token` functions.
- `EXECUTE` granted to `anon` and `authenticated`; direct table `SELECT` grants for `anon` revoked where no policy remains.
- Frontend changes limited to `src/hooks/useParentView.ts` and the parent proof-submit path in `src/hooks/usePaymentProofs.ts`; component files unchanged.
- Migration ordering: create functions first, verify the parent view against them, then drop the public policies in the same migration so there is no window where parent pages break.
