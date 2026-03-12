# KruiseKonnect — Anti-Patterns & Things to Avoid

These are common mistakes. Read this before writing any module.

---

## Payment Anti-Patterns

### ❌ Trusting client-side payment confirmation
```typescript
// WRONG — URL param says paid, do not trust it
if (searchParams.get('status') === 'success') {
  markBookingConfirmed() // NEVER DO THIS
}
```
```typescript
// CORRECT — wait for server-side webhook verification
// Only SSE push from server triggers confirmation
```

### ❌ Parsing webhook body before verifying signature
```typescript
// WRONG
@Post('webhook')
async webhook(@Body() body: PaystackEvent) { // NestJS parsed it already
  verifySignature(body) // too late — body is already parsed, not raw bytes
}
```
```typescript
// CORRECT — see PAYMENTS.md for exact implementation
// Register raw body middleware before JSON parser
// Use req.rawBody (Buffer) for signature verification
```

### ❌ Using === for signature comparison
```typescript
// WRONG — vulnerable to timing attacks
if (signature === expectedSignature) { ... }
```
```typescript
// CORRECT
if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) { ... }
```

---

## Database Anti-Patterns

### ❌ Checking then updating seats (race condition)
```typescript
// WRONG — two requests can both pass the check
const schedule = await getSchedule(id)
if (schedule.availableSeats >= count) {
  await decrementSeats(id, count) // not atomic
  await createBooking(...)
}
```
```typescript
// CORRECT — atomic UPDATE with RETURNING (see DATABASE.md)
const result = await db.query(
  `UPDATE schedules SET available_seats = available_seats - $1
   WHERE id = $2 AND available_seats >= $1 RETURNING id`,
  [count, scheduleId]
)
if (result.rows.length === 0) throw new Error('No seats available')
```

### ❌ Sequential integer booking references
```typescript
// WRONG — enumerable by anyone
const reference = `BK${lastId + 1}` // BK001, BK002...
```
```typescript
// CORRECT — random, non-sequential
const reference = generateBookingReference() // KK-X7F2Q9RP
```

### ❌ Returning all records without pagination
```typescript
// WRONG — will destroy performance at scale
return this.bookingsRepo.findAll()
```
```typescript
// CORRECT
return this.bookingsRepo.findAndCount({ skip: offset, take: limit })
```

### ❌ Table without RLS
```typescript
// WRONG — adding table without RLS policy
await supabase.from('new_table').select() // anyone can read
```
```sql
-- CORRECT — always pair table creation with RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "..." ON new_table FOR SELECT USING (...);
```

---

## API Anti-Patterns

### ❌ Role check only on frontend
```typescript
// WRONG — easily bypassed
// Frontend hides admin button based on role
// But API has no guard
@Get('admin/bookings')
async getAdminBookings() { ... } // no guard — anyone can call this
```
```typescript
// CORRECT
@Get('admin/bookings')
@UseGuards(SupabaseAuthGuard, AdminGuard)
async getAdminBookings() { ... }
```

### ❌ Accepting `any` body type
```typescript
// WRONG
@Post('bookings/create')
async create(@Body() body: any) { ... }
```
```typescript
// CORRECT
@Post('bookings/create')
async create(@Body() body: CreateBookingDto) { ... } // DTO validates everything
```

### ❌ Leaking error internals
```typescript
// WRONG — exposes table structure, stack traces
throw new Error(`Supabase error: ${supabaseError.message}`)
// Client sees: "relation 'public.bookings' does not exist"
```
```typescript
// CORRECT — log internally, return generic message
this.logger.error(supabaseError)
throw new InternalServerErrorException('Something went wrong')
```

---

## Caching Anti-Patterns

### ❌ Caching user-specific data
```typescript
// WRONG — user A could get user B's bookings
@Get('bookings/:id')
@UseGuards(SupabaseAuthGuard)
@UseInterceptors(CacheInterceptor) // ← NEVER on authenticated endpoints
async getBooking() { ... }
```

### ❌ Caching payment responses
```typescript
// WRONG
res.setHeader('Cache-Control', 'public, max-age=300')
return paymentStatus // cached payment status could be stale
```
```typescript
// CORRECT
res.setHeader('Cache-Control', 'no-store')
```

### ❌ Polling payment status
```typescript
// WRONG — hammers API and Paystack
setInterval(() => {
  fetch('/payments/verify/' + reference)
}, 2000)
```
```typescript
// CORRECT — use SSE (see FRONTEND.md)
const es = new EventSource('/sse/payments/' + reference)
```

---

## Frontend Anti-Patterns

### ❌ Storing auth token in localStorage
```typescript
// WRONG — vulnerable to XSS
localStorage.setItem('token', session.access_token)
```
```typescript
// CORRECT — Supabase SSR uses httpOnly cookies automatically
const supabase = createClient() // uses cookie storage via SSR helper
```

### ❌ Using raw <img> tags
```html
<!-- WRONG -->
<img src="/aircraft.jpg" alt="Aircraft" />
```
```tsx
// CORRECT
import Image from 'next/image'
<Image src="/aircraft.jpg" alt="Aircraft" width={400} height={300} />
```

### ❌ Skipping loading and error states
```tsx
// WRONG — crashes if data is undefined
const { data } = useSWR('/bookings/my')
return <div>{data.bookings.map(...)}</div>
```
```tsx
// CORRECT
const { data, error, isLoading } = useSWR('/bookings/my')
if (isLoading) return <LoadingSkeleton />
if (error) return <ErrorState message="Could not load bookings" />
if (!data?.bookings?.length) return <EmptyState />
return <div>{data.bookings.map(...)}</div>
```

### ❌ Using TypeScript `any`
```typescript
// WRONG
const handleResponse = (data: any) => { ... }
```
```typescript
// CORRECT — use types from packages/shared
import type { BookingResponse } from '@kruisekonnect/shared/types'
const handleResponse = (data: BookingResponse) => { ... }
```

---

## Environment Variable Anti-Patterns

### ❌ Service role key in Next.js
```typescript
// WRONG — NEXT_PUBLIC_ means it goes to the browser
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=xxx

// Also WRONG — non-public but still in Next.js app that Netlify builds
// (Server Components can accidentally log this)
SUPABASE_SERVICE_ROLE_KEY=xxx  // in apps/web/.env
```
```typescript
// CORRECT — only in apps/api/.env (Render)
SUPABASE_SERVICE_ROLE_KEY=xxx
```

### ❌ Committing .env files
```
// WRONG — .env in git
apps/api/.env  ← committed

// CORRECT — always in .gitignore
**/.env
**/.env.local
**/.env.production
```
