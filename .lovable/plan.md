
## Plan: Partner & School Management Enhancements

### 1. Resend Verification Email button (Partner Detail page)

- Create a new edge function `resend-partner-invite` that:
  - Validates the caller is a platform admin
  - Looks up the partner's invite from `partner_invites` (most recent, non-accepted)
  - If expired, generates a new token/invite row
  - Re-sends the invite email via `send-transactional-email`
- Add a "Resend Invite" button in `PartnerDetail.tsx` header (visible only if partner has no `user_id`, i.e. invite not yet accepted)

### 2. Edit Partner button (Partner Detail page)

- Create an `EditPartnerDialog` component with fields: Name, Email, Phone, Referral Code, Commission %
- Wire it to update the `partners` table via Supabase client
- Add an "Edit" button in the `PartnerDetail.tsx` header

### 3. School list inside Partner Detail page

- The `usePartnerSchools` hook already fetches schools referred by the partner
- Add a "Referred Schools" card in `PartnerDetail.tsx` showing a table with: School Name, Plan, Students, State, Created date
- This gives the admin visibility into which schools came from each partner

### 4. Partner referral indicator on Platform Admin Schools table

- Fetch all partners (name + id) alongside schools in `PlatformDashboard.tsx`
- For each school row, if `referred_by` is set, show a small colored badge/tooltip with the partner's name next to the school name
- Use a distinct color (e.g., indigo badge) so referred schools are visually identifiable

### 5. Delete School (with confirmation dialog)

- Add a delete (Trash) icon button in the Actions column of the Schools table
- Create a `DeleteSchoolDialog` component with:
  - Warning text explaining consequences (all students, fees, data will be deleted)
  - Require the user to type the school name to confirm (similar to bulk student delete pattern)
  - On confirm, delete the school from the `schools` table via Supabase
- Add RLS policy or use service role if needed (platform admin should already have delete access)

### Technical Details

**New files:**
- `supabase/functions/resend-partner-invite/index.ts`
- `src/components/platform/EditPartnerDialog.tsx`
- `src/components/platform/DeleteSchoolDialog.tsx`

**Modified files:**
- `src/pages/platform/PartnerDetail.tsx` - Add resend button, edit button, schools card
- `src/pages/platform/PlatformDashboard.tsx` - Add partner referral badges, delete button
- `src/hooks/usePartners.ts` - Expose partner map for school referral lookup

**Database:** No schema changes needed. The `schools.referred_by` FK to `partners.id` already exists. RLS policies for delete on schools may need a migration if platform admins cannot currently delete schools.
