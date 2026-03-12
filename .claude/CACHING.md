# KruiseKonnect — Caching Strategy

---

## Golden Rule

```
CACHE:    Public, slowly-changing, non-personalised data
NEVER:    User bookings, payment status, admin data, any authenticated response
```

If in doubt — do NOT cache it. A stale booking status or wrong payment state is worse than a slow response.

---

## Cache Layers

```
Browser Cache (HTTP headers)
      ↓
Netlify CDN (static pages, ISR)
      ↓
Next.js fetch cache + Route cache
      ↓
NestJS Redis Cache (Upstash)
      ↓
PostgreSQL (query cache via indexes)
```

---

## Redis Setup (Upstash)

```typescript
// apps/api/src/cache/cache.module.ts
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-redis-yet'

CacheModule.registerAsync({
  isGlobal: true,
  useFactory: async () => ({
    store: await redisStore({
      url: process.env.UPSTASH_REDIS_URL,
      password: process.env.UPSTASH_REDIS_TOKEN,
    }),
    ttl: 300_000, // default 5 minutes in ms
  }),
})
```

---

## NestJS Cache TTL Policy

| Cache Key Pattern | TTL | Invalidated When |
|---|---|---|
| `routes:all` | 30 min | Admin updates any route |
| `route:{id}` | 30 min | Admin updates that route |
| `search:{origin}:{dest}:{date}` | 2 min | Any schedule update on that route |
| `schedule:{id}` | 10 min | Admin updates that schedule |
| `seats:{scheduleId}` | 30 sec | Any booking created for that schedule |
| `aircraft:all` | 60 min | Admin updates fleet |
| `aircraft:{id}` | 60 min | Admin updates that aircraft |
| `admin:stats:{YYYY-MM-DD}` | 2 min | New booking or payment event |

---

## Cache Invalidation

Every service method that mutates data MUST invalidate related cache keys.

```typescript
// Example: routes service
async updateRoute(id: string, dto: UpdateRouteDto) {
  const result = await this.repo.update(id, dto);

  // Invalidate
  await this.cache.del('routes:all');
  await this.cache.del(`route:${id}`);

  // Invalidate all search keys involving this route
  const keys = await this.redis.keys(`search:*`);
  await Promise.all(keys.map(k => this.redis.del(k)));

  return result;
}

// Example: bookings service — after confirming booking
async confirmBooking(bookingId: string, scheduleId: string) {
  // ...booking update logic
  await this.cache.del(`seats:${scheduleId}`);
  await this.cache.del('admin:stats:' + todayDateString());
}
```

---

## NestJS Cache Interceptor Usage

Apply `@UseInterceptors(CacheInterceptor)` only on public, non-personalised endpoints.
NEVER apply it on authenticated or user-specific endpoints.

```typescript
// CORRECT — public endpoint, safe to cache
@Get('routes')
@UseInterceptors(CacheInterceptor)
@CacheTTL(1800_000) // 30 min
async getAllRoutes() { ... }

// CORRECT — seat availability, short TTL
@Get('schedules/:id/seats')
@UseInterceptors(CacheInterceptor)
@CacheTTL(30_000) // 30 seconds
async getSeatAvailability(@Param('id') id: string) { ... }

// NEVER CACHE — user bookings
@Get('bookings/:id')
@UseGuards(SupabaseAuthGuard)
async getBooking() { ... } // NO cache interceptor
```

---

## Next.js Fetch Cache Policy

```typescript
// STATIC — homepage routes section (build time + revalidate every 30 min)
const routes = await fetch(`${API}/routes`, {
  next: { revalidate: 1800, tags: ['routes'] }
});

// CACHED — search results (2 min server-side cache per search params)
const results = await fetch(`${API}/routes/search?${params}`, {
  next: { revalidate: 120, tags: ['search'] }
});

// NEVER CACHE — booking confirmation
const booking = await fetch(`${API}/bookings/${id}`, {
  cache: 'no-store',
  headers: { Authorization: `Bearer ${token}` }
});

// NEVER CACHE — any authenticated user data
const dashboard = await fetch(`${API}/dashboard/overview`, {
  cache: 'no-store',
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Next.js Page-Level Cache Directives

```typescript
// app/(public)/page.tsx — Homepage
export const revalidate = 1800; // ISR — rebuild every 30 min

// app/flights/search/page.tsx — Search results
export const revalidate = 120; // Revalidate every 2 min

// app/flights/[id]/page.tsx — Flight detail
export const revalidate = 600; // Revalidate every 10 min

// app/dashboard/layout.tsx — All dashboard pages
export const dynamic = 'force-dynamic'; // Never cache

// app/admin/layout.tsx — All admin pages
export const dynamic = 'force-dynamic'; // Never cache

// app/booking/checkout/[id]/page.tsx
export const dynamic = 'force-dynamic'; // Never cache

// app/booking/confirmation/[id]/page.tsx
export const dynamic = 'force-dynamic'; // Never cache
```

---

## HTTP Cache-Control Headers (NestJS)

```typescript
// Public cacheable response — routes, schedules
@Get('routes')
async getRoutes(@Res({ passthrough: true }) res: Response) {
  res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=60');
  return this.routesService.findAll();
}

// Private authenticated response — ALWAYS no-store
@Get('bookings/:id')
@UseGuards(SupabaseAuthGuard)
async getBooking(@Res({ passthrough: true }) res: Response) {
  res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  // ...
}

// Payment endpoints — NEVER cache
@Post('payments/initialize')
async initializePayment(@Res({ passthrough: true }) res: Response) {
  res.setHeader('Cache-Control', 'no-store');
  // ...
}
```

---

## SWR Configuration (Client-Side)

```typescript
// apps/web/lib/swr.ts
export const swrConfig = {
  // Booking details — fresh on every mount, deduplicated within 60s
  bookingConfig: {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,
    refreshInterval: 0, // no polling
  },

  // Admin stats — allow background refresh every 2 min
  adminStatsConfig: {
    revalidateOnFocus: true,
    dedupingInterval: 120_000,
    refreshInterval: 120_000,
  },

  // User dashboard overview
  dashboardConfig: {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
    refreshInterval: 0,
  },
}
```

---

## What Is Never Cached (Absolute Rules)

- Any endpoint behind `@UseGuards(SupabaseAuthGuard)` with user-specific data
- `POST /bookings/create`
- `POST /payments/initialize`
- `POST /payments/webhook`
- `GET /payments/verify`
- `GET /documents/receipt/:id`
- `GET /documents/itinerary/:id`
- Anything under `/admin/*`
- Anything under `/dashboard/*`
- Booking confirmation page
- Checkout page
- Payment processing page
