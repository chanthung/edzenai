# EdZen AI — Offline "School Server Edition"

Goal: a version of EdZen AI that installs on a school's own computer and runs with zero internet, while the existing cloud product stays completely unchanged.

## Verdict

Feasible. Nothing in the app requires the cloud in principle — the whole stack (Postgres, auth, storage, functions) can run locally via self-hosted Supabase. The work is in packaging, replacing internet-only features, and supporting installs in the field.

## What runs offline vs what cannot

| Area | Offline status |
| --- | --- |
| Students, classes, academic years, enrollments | Works fully |
| Fees, installments, payments, receipts | Works fully (cash/cheque/UPI reference entry) |
| Attendance | Works fully |
| Marks, assessments, competencies, report cards (print to PDF) | Works fully |
| Login, roles, RLS isolation | Works fully (local auth, email/password only) |
| Excel import/export | Works fully, minus AI column mapping |
| Google sign-in | Not available offline — email/password only |
| WhatsApp parent links, fee reminders, email | Not available offline; queued and sent when a connection exists |
| AI features (student analysis, AI import, help assistant, OCR of payment proofs) | Not available offline; disabled or degraded to manual |
| Online payments (Paddle/Razorpay), subscription lifecycle | Not applicable — replaced by an offline licence key |
| Parent portal links (`/view/:name/:token`) | Only reachable from devices on the school LAN unless the school has internet |

## Architecture

```text
School computer (Windows / mini-PC)
├─ Postgres 15            ← all school data, same schema + RLS
├─ Supabase services      ← GoTrue (auth), PostgREST, Storage, Kong
├─ Local functions host   ← ported edge functions (Deno/Node)
├─ Static web build       ← same React app, pointed at http://localhost
└─ Backup service         ← nightly dump to USB / network folder

Teachers & staff reach it at http://school-server.local on the LAN
(desktop, laptop, phone browsers — no per-device install needed)
```

Packaging options, in order of preference:
1. Docker Desktop + a one-click installer script — closest to the cloud stack, easiest to keep in sync.
2. Electron shell wrapping the same LAN server for a single-PC school that wants a desktop icon.

## Work breakdown

1. **Runtime split** — introduce a build-time `deployment mode` flag (`cloud` | `onprem`) so one codebase produces both editions. No behaviour change for cloud.
2. **Feature gating** — one capability map that hides/disables WhatsApp, email, AI, online payments, Google sign-in and subscription screens in on-prem mode, replacing them with clear "requires internet" states.
3. **Local backend bring-up** — Docker compose with Postgres + Supabase services; apply the existing migrations unchanged so schema, RLS and DB functions match the cloud exactly.
4. **Edge-function port** — move the ~40 functions into a local Deno server. Roughly 15 are internet-only (payments, email, WhatsApp, AI) and are simply absent on-prem; the rest (invites, imports, school/teacher creation, report helpers) run locally.
5. **Licensing** — offline licence key with expiry, validated locally, replacing the subscription lifecycle. Optional periodic online check when internet is available.
6. **Backup & restore** — scheduled `pg_dump` to a chosen folder/USB, plus a restore command and a visible "last backup" indicator in Settings. Non-negotiable for on-prem.
7. **Updates** — versioned installer package plus an in-app updater that applies pending migrations on start.
8. **Sync (optional, phase 2)** — one-way nightly push of the school's data to the cloud so parent links, WhatsApp reminders and AI insights keep working when the school does have internet.
9. **Field kit** — install guide, LAN/hostname setup, printer setup, admin recovery procedure, and a support runbook.

## Effort and trade-offs

- Phases 1–4 are the bulk of the engineering; 5–7 are what make it supportable in real schools.
- Realistic first release: on-prem core (students, fees, attendance, marks, report cards) without AI, WhatsApp or payments.
- Ongoing cost is support, not servers: every school becomes an installation you must patch, back up and troubleshoot remotely — plan for a per-install annual licence that covers this.
- Recommended middle path if connectivity is the only concern: keep the cloud product and add offline-tolerant behaviour (local caching + queued writes) instead of a full on-prem edition — far cheaper to build and support.

## Scope guardrail

No changes to the current cloud app in this phase. All on-prem work lands behind the deployment-mode flag and in new packaging files.
