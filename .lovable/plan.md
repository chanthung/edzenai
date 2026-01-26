
# Platform Admin - Trial & Subscription Control System

## Overview
Implement a comprehensive trial period system that tracks school subscription states, automatically enforces restrictions when trials expire, and allows only Platform Admins to reactivate schools after payment verification.

## Current State Analysis
- The `schools` table already has basic subscription fields:
  - `subscription_type` (monthly/annual)
  - `subscription_status` (active/inactive/trial)
  - `subscription_start_date`
  - `subscription_renewal_date`
- Schools are created through the `create-school` edge function
- The Platform Admin dashboard (`/platform`) displays schools with subscription info
- School Admins access their features through `AdminLayout`

## What We Need to Add

### 1. Database Schema Changes

Add new fields to the `schools` table:

| Field | Type | Purpose |
|-------|------|---------|
| `trial_start_date` | date | When the trial period begins |
| `trial_end_date` | date | When the trial period ends |
| `system_state` | enum | TRIAL_ACTIVE, TRIAL_EXPIRED, SUBSCRIPTION_ACTIVE, RESTRICTED_MODE |
| `payment_verified` | boolean | Whether payment has been verified by Platform Admin |
| `payment_verified_at` | timestamp | When payment was verified |
| `payment_verified_by` | uuid | Platform Admin who verified payment |

Create a new enum type for system states:
```text
school_system_state: 
  - trial_active
  - trial_expired  
  - subscription_active
  - restricted_mode
```

### 2. Automatic State Calculation

Create a database function `get_school_effective_state(school_id)` that calculates the current state based on:

```text
IF trial_end_date IS NULL OR current_date <= trial_end_date
  THEN state = TRIAL_ACTIVE
ELSE IF payment_verified = true AND subscription_status = 'active'
  THEN state = SUBSCRIPTION_ACTIVE  
ELSE IF current_date > trial_end_date
  THEN state = TRIAL_EXPIRED / RESTRICTED_MODE
```

This ensures the state is always computed accurately without relying on manual updates.

### 3. Restricted Features Definition

When a school is in `TRIAL_EXPIRED` or `RESTRICTED_MODE`:

| Feature | Status |
|---------|--------|
| View dashboard | Allowed (read-only) |
| View students list | Allowed |
| Add/edit students | BLOCKED |
| Record payments | BLOCKED |
| Add fee structures | BLOCKED |
| Verify payment proofs | BLOCKED |
| Generate parent links | BLOCKED |
| View settings | Allowed |
| Modify settings | BLOCKED |

Parents can still:
- View their fee status
- Upload payment proofs (for pending verification)

### 4. Component Architecture

```text
New Components:
+-- src/hooks/useSubscriptionStatus.ts          (Hook to check school subscription state)
+-- src/components/admin/SubscriptionBanner.tsx (Warning banner for restricted mode)
+-- src/components/platform/ActivateSchoolDialog.tsx (Platform Admin activation modal)
+-- src/components/admin/RestrictedOverlay.tsx  (Overlay for blocked features)

Modified Components:
+-- AdminLayout.tsx         (Add subscription check + banner)
+-- PlatformDashboard.tsx   (Add trial info, state badges, activation actions)
+-- EditSchoolDialog.tsx    (Add trial dates + activation controls)
+-- create-school/index.ts  (Set default trial period on creation)
```

### 5. User Interface Changes

#### Platform Admin Dashboard Enhancements:
- Add columns: Trial End Date, System State
- Color-coded status badges:
  - Green: SUBSCRIPTION_ACTIVE
  - Blue: TRIAL_ACTIVE  
  - Orange: TRIAL_EXPIRED
  - Red: RESTRICTED_MODE
- "Activate" button for expired schools
- Trial days remaining indicator

#### School Admin Experience (Restricted Mode):
- Persistent warning banner at top:
  > "Your trial has expired. Some features are restricted. Contact your administrator to activate your subscription."
- Disabled action buttons with tooltip explaining restriction
- Clear visual indication of what is/isn't available

#### Activation Dialog (Platform Admin):
- School name and current state
- Trial dates summary
- Checklist:
  - [ ] Payment amount verified
  - [ ] Payment received in bank account
  - [ ] Subscription type selected
- Set subscription dates
- Confirm activation

### 6. Create School Updates

When a new school is created:
- Set `trial_start_date` = today
- Set `trial_end_date` = today + 30 days (configurable)
- Set `system_state` = trial_active
- Set `payment_verified` = false

### 7. Security Considerations

- Only Platform Admins can:
  - View all schools' subscription states
  - Activate/reactivate schools
  - Verify payments
  - Modify trial dates

- RLS policies ensure School Admins:
  - Can only read their own school's subscription status
  - Cannot modify subscription/trial fields directly

---

## Technical Implementation Plan

### Step 1: Database Migration
- Create `school_system_state` enum
- Add trial and payment verification columns to schools
- Create `get_school_effective_state()` function
- Update RLS policies to protect new fields

### Step 2: Create useSubscriptionStatus Hook
- Fetch school data including trial/subscription fields
- Calculate effective state
- Determine which features are restricted
- Return helper functions: `isRestricted()`, `canPerform(action)`

### Step 3: Build UI Components
- SubscriptionBanner component for AdminLayout
- RestrictedOverlay for blocking actions
- ActivateSchoolDialog for Platform Admin
- Update EditSchoolDialog with trial fields

### Step 4: Integrate Restrictions
- Wrap restricted actions in AdminLayout with checks
- Add restriction checks to mutation hooks
- Display appropriate messaging

### Step 5: Update create-school Edge Function
- Set trial dates on school creation
- Default 30-day trial period

### Step 6: Platform Dashboard Updates
- Add trial/state columns to schools table
- Add activation workflow
- Add quick stats for trial status

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useSubscriptionStatus.ts` | Subscription state management |
| `src/components/admin/SubscriptionBanner.tsx` | Restriction warning UI |
| `src/components/admin/RestrictedOverlay.tsx` | Block restricted actions |
| `src/components/platform/ActivateSchoolDialog.tsx` | School activation workflow |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/create-school/index.ts` | Add trial dates on creation |
| `src/components/admin/AdminLayout.tsx` | Add subscription check + banner |
| `src/pages/platform/PlatformDashboard.tsx` | Trial info, state badges, activation |
| `src/components/platform/EditSchoolDialog.tsx` | Trial dates + payment verification |
| `src/hooks/useSchool.ts` | Include new subscription fields |
