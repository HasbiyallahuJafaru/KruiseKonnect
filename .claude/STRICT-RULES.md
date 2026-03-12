# KruiseKonnect — Strict Rules (Never Violate These)

These are hard rules. If you find yourself about to break any of these,
stop and re-read the relevant docs file instead.

---

## Security Rules

### SR-01: No Service Role Key on Frontend
NEVER use `SUPABASE_SERVICE_ROLE_KEY` in any Next.js code — not in Server Components,
not in API routes, not in middleware. It belongs ONLY in NestJS on Render.

### SR-02: No Secrets in NEXT_PUBLIC_ Variables
`NEXT_PUBLIC_` variables are exposed to the browser.
Never put: Paystack secret key, Supabase service role, Resend API key, or any write-capable key here.

### SR-03: No Client-Side Payment Verification
NEVER verify a payment on the frontend. NEVER trust a URL parameter or query string
that says payment was successful. ALL payment verification happens server-side in NestJS
via the Paystack API independently.

### SR-04: No Client-Side Booking Amount Calculation
The `total_price` for a booking is ALWAYS calculated server-side from the database.
NEVER use a price value sent from the client request body.

### SR-05: Webhook Body Must Be Raw Buffer
NEVER let NestJS parse the Paystack webhook body as JSON before verifying the signature.
The signature is computed over the raw bytes. Pre-parsing breaks verification.

### SR-06: No === for Signature Comparison
NEVER use `===` or `.equals()` for comparing HMAC signatures.
ALWAYS use `crypto.timingSafeEqual()` to prevent timing attacks.

### SR-07: No Unverified Webhooks
NEVER process a Paystack webhook event without verifying the x-paystack-signature header first.
Return 401 silently — do not explain why the webhook was rejected.

### SR-08: No Direct Storage URLs for Documents
NEVER return the raw Supabase Storage path to the client.
ALWAYS generate a signed URL with 15-minute expiry via `createSignedUrl()`.
The storage bucket is private.

### SR-09: RLS on Every Table
NEVER create a Supabase table without enabling RLS.
NEVER leave a table with RLS enabled but no policies — this blocks all access.
Write the RLS policy at the same time as the table.

### SR-10: No Role Escalation via API
NEVER create an endpoint that allows a user to change their own role.
Role changes require a super_admin action and are logged to audit_logs.

### SR-11: No Stack Traces to Client
NEVER let NestJS return a stack trace, internal error message, or Supabase error
to the client response. Log it server-side (Sentry) and return a generic message.

### SR-12: Audit Log is Append-Only
NEVER add an UPDATE or DELETE operation on the audit_logs or email_logs tables.
They are write-once records.

---

## Database Rules

### DR-01: No Sequential Public Identifiers
NEVER use auto-increment integer IDs as public-facing identifiers.
Use UUIDs for database IDs. Use the `KK-XXXXXXXX` format for booking references.

### DR-02: No Unbounded Queries
NEVER query a list without a LIMIT clause.
NEVER return a list endpoint without pagination.
Hard cap: max 100 records per page.

### DR-03: No Raw String Interpolation in SQL
NEVER build SQL queries by concatenating user input.
ALWAYS use parameterised queries / bound parameters / ORM methods.

### DR-04: Atomic Seat Booking
NEVER check available_seats and decrement in separate queries.
ALWAYS use the atomic UPDATE...WHERE available_seats >= N...RETURNING transaction.
See DATABASE.md for the exact SQL.

### DR-05: No Hard Deletes on Critical Tables
NEVER hard-delete rows from: bookings, payments, booking_passengers, audit_logs, email_logs.
Use soft delete (cancelled_at, deleted_at, is_active: false).

---

## API Rules

### AR-01: Every Protected Endpoint Has a Guard
NEVER forget `@UseGuards(SupabaseAuthGuard)` on authenticated endpoints.
NEVER forget `@UseGuards(AdminGuard)` on admin endpoints.
Guards are not optional.

### AR-02: Every Public List Endpoint is Cached
NEVER return a public list (routes, schedules, aircraft) without a cache layer.
See CACHING.md for TTL values.

### AR-03: Never Cache Authenticated Responses
NEVER apply `@UseInterceptors(CacheInterceptor)` to an endpoint that returns user-specific data.
Never set `Cache-Control: public` on authenticated responses.

### AR-04: Every Request Body Has a DTO
NEVER accept a raw `@Body() body: any` without a `class-validator` DTO.
The global ValidationPipe with `whitelist: true` must be enabled.

### AR-05: CORS Locked to Known Origins
NEVER set `origin: '*'` in production.
NEVER allow CORS from unknown domains.

---

## Frontend Rules

### FR-01: No localStorage for Auth Tokens
NEVER store JWTs, session tokens, or user data in localStorage or sessionStorage.
Supabase auth uses httpOnly cookies via SSR helpers.

### FR-02: No Raw <img> Tags
NEVER use `<img>` for images. ALWAYS use `next/image`.

### FR-03: No Polling for Payment Status
NEVER use `setInterval` or `refreshInterval` to poll payment status.
ALWAYS use the SSE endpoint at `/sse/payments/:reference`.

### FR-04: No TypeScript `any`
NEVER use `any` type. Use proper types from `packages/shared/types`.
If a type is unknown, use `unknown` and narrow it.

### FR-05: No Inline Styles
NEVER use `style={{ }}` attributes. ALWAYS use Tailwind classes.

### FR-06: Dashboard and Admin Pages Must Be force-dynamic
NEVER set `revalidate` on dashboard or admin pages.
ALWAYS set `export const dynamic = 'force-dynamic'`.

### FR-07: No Secrets in Client Components
NEVER import or use `process.env.SUPABASE_SERVICE_ROLE_KEY` or any non-NEXT_PUBLIC secret
in a Client Component (`'use client'`).

---

## Code Quality Rules

### CQ-01: No Console.log in Production Code
Use NestJS Logger on the backend. Use error boundaries on the frontend.
No `console.log` statements in committed code.

### CQ-02: Shared Types Come from packages/shared
NEVER duplicate type definitions between frontend and backend.
Define once in `packages/shared/types`, import from both apps.

### CQ-03: No Magic Numbers
NEVER hardcode numbers like `900`, `1800`, `100` without a named constant.
Define constants in `packages/shared/constants`.

### CQ-04: Every Async Function Has Error Handling
NEVER leave async functions without try/catch or without a .catch() handler.
Unhandled promise rejections crash the NestJS process.
