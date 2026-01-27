
# Complete View-Only Mode for Inactive Schools

## Problem Identified
After thorough analysis, I found that while the mutation hooks have restriction guards, several UI components are missing restriction checks, allowing users to see and interact with action buttons even when the school is inactive.

## Missing Restrictions Found

### Fee Setup Page (`FeeSetup.tsx`)

| Component | Missing Restriction |
|-----------|---------------------|
| `FeeStructureCard` - Delete structure button | Not wrapped in `RestrictedButton` |
| `FeeStructureCard` - Add Installment button | Not wrapped in `RestrictedButton` |
| `FeeStructureCard` - Edit Installment button | Not wrapped in `RestrictedButton` |
| `FeeStructureCard` - Delete Installment button | Not wrapped in `RestrictedButton` |
| Categories tab - Delete category button | Not wrapped in `RestrictedButton` |

### Student Fee Manager (`StudentFeeManager.tsx`)

| Element | Missing Restriction |
|---------|---------------------|
| Entire dialog content | Not using `isRestricted` check |
| Fee assignment checkboxes | Should be disabled when restricted |

### Payment Recorder (`PaymentRecorder.tsx`)

| Element | Missing Restriction |
|---------|---------------------|
| Record Payment form section | Should be hidden/disabled when restricted |
| Select installments checkboxes | Should be disabled when restricted |
| Record Payment button | Should be wrapped in `RestrictedButton` |
| Delete payment buttons | Should be wrapped in `RestrictedButton` |

### Payment Proof Verifier (`PaymentProofVerifier.tsx`)

| Element | Missing Restriction |
|---------|---------------------|
| Verify & Mark Paid button | Should be wrapped in `RestrictedButton` |
| Reject Proof button | Should be wrapped in `RestrictedButton` |
| Bank verified checkbox | Should be disabled when restricted |

### Pending Proofs Panel (`PendingProofsPanel.tsx`)

| Element | Missing Restriction |
|---------|---------------------|
| Clicking on proof cards | Should show restricted state in verifier |

### Dashboard (`Dashboard.tsx`)

| Element | Missing Restriction |
|---------|---------------------|
| Quick Actions section | Links to add students should indicate restriction |

## Implementation Plan

### Step 1: Update FeeStructureCard Component

Pass `isRestricted` prop to `FeeStructureCard` and wrap all action buttons:

```text
Changes needed:
1. Add isRestricted prop to FeeStructureCard interface
2. Wrap Delete structure button in RestrictedButton
3. Wrap Add Installment button in RestrictedButton
4. Wrap Edit Installment button in RestrictedButton
5. Wrap Delete Installment button in RestrictedButton
6. Pass isRestricted from FeeSetup to FeeStructureCard
```

### Step 2: Update Categories Delete Button

Wrap the delete category button in `RestrictedButton`:

```text
Location: FeeSetup.tsx, Categories tab section
Action: Wrap Trash2 button in RestrictedButton, add disabled prop
```

### Step 3: Update StudentFeeManager Component

Add restriction checks to the fee assignment dialog:

```text
Changes needed:
1. Import useSubscriptionStatus hook
2. Disable checkboxes when isRestricted is true
3. Show a banner message when in restricted mode
4. Prevent any toggle actions
```

### Step 4: Update PaymentRecorder Component

Add comprehensive restrictions to the payment recording dialog:

```text
Changes needed:
1. Import useSubscriptionStatus hook
2. Import RestrictedButton component
3. Hide/disable "Record New Payment" section when restricted
4. Wrap delete payment buttons in RestrictedButton
5. Add banner explaining restrictions when applicable
```

### Step 5: Update PaymentProofVerifier Component

Add restrictions to proof verification actions:

```text
Changes needed:
1. Import useSubscriptionStatus hook
2. Import RestrictedButton/RestrictedOverlay components
3. Disable "Verify & Mark Paid" button when restricted
4. Disable "Reject Proof" button when restricted
5. Disable bank verified checkbox when restricted
6. Show restriction banner in dialog
```

### Step 6: Update Dashboard Quick Actions

Add visual indicators to Quick Actions when school is restricted:

```text
Changes needed:
1. Import useSubscriptionStatus hook
2. Add restriction indicators to action buttons
3. Show tooltip explaining restrictions
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/FeeSetup.tsx` | Add isRestricted to FeeStructureCard, wrap delete category button |
| `src/components/admin/StudentFeeManager.tsx` | Add restriction checks to fee checkboxes |
| `src/components/admin/PaymentRecorder.tsx` | Add restriction checks to payment actions |
| `src/components/admin/PaymentProofVerifier.tsx` | Add restriction checks to verify/reject buttons |
| `src/pages/admin/Dashboard.tsx` | Add restriction indicators to quick actions |

## Visual Behavior When Restricted

When a school is in `trial_expired` or `restricted_mode`:

| Action | Behavior |
|--------|----------|
| Add/Edit/Delete fee structures | Button disabled, tooltip shows restriction message |
| Add/Edit/Delete installments | Button disabled, tooltip shows restriction message |
| Delete categories | Button disabled, tooltip shows restriction message |
| Assign/Remove fees from students | Checkboxes disabled, banner explains restriction |
| Record payments | Form section hidden or clearly disabled |
| Delete payments | Button disabled, tooltip shows restriction message |
| Verify payment proofs | Button disabled, tooltip shows restriction message |
| Reject payment proofs | Button disabled, tooltip shows restriction message |

## Expected Outcome

After implementation:
1. All action buttons will be visually disabled with lock indicators
2. Tooltips will explain why actions are restricted
3. Even if someone tries to bypass UI, mutation hooks will block operations
4. Users can still view all data but cannot modify anything
