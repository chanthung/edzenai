# Add Data Deletion Instructions Page

Facebook requires a public URL with user data deletion instructions for app review. We'll add a new static page at `https://edzenai.com/data-deletion`.

## Changes

1. **Create `src/pages/DataDeletion.tsx`**
   - Mirror the styling of `PrivacyPolicy.tsx` (same nav, logo, prose layout, `usePageMeta` for SEO).
   - Title: "Data Deletion Instructions – EdZen AI"
   - Canonical: `/data-deletion`
   - Content sections:
     - **How to request deletion** — email `privacy@edzenai.com` from the registered admin email with subject "Data Deletion Request"; include school name + reason.
     - **What gets deleted** — school account, students, parents, attendance, marks, fees, payments, uploaded files.
     - **Timeline** — confirmation within 3 business days, full deletion within 30 days (per DPDP Act 2023).
     - **What's retained** — anonymised analytics + records required by law (e.g., financial records up to 7 years).
     - **Self-service** — School Admins can also delete individual students from the admin panel; full account deletion requires email request (prevents accidental loss).
     - **Contact** — `privacy@edzenai.com`.

2. **Register route in `src/App.tsx`**
   - Add `<Route path="/data-deletion" element={<DataDeletion />} />` alongside `/privacy`, `/terms`, `/refund`.

3. **Add to `public/sitemap.xml`** so Facebook/crawlers can find it.

4. **Add footer link** (next to Privacy / Terms) on the landing page footer for discoverability.

## Out of scope
- No backend changes — deletion is handled by existing email-based support workflow.
- No DNS / Facebook app configuration changes.
