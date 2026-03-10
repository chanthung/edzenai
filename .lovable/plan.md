

# Add Student First Name to Parent View URL

## Problem
When parents have siblings at the same school, all parent links look identical (e.g., `/view/abc-123-uuid`). They can't tell which link belongs to which child.

## Solution
Change the URL pattern from `/view/:token` to `/view/:name/:token`, where `:name` is a URL-friendly slug of the student's first name. The name is cosmetic only -- the token remains the sole identifier for data lookup.

Example: `/view/rahul/a1b2c3d4-...` vs `/view/priya/e5f6g7h8-...`

## Changes

1. **Route** (`src/App.tsx`): Update to `/view/:name/:token`
2. **ParentView page** (`src/pages/parent/ParentView.tsx`): Update `useParams` to extract both `name` and `token` (only `token` is used for data)
3. **Edge function** (`supabase/functions/send-parent-link/index.ts`): Extract first name from `student.name`, slugify it (lowercase, hyphenated), and include in the URL
4. **Students page share button**: Update any frontend code that constructs the parent link to include the student's first name slug

This is purely a URL cosmetic change -- no database modifications needed. The `name` param is ignored by the data layer; the `token` alone drives authentication.

