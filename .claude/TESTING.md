# KruiseKonnect — Testing Requirements

---

## Testing Stack

| Layer | Tool | Purpose |
|---|---|---|
| NestJS unit | Jest | Service logic, isolated |
| NestJS integration | Jest + Supertest | Controller + DB |
| NestJS e2e | Jest + Supertest | Full API flows |
| Next.js | Vitest + React Testing Library | Components + pages |
| Database | Supabase local + migrations | Schema + RLS |

---

## What Must Be Tested

### Critical (Zero Tolerance — Must Pass Before Merge)

#### Payment Webhook Handler
```typescript
describe('PaystackWebhookHandler', () => {
  it('rejects webhook with invalid signature')
  it('rejects webhook with mismatched signature')
  it('ignores already-processed payment reference')
  it('rejects payment with amount mismatch')
  it('confirms booking when all checks pass')
  it('does not confirm booking when Paystack verify returns failed')
  it('pushes SSE event on successful confirmation')
  it('logs amount mismatch to audit_logs')
})
```

#### Booking Creation (Race Condition)
```typescript
describe('BookingsService.create', () => {
  it('creates booking when seats are available')
  it('rejects booking when no seats available')
  it('handles concurrent bookings — only one succeeds when 1 seat remains')
  it('rolls back seat decrement if booking creation fails')
  it('generates unique booking reference')
  it('stores total_price from DB, not from request')
})
```

#### Auth Guards
```typescript
describe('SupabaseAuthGuard', () => {
  it('allows request with valid JWT')
  it('rejects request with no token')
  it('rejects request with expired token')
  it('rejects request with invalid signature')
})

describe('AdminGuard', () => {
  it('allows admin role through')
  it('rejects customer role')
  it('rejects unauthenticated request')
})
```

#### Document Access
```typescript
describe('DocumentsService.getDocumentUrl', () => {
  it('returns signed URL for own booking')
  it('throws NotFoundException for another user\'s booking')
  it('signed URL expires in 15 minutes')
})
```

---

### High Priority

#### Routes & Search
```typescript
describe('RoutesService', () => {
  it('returns only active routes')
  it('search returns schedules matching origin, destination, date')
  it('search respects passenger count vs available seats')
  it('cache is invalidated after route update')
})
```

#### Rate Limiting
```typescript
describe('Rate limiting', () => {
  it('blocks after 5 login attempts in 15 minutes from same IP')
  it('blocks payment initialization after 3 attempts in 5 minutes')
  it('allows webhook from Paystack IP whitelist')
  it('blocks webhook from unknown IP')
})
```

#### Pagination
```typescript
describe('Pagination', () => {
  it('returns correct page and limit')
  it('returns correct total and totalPages')
  it('caps limit at 100')
  it('defaults page to 1 and limit to 25')
})
```

---

### Standard Priority

#### Email Service
```typescript
describe('EmailsService', () => {
  it('sends confirmation email with PDF attachments')
  it('logs sent email to email_logs')
  it('logs failed email to email_logs with error')
  it('escapes HTML in user-supplied content (passenger names)')
})
```

#### Admin Actions
```typescript
describe('Admin', () => {
  it('admin can cancel booking with reason')
  it('cancellation is logged to audit_logs')
  it('admin cannot delete audit_logs entries')
  it('resend confirmation queues email job')
})
```

---

## Test Data Rules

1. NEVER use production data in tests
2. NEVER use real Paystack keys in tests — use test keys (`sk_test_...`)
3. Use a separate Supabase project for testing or Supabase local
4. Reset database state between test suites
5. Mock external services (Paystack API, Resend) in unit tests
6. Use integration tests with real DB for SQL-level logic (race conditions, RLS)

---

## Mocking External Services

```typescript
// Mock Paystack in unit tests
jest.mock('../paystack/paystack.service', () => ({
  verifyTransaction: jest.fn().mockResolvedValue({
    status: true,
    data: { status: 'success', amount: 7500000 }
  })
}))

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'test-id' } })
    }
  }))
}))
```

---

## RLS Policy Testing

Test these directly against Supabase local:

```typescript
describe('RLS Policies', () => {
  it('user can only read their own bookings')
  it('user cannot read another user\'s bookings')
  it('user cannot insert directly into payments table')
  it('user cannot insert directly into bookings table')
  it('anon user cannot read any bookings')
  it('anon user can read active routes and schedules')
})
```

---

## Pre-Deploy Checklist

Before deploying to production, verify:

- [ ] All critical tests pass
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Environment variables set on Render and Netlify
- [ ] Supabase RLS enabled on all tables
- [ ] Paystack webhook URL updated to production API URL
- [ ] Paystack webhook IP whitelist confirmed
- [ ] Redis connection confirmed (Upstash)
- [ ] Sentry DSN set on both frontend and backend
- [ ] Supabase Storage bucket is private
- [ ] `.env` files not committed to Git
- [ ] CORS origin locked to production domain
