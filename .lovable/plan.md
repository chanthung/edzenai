## Goal
Connect Google Search Console to the project, verify `https://edzenai.com/` ownership via meta tag, and submit `sitemap.xml`.

## Steps

1. **Connect Google Search Console**
   - No `google_search_console` connection exists in the workspace yet (only Paddle is linked).
   - Trigger the connector OAuth flow so `GOOGLE_SEARCH_CONSOLE_API_KEY` is provisioned. User must approve and sign in with the Google account that should own the property.

2. **Request meta verification token**
   - Call `siteVerification/v1/token` for `identifier: https://edzenai.com/`, method `META`.
   - Receive a `<google-site-verification=...>` token string.

3. **Embed the meta tag**
   - Add `<meta name="google-site-verification" content="...">` to `index.html` `<head>`.
   - Publish the frontend (required — verification reads the live deployed HTML, not preview).

4. **Verify ownership**
   - Call `siteVerification/v1/webResource?verificationMethod=META` with the same identifier.
   - 200 = verified. If 400 `failedToFindMetaTag`, re-check publish.

5. **Add site to Search Console**
   - `PUT /webmasters/v3/sites/https%3A%2F%2Fedzenai.com%2F`.

6. **Submit sitemap**
   - `PUT /webmasters/v3/sites/https%3A%2F%2Fedzenai.com%2F/sitemaps/https%3A%2F%2Fedzenai.com%2Fsitemap.xml`.

## What I need from you
- Approve the Google Search Console connector link when prompted, signing in with the Google account that should own the property.
- After step 3, click **Publish → Update** so the meta tag goes live before I run verification.

## Notes
- Only `edzenai.com` will be verified here. If you also want `www.edzenai.com` indexed as a separate property, I'll repeat steps 2–6 for it (recommended: pick one as primary and 301 the other; you've already configured both as custom domains).
