

## Bug: Razorpay checkout uses wrong student count

### Root Cause
The pricing page has two different student counts:
- `students` (line 55) — the slider value the user sees (420 in the screenshot)
- `studentsList?.length` (line 110) — the actual number of students in the database (likely 37, producing ₹370)

Both `handlePayViaUPI` and `handlePayViaCard` use `Math.max(studentsList?.length || 10, 10)` instead of the `students` slider value. The amount shown on the pricing cards (₹3,780) doesn't match what's sent to Razorpay (₹370).

### Fix
In `src/pages/Pricing.tsx`, change both checkout handlers (lines 110 and 134) to use the slider value:

```typescript
// Before (both handlers):
const studentCount = Math.max(studentsList?.length || 10, 10);

// After (both handlers):
const studentCount = Math.max(students, 10);
```

This ensures the Razorpay order and Paddle checkout use the same student count shown in the pricing calculator UI.

### Files to change
- `src/pages/Pricing.tsx` — two lines (110 and 134)

