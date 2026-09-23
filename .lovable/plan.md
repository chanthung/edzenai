# About the database dashboard instructions you received

## What the instructions assume

The guide you pasted ("Project Settings → Database → Connect, copy the Postgres connection string") applies to a **self-managed** database account. Your EdZen AI app runs on **Lovable Cloud**, where the database is fully managed for you — and, as a security measure, direct dashboard access and the raw database password are **not exposed to you or to me**. There is no dashboard page to open, and the connection string cannot be retrieved.

## What you can do instead

Depending on what you were trying to accomplish:

1. **You wanted me to run a query or check data** — just ask. I can query and inspect the database for you directly (read-only or with changes, as you prefer), and show you the results here.
2. **You wanted to connect an external tool or the future Timetable Python API** — the supported path is through the app's built-in secure functions/endpoints, not a raw Postgres connection string. For the Timetable service specifically, the approved design already covers this: a dedicated least-privilege service role with scoped access, connected through the backend rather than an exposed password.
3. **You need ongoing direct SQL access yourself** — that would require moving the backend to your own external database account (I can plan that migration if you want it, but it's a significant change and not needed for current work).

## Recommendation

Tell me what you were hoping to do with the dashboard (check data? connect the Timetable API? fix something?), and I'll do it for you or set up the supported way to do it — no credentials needed.
