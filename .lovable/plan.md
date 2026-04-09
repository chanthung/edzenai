

# Plan: Add Refund & Cancellation Policy Page

## Changes

### 1. New page: `src/pages/RefundPolicy.tsx`
- Same layout as `PrivacyPolicy.tsx` / `TermsOfService.tsx` (nav bar with back button, prose article)
- Content covers:
  - EdZen AI as technology platform only (not a financial institution)
  - School as final authority on refunds
  - Double payment rule (school reconciles)
  - Non-refundable convenience/platform fees
  - Contact: support@edzenai.com, Dimapur, Nagaland

### 2. Route in `src/App.tsx`
- Add `<Route path="/refund-policy" element={<RefundPolicy />} />`

### 3. Footer in `src/pages/Index.tsx`
- Add "Refund & Cancellation" link under the Legal column, next to Terms of Service

### Files touched
- `src/pages/RefundPolicy.tsx` (new)
- `src/App.tsx` (add route)
- `src/pages/Index.tsx` (add footer link)

