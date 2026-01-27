
# Inactive Schools - Full View-Only Mode Implementation

## Overview
Implement comprehensive restrictions for inactive schools (trial_expired/restricted_mode), enforcing view-only access at UI, API, and permission levels. All modification actions will be disabled/hidden with clear visual indicators.

## Current State Analysis

The project has foundational components already in place:
- `useSubscriptionStatus` hook with `isRestricted` flag and `canPerform(action)` method
- `RestrictedOverlay` and `RestrictedButton` wrapper components
- `SubscriptionBanner` for displaying trial status
- `SystemStateBadge` for state visualization

**What's Missing:**
- Restrictions are NOT applied to admin pages (Students, FeeSetup, Settings, AcademicYears)
- No mutation-level checks (API calls can still be made)
- No clear "School Status: Inactive (View Only)" label
- Action buttons are not hidden/disabled

## Implementation Plan

### 1. Create School Status Header Component

A new component to display the clear status label at the top of restricted pages:

| Element | Description |
|---------|-------------|
| Status Label | "School Status: Inactive (View Only)" |
| Icon | Lock icon for restricted, CheckCircle for active |
| Color | Red/destructive for inactive, green for active |
| Tooltip | "This school is inactive. Editing and actions are disabled." |

### 2. Expand Restricted Actions List

Add more restricted actions to the `useSubscriptionStatus` hook:

| New Actions |
|-------------|
| `delete_student` |
| `assign_fee_structure` |
| `remove_fee_structure` |
| `delete_payment` |
| `add_installment` |
| `edit_installment` |
| `delete_installment` |
| `add_fee_category` |
| `delete_fee_category` |
| `delete_academic_year` |
| `update_school_settings` |
| `upload_qr_code` |
| `change_password` |

### 3. Update Admin Pages with Restrictions

#### Students Page
| Action | Restriction |
|--------|-------------|
| "Add Student" button | Wrap with `RestrictedButton` |
| Edit button | Wrap with `RestrictedButton` |
| Delete button | Wrap with `RestrictedButton` |
| "Fees" button | Wrap with `RestrictedButton` |
| "Payments" button | Wrap with `RestrictedButton` |
| Copy/View Parent Link | **Allowed** (view-only) |

#### Fee Setup Page
| Action | Restriction |
|--------|-------------|
| "Add Fee" button | Wrap with `RestrictedButton` |
| "Add Category" button | Wrap with `RestrictedButton` |
| "Add Installment" button | Wrap with `RestrictedButton` |
| Edit/Delete buttons | Wrap with `RestrictedButton` |

#### Academic Years Page
| Action | Restriction |
|--------|-------------|
| "New Year" button | Wrap with `RestrictedButton` |
| Active toggle switch | Disable when restricted |
| Delete button | Wrap with `RestrictedButton` |

#### Settings Page
| Action | Restriction |
|--------|-------------|
| "Save Changes" button | Wrap with `RestrictedButton` |
| QR code upload | Wrap with `RestrictedOverlay` |
| "Change Password" button | Wrap with `RestrictedButton` |

#### Dashboard Page
| Action | Restriction |
|--------|-------------|
| Payment proof verification | Wrap with `RestrictedOverlay` |
| Quick action links | Add restriction indicators |

### 4. Mutation-Level Protection

Add restriction checks to all mutation hooks to prevent API-level bypass:

```text
Pattern for each mutation:
IF isRestricted THEN
  throw new Error("Operation not permitted. School is in restricted mode.")
```

Hooks to update:
- `useCreateStudent`, `useUpdateStudent`, `useDeleteStudent`
- `useRecordPayment`, `useDeletePayment`
- `useAssignFeeStructure`, `useRemoveFeeStructure`
- `useCreateFeeStructure`, `useDeleteFeeStructure`
- `useCreateInstallment`, `useUpdateInstallment`, `useDeleteInstallment`
- `useCreateFeeCategory`, `useDeleteFeeCategory`
- `useCreateAcademicYear`, `useUpdateAcademicYear`, `useDeleteAcademicYear`
- `useUpdateSchool`
- `useUpdatePaymentProofStatus`

### 5. Create Restricted Context Provider

A context wrapper to share restriction state efficiently across components:

| Benefit | Description |
|---------|-------------|
| Centralized state | Single source of truth for restriction status |
| Optimized re-renders | Prevents unnecessary hook calls |
| Easy access | All components can check restrictions |

### 6. Enhanced Subscription Banner

Update the existing banner to include:
- More prominent display for restricted mode
- Action items list (what's blocked)
- Contact information

## Component Architecture

```text
Files to Create:
+-- src/components/admin/SchoolStatusBadge.tsx    (Status label component)
+-- src/contexts/RestrictionContext.tsx           (Context for restriction state)

Files to Modify:
+-- src/hooks/useSubscriptionStatus.ts            (Expand restricted actions)
+-- src/pages/admin/Students.tsx                  (Add restrictions)
+-- src/pages/admin/FeeSetup.tsx                  (Add restrictions)
+-- src/pages/admin/Settings.tsx                  (Add restrictions)
+-- src/pages/admin/AcademicYears.tsx             (Add restrictions)
+-- src/pages/admin/Dashboard.tsx                 (Add restrictions)
+-- src/hooks/useStudents.ts                      (Add mutation guards)
+-- src/hooks/useStudentFees.ts                   (Add mutation guards)
+-- src/hooks/useFeeStructures.ts                 (Add mutation guards)
+-- src/hooks/useFeeCategories.ts                 (Add mutation guards)
+-- src/hooks/useAcademicYears.ts                 (Add mutation guards)
+-- src/hooks/useSchool.ts                        (Add mutation guards)
+-- src/hooks/usePaymentProofs.ts                 (Add mutation guards)
+-- src/components/admin/AdminLayout.tsx          (Add status badge)
+-- src/components/admin/SubscriptionBanner.tsx   (Enhanced display)
```

## UI/UX Changes

### Restricted Mode Visual Indicators

1. **Header Status Badge**: Large visible badge showing "Inactive (View Only)"

2. **Disabled Buttons**: 
   - Greyed out appearance (opacity: 50%)
   - Lock icon overlay
   - Cursor: not-allowed

3. **Tooltip on hover**: 
   - "This school is inactive. Editing and actions are disabled."

4. **Banner at top**:
   - Persistent destructive-colored banner
   - Clear message explaining restrictions

### Allowed Actions (View Only)

The following remain accessible in restricted mode:
- View all dashboards and reports
- View student lists and details
- View fee structures and installments
- View payment history
- View school settings
- View parent links (but not generate new ones)
- Navigate between pages
- Sign out

## Security Enforcement Layers

| Layer | Implementation |
|-------|----------------|
| **UI Level** | Buttons hidden/disabled with RestrictedButton/RestrictedOverlay |
| **Hook Level** | Mutations throw errors if isRestricted |
| **API Level** | RLS policies already enforce school-level access (existing) |

## Implementation Order

1. **Create SchoolStatusBadge component** - Visual indicator
2. **Update useSubscriptionStatus hook** - Expand restricted actions
3. **Update AdminLayout** - Add status badge to header
4. **Update each admin page** - Add restriction wrappers
5. **Update mutation hooks** - Add guard checks
6. **Test end-to-end** - Verify all actions blocked
