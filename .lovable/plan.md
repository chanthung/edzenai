## Goal
Update `public/robots.txt` to explicitly allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) for LLM indexing, while preserving existing protections on private routes.

## Change
Append explicit AI crawler `Allow` blocks to the existing `public/robots.txt`. Keep current `Disallow` rules for `/admin/`, `/platform/`, `/progress/`, `/onboard`, `/view/`, `/reset-password`, `/forgot-password` for these AI bots too — these are private app routes that shouldn't be indexed by anyone.

### New file structure
1. Existing Googlebot, Bingbot, Twitterbot, facebookexternalhit, and `*` blocks — unchanged.
2. New blocks for: **GPTBot**, **ClaudeBot**, **PerplexityBot**, **Google-Extended** — each `Allow: /` with the same `Disallow` list as Googlebot to keep private routes out of LLM training/indexing.
3. Sitemap line preserved.

### Note on user-supplied snippet
The user's example uses bare `Allow: /` without disallows. I'll keep the disallows for AI bots as well, because routes like `/admin/` and `/view/:token` (parent portal token URLs) must never be indexed or scraped — including by LLMs. If you'd prefer the bare `Allow: /` for AI bots without any disallows, let me know.

## Files
- `public/robots.txt` — append 4 new user-agent blocks.
