

## Problem
Pricing fallback values are inconsistent across 7+ files. When the database query fails or returns empty (e.g., due to RLS differences between anonymous and authenticated users), different pages show different prices. The Pricing page shows ₹7/₹10, the landing page shows ₹8/₹10, and internal admin pages show ₹5/₹8.

## Root Cause
Each file has its own hardcoded fallback (`?? 7`, `?? 5`, `?? 8`) instead of using a single source of truth.

## Fix

### 1. Create centralized pricing constants
Add default pricing constants to `src/hooks/useSubscriptionPricing.ts`:

```typescript
export const DEFAULT_STARTER_RATE = 7;
export const DEFAULT_PRO_RATE = 10;

export function getDefaultRate(plan: string) {
  return plan === 'pro' ? DEFAULT_PRO_RATE : DEFAULT_STARTER_RATE;
}
```

### 2. Update all 7 files to use the centralized defaults
Replace every scattered fallback with the shared constants:

- `src/pages/Pricing.tsx` — already ₹7/₹10, just import constants
- `src/pages/Index.tsx` — change ₹8 → `DEFAULT_STARTER_RATE`
- `src/pages/auth/Signup.tsx` — change ₹8 → `DEFAULT_STARTER_RATE`
- `src/components/platform/PricingCalculator.tsx` — already ₹7/₹10, import constants
- `src/pages/platform/PlatformDashboard.tsx` — change ₹5/₹8 → constants
- `src/components/platform/EditSchoolDialog.tsx` — change ₹5/₹8 → constants
- `src/components/admin/SubscriptionInfoCard.tsx` — change ₹5/₹8 → constants
- `src/pages/platform/SubscriptionSettings.tsx` — change form defaults ₹5/₹8 → constants

### 3. Ensure `subscription_pricing` table has public read access
Verify the RLS policy allows anonymous reads so unauthenticated visitors on the pricing page get DB values, not fallbacks. If missing, add a SELECT policy for `anon` role.

### Result
All pricing displays will be consistent — either from the database or from a single set of fallback values (₹7 Starter, ₹10 Pro).

