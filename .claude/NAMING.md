# KruiseKonnect — Naming Conventions

Consistent naming prevents confusion across frontend, backend, and database.

---

## Database (snake_case)

| Entity | Convention | Example |
|---|---|---|
| Tables | singular, snake_case | `booking`, `booking_passenger`, `email_log` |
| Columns | snake_case | `booking_reference`, `created_at`, `user_id` |
| Indexes | `idx_{table}_{column}` | `idx_bookings_user_id` |
| Foreign keys | `fk_{table}_{ref_table}` | `fk_bookings_schedules` |
| Policies | descriptive string | `"Users can view own bookings"` |
| Functions | snake_case | `generate_booking_reference()` |

---

## TypeScript / NestJS (camelCase + PascalCase)

| Entity | Convention | Example |
|---|---|---|
| Classes | PascalCase | `BookingsService`, `PaymentsController` |
| Interfaces | PascalCase | `BookingResponse`, `CreateBookingDto` |
| Types | PascalCase | `BookingStatus`, `PaymentStatus` |
| Enums | PascalCase + UPPER values | `BookingStatus.CONFIRMED` |
| Variables | camelCase | `bookingReference`, `totalPrice` |
| Functions | camelCase | `createBooking()`, `verifyPayment()` |
| Constants | UPPER_SNAKE_CASE | `MAX_PASSENGERS`, `DEFAULT_PAGE_SIZE` |
| Files | kebab-case | `bookings.service.ts`, `create-booking.dto.ts` |
| Directories | kebab-case | `booking-passengers/`, `email-logs/` |

---

## NestJS Module File Naming

```
src/bookings/
├── bookings.module.ts
├── bookings.controller.ts
├── bookings.service.ts
├── bookings.repository.ts
├── dto/
│   ├── create-booking.dto.ts
│   ├── update-booking.dto.ts
│   └── booking-response.dto.ts
└── entities/
    └── booking.entity.ts
```

---

## Next.js (kebab-case files, PascalCase components)

| Entity | Convention | Example |
|---|---|---|
| Page files | `page.tsx` | `app/dashboard/bookings/page.tsx` |
| Layout files | `layout.tsx` | `app/dashboard/layout.tsx` |
| Components | PascalCase | `BookingCard.tsx`, `FlightSearchForm.tsx` |
| Hooks | `use` prefix, camelCase | `useBookings.ts`, `usePaymentStatus.ts` |
| Utils | camelCase | `formatPrice.ts`, `generateReference.ts` |
| Types | PascalCase | `BookingCardProps`, `SearchFormValues` |

---

## API Endpoints (kebab-case, plural nouns)

```
GET    /routes              ← plural noun
GET    /routes/search       ← noun + verb
GET    /routes/:id
POST   /bookings/create     ← noun + verb (not just POST /bookings)
GET    /bookings/:id
PATCH  /bookings/:id/cancel ← sub-action
GET    /admin/bookings      ← admin prefix
```

---

## Environment Variables

```
# Format: SCREAMING_SNAKE_CASE
# Prefix NEXT_PUBLIC_ for frontend-safe vars only

NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PAYSTACK_SECRET_KEY
PAYSTACK_WEBHOOK_SECRET
UPSTASH_REDIS_URL
RESEND_API_KEY
```

---

## Redis Cache Keys

```
Format: {domain}:{identifier}

routes:all
route:{uuid}
search:{origin}:{destination}:{YYYY-MM-DD}
schedule:{uuid}
seats:{scheduleId}
aircraft:all
aircraft:{uuid}
admin:stats:{YYYY-MM-DD}

Rate limit keys (separate namespace):
ratelimit:{endpoint}:{userId}
sw:{endpoint}:{userId}        ← sliding window
edge:ratelimit:{ip}           ← Netlify edge
```

---

## Booking Reference Format

```
Format: KK-{8 random uppercase alphanumeric}
Charset: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no ambiguous chars: 0,O,1,I)
Example: KK-X7F2Q9RP
```

---

## Shared Types Package

```typescript
// packages/shared/types/index.ts

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'failed' | 'refunded'
export type PaymentStatus = 'initialized' | 'pending' | 'success' | 'failed' | 'reversed'
export type DocumentType = 'receipt' | 'itinerary'
export type EmailType = 'confirmation' | 'receipt' | 'cancellation' | 'reminder'
export type UserRole = 'customer' | 'admin' | 'super_admin'

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}
```

---

## Git Branch Naming

```
feature/{ticket}-{short-description}   → feature/KK-12-payment-webhook
fix/{ticket}-{short-description}       → fix/KK-34-seat-race-condition
chore/{description}                    → chore/add-redis-cache
```
