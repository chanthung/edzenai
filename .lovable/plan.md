

# Mobile Responsiveness Audit & Polish

## Current State

The site is **already largely responsive** — all auth pages, layouts (AdminLayout, ProgressLayout), and parent views use proper mobile patterns:
- `min-h-screen flex items-center justify-center px-4` on auth pages
- `lg:hidden` mobile headers with hamburger menus
- `lg:flex-col lg:w-64 lg:fixed` desktop sidebars
- Responsive padding (`p-4 sm:p-6 lg:p-8`)
- `md:grid-cols-*` responsive grids

## Issues to Fix

### 1. Signup Step 2 — Plan cards stack but need scroll safety
- The plan selection grid (`grid md:grid-cols-2`) stacks correctly on mobile, but the combined height of two full plan cards + buttons + footer text can overflow small screens (especially iPhone SE at 320x568)
- **Fix**: Add `min-h-screen` → `min-h-[100dvh]` and `overflow-y-auto` to the outer container on auth pages so content scrolls naturally without body-level issues

### 2. Auth pages use `items-center` which hides top content on short viewports
- `flex items-center justify-center` vertically centers content, but on short screens (or with keyboard open on mobile), the top gets clipped and the user can't scroll up to see the header/logo
- **Fix**: Change to `items-start pt-8 sm:items-center sm:pt-0` so on mobile the content starts from the top and scrolls, while desktop stays centered

### 3. Dashboard TabsList overflow on small screens
- Three tabs ("Overview", "Payment Proofs" with badge, "Fee Reports") can overflow on narrow screens
- **Fix**: Add `w-full overflow-x-auto` and `flex-wrap` or horizontal scroll to the TabsList

### 4. Students page table — horizontal scroll missing
- The 869-line Students page has a data table that likely overflows on mobile without a horizontal scroll wrapper
- **Fix**: Wrap the table in `overflow-x-auto` container with a min-width

### 5. Mobile menu doesn't close on outside tap or route change
- The mobile nav uses `absolute` positioning but has no backdrop/overlay to close on outside tap
- **Fix**: Add a transparent backdrop that closes the menu when tapped

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/auth/Login.tsx` | Switch to `min-h-[100dvh]`, top-aligned on mobile |
| `src/pages/auth/Signup.tsx` | Same viewport + alignment fix |
| `src/pages/auth/Onboard.tsx` | Same viewport + alignment fix |
| `src/pages/auth/ForgotPassword.tsx` | Same viewport + alignment fix |
| `src/pages/auth/ResetPassword.tsx` | Same viewport + alignment fix |
| `src/components/admin/AdminLayout.tsx` | Add backdrop overlay for mobile menu |
| `src/components/progress/ProgressLayout.tsx` | Add backdrop overlay for mobile menu |
| `src/pages/admin/Dashboard.tsx` | Make TabsList scrollable on mobile |

## Technical Details

**Auth pages pattern change**:
```
Before: min-h-screen flex items-center justify-center px-4
After:  min-h-[100dvh] flex items-start pt-8 sm:items-center sm:pt-0 justify-center px-4 overflow-y-auto
```

**Mobile menu backdrop**:
```tsx
{mobileMenuOpen && (
  <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
)}
```

**Dashboard tabs**:
```tsx
<TabsList className="w-full overflow-x-auto flex-nowrap">
```

