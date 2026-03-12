# KruiseKonnect — Claude Code Master Guide

You are building **KruiseKonnect**, a full-stack aviation booking platform.
Read every file in this `.claude/` folder before writing a single line of code.
These files are your source of truth. Do not deviate from them.

---

## File Index — Read All of These

| File | Purpose |
|---|---|
| `CLAUDE.md` | This file. Master overview and rules index |
| `docs/PRD.md` | Full product requirements document |
| `docs/ARCHITECTURE.md` | System architecture, stack, deployment |
| `docs/DATABASE.md` | Complete schema, indexes, RLS policies |
| `docs/SECURITY.md` | Zero trust security rules — never skip |
| `docs/CACHING.md` | Redis caching strategy and TTL policy |
| `docs/RATE-LIMITING.md` | Per-endpoint rate limiting rules |
| `docs/API.md` | All API endpoints, request/response shapes |
| `docs/PAYMENTS.md` | Paystack integration — exact implementation |
| `docs/FRONTEND.md` | Next.js rules, page list, caching strategy |
| `docs/EMAILS.md` | Email service integration and templates |
| `docs/JOBS.md` | Background job queue design |
| `rules/STRICT-RULES.md` | Hard rules — things Claude must never do |
| `rules/AVOID.md` | Anti-patterns and common mistakes to avoid |
| `rules/NAMING.md` | File, variable, function, table naming conventions |
| `rules/TESTING.md` | Testing requirements per layer |

---

## Project Summary

**KruiseKonnect** is a modern aviation booking platform where:
- Customers search routes, book flights, pay via Paystack, get PDF receipts
- Admins manage bookings, routes, schedules, fleet, payments, and reports
- The system handles concurrent bookings safely, never oversells seats
- All documents are private, all payments are server-verified, all sessions are JWT-secured

---

## Tech Stack (Non-Negotiable)

### Frontend
- **Next.js 14** (App Router)
- **TailwindCSS**
- **Framer Motion**
- **SWR** for client-side data fetching
- **Deployed on Netlify**

### Backend
- **NestJS** (TypeScript)
- **Deployed on Render**

### Database
- **PostgreSQL via Supabase**
- **Supabase Auth** for authentication
- **Supabase Storage** for documents (private bucket)

### Cache & Queue
- **Redis via Upstash** (rate limiting + caching + BullMQ)

### Payments
- **Paystack**

### Email
- **Resend**

### Monitoring
- **Sentry** (both frontend and backend)

---

## Monorepo Structure

```
kruisekonnect/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared TypeScript types
├── .claude/          # This folder — Claude's guide files
├── package.json      # Root workspace
└── turbo.json        # Turborepo config
```

---

## Non-Negotiable Principles

1. **Security first** — Read `docs/SECURITY.md` before touching auth, payments, or database
2. **No raw SQL string interpolation** — Always use parameterised queries
3. **No secrets in frontend** — Never use `NEXT_PUBLIC_` for secrets
4. **No unbounded queries** — Every list endpoint is paginated
5. **No client-side payment logic** — All payment verification is server-side only
6. **RLS on every table** — No Supabase table is left without row-level security
7. **Typed everything** — No `any` in TypeScript. Ever.
8. **Errors never leak internals** — All API errors return generic messages to clients

---

## Before Writing Any Module

Ask yourself:
1. Have I read the relevant `docs/` file for this module?
2. Does this touch payments? → Re-read `docs/PAYMENTS.md`
3. Does this touch the database? → Re-read `docs/DATABASE.md` for RLS
4. Does this touch auth? → Re-read `docs/SECURITY.md`
5. Am I returning a list? → Is it paginated?
6. Am I caching this? → Check `docs/CACHING.md` for TTL policy
7. Am I creating an endpoint? → Does it have a rate limit in `docs/RATE-LIMITING.md`?
