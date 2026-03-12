# KruiseKonnect — API Specification

All endpoints are prefixed with `/api/v1`.
All responses are JSON.
All list endpoints are paginated.
All authenticated endpoints require `Authorization: Bearer <jwt>` header.

---

## Standard Response Shapes

### Success
```json
{ "data": { ... } }
```

### Paginated List
```json
{
  "data": [ ... ],
  "meta": {
    "total": 142,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}
```

### Error
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [ "email must be a valid email" ]
}
```

---

## Auth Endpoints

### POST /auth/signup
Rate limit: 3/hour per IP

Request:
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars, 1 uppercase, 1 number)",
  "fullName": "string (required, min 2 chars)"
}
```
Response: `201 { data: { user: { id, email }, accessToken } }`
Sets httpOnly cookie on response.

---

### POST /auth/login
Rate limit: 5/15min per IP+email

Request:
```json
{
  "email": "string",
  "password": "string"
}
```
Response: `200 { data: { user: { id, email, role }, accessToken } }`
Sets httpOnly cookie on response.

---

### POST /auth/logout
Auth: Required

Response: `200 { data: { success: true } }`
Clears httpOnly cookie.

---

### GET /auth/me
Auth: Required

Response: `200 { data: { id, email, fullName, phone, role, createdAt } }`

---

## Routes & Schedules (Public)

### GET /routes
Cache: 30 min | Rate limit: standard

Query params: `page=1&limit=25`

Response: paginated list of routes with `{ id, origin, destination, distanceKm }`

---

### GET /routes/search
Cache: 2 min per search params | Rate limit: 20/min per IP

Query params:
```
origin=Lagos
destination=Abuja
date=2025-06-15          (YYYY-MM-DD)
passengers=2             (default: 1)
```

Response: list of matching schedules with:
```json
{
  "id": "uuid",
  "route": { "origin": "Lagos", "destination": "Abuja" },
  "aircraft": { "model": "Cessna 208", "seatCapacity": 9 },
  "departureTime": "2025-06-15T08:00:00Z",
  "arrivalTime": "2025-06-15T09:15:00Z",
  "price": 75000.00,
  "availableSeats": 6
}
```

---

### GET /schedules/:id
Cache: 10 min | Rate limit: standard

Response: full schedule detail including route, aircraft, pricing

---

## Bookings

### POST /bookings/create
Auth: Required | Rate limit: 5/10min per user (sliding window)
Cache: never

Request:
```json
{
  "scheduleId": "uuid",
  "passengers": [
    {
      "fullName": "string (required)",
      "passportNumber": "string (optional)",
      "seatNumber": "string (optional)",
      "dateOfBirth": "YYYY-MM-DD (optional)"
    }
  ],
  "contactEmail": "valid email",
  "contactPhone": "string"
}
```

Process (server-side):
1. Validate all inputs with DTO
2. Verify schedule exists and is active
3. Atomic seat decrement (see DATABASE.md)
4. Generate booking reference (KK-XXXXXXXX)
5. Create booking with status: pending
6. Create booking_passengers records
7. Return booking summary

Response: `201 { data: { bookingId, bookingReference, totalPrice, status } }`

Errors:
- `400 Validation failed` — invalid inputs
- `409 No seats available` — seats taken
- `404 Schedule not found`

---

### GET /bookings/:id
Auth: Required (own booking only)
Cache: never

Response: full booking with passengers, schedule, payment status

---

### GET /bookings/reference/:code
Auth: Not required (public retrieve flow)
Rate limit: 10/15min per IP

Query params: `email=user@email.com` (required — must match booking email)

Both `code` AND `email` must match — neither alone is sufficient.

Response: booking summary (no sensitive payment details)

---

### GET /bookings/my
Auth: Required
Cache: never

Query params: `page=1&limit=10&status=confirmed`

Response: paginated list of user's own bookings

---

### PATCH /bookings/:id/cancel
Auth: Required (own booking only)
Rate limit: 3/hour per user

Request: `{ "reason": "string (optional)" }`

Rules:
- Can only cancel `pending` or `confirmed` bookings
- Cannot cancel within 2 hours of departure (configurable)
- Cancellation triggers audit log

---

## Payments

### POST /payments/initialize
Auth: Required | Rate limit: 3/5min per user (sliding window)
Cache: never

Request: `{ "bookingId": "uuid" }`

Process (server-side):
1. Verify booking belongs to authenticated user
2. Verify booking status is `pending`
3. Get total_price from DB (never from request)
4. Call Paystack API to create transaction
5. Store payment record with status: initialized

Response: `{ data: { authorizationUrl, reference, amount } }`

---

### POST /payments/webhook
Auth: Paystack IP whitelist + HMAC signature
Rate limit: IP whitelist only (no standard throttle)
Cache: never

Handles: `charge.success` event only
See SECURITY.md for exact implementation.

---

### GET /payments/verify/:reference
Auth: Required (own payment only)
Rate limit: 10/5min per user
Cache: never

Calls Paystack verify API. Returns current payment status.
Used as fallback if SSE connection drops.

---

## Documents

### GET /documents/receipt/:bookingId
Auth: Required (own booking only)
Rate limit: 10/5min per user
Cache: never

Returns: `{ data: { signedUrl, expiresAt } }` — URL valid for 15 minutes

---

### GET /documents/itinerary/:bookingId
Auth: Required (own booking only)
Rate limit: 10/5min per user
Cache: never

Returns: `{ data: { signedUrl, expiresAt } }` — URL valid for 15 minutes

---

## Payment Status SSE

### GET /sse/payments/:reference
Auth: Required
Cache: never

Server-Sent Events stream. Client connects once, receives push updates.

Events:
```
data: {"status":"pending"}
data: {"status":"confirmed"}
data: {"status":"failed","reason":"Payment declined"}
```

Client closes connection on `confirmed` or `failed`.
Server closes stream after 10 minutes (timeout).

---

## Admin Endpoints

All require: Auth + Admin role guard

### GET /admin/overview
Query: `date=YYYY-MM-DD` (defaults to today)
Cache: 2 min Redis

Response:
```json
{
  "bookingsToday": 12,
  "revenueToday": 900000.00,
  "pendingPayments": 3,
  "cancellations": 1,
  "upcomingFlights": 5
}
```

---

### GET /admin/bookings
Query: `page, limit, status, scheduleId, search, dateFrom, dateTo, sortBy, sortOrder`

---

### PATCH /admin/bookings/:id/cancel
Request: `{ "reason": "string" }` — reason is required for admin cancellations

---

### POST /admin/bookings/:id/resend-confirmation
Queues a new confirmation email job.

---

### GET /admin/payments
Query: `page, limit, status, dateFrom, dateTo`

---

### GET /admin/customers
Query: `page, limit, search`

---

### POST /admin/routes
### PATCH /admin/routes/:id
### DELETE /admin/routes/:id (soft delete — sets is_active: false)

---

### POST /admin/schedules
### PATCH /admin/schedules/:id
### DELETE /admin/schedules/:id (soft delete)

---

### POST /admin/aircraft
### PATCH /admin/aircraft/:id
### DELETE /admin/aircraft/:id (soft delete)

---

### POST /admin/documents/regenerate/:bookingId
Queues PDF regeneration job for receipt and itinerary.

---

### GET /admin/email-logs
Query: `page, limit, status, bookingId`

---

### GET /admin/reports/bookings
Query: `dateFrom, dateTo, format=csv|pdf`
Response: file download

### GET /admin/reports/revenue
Query: `dateFrom, dateTo, format=csv|pdf`

### GET /admin/reports/passengers
Query: `dateFrom, dateTo, scheduleId, format=csv|pdf`

---

### GET /admin/users
### POST /admin/users
### PATCH /admin/users/:id
### DELETE /admin/users/:id (deactivate — is_active: false)

---

## Pagination Standard

All list endpoints accept:
- `page` (default: 1, min: 1)
- `limit` (default: 25, max: 100)

Always return `meta.total`, `meta.page`, `meta.limit`, `meta.totalPages`.

Never return unbounded lists. Hard cap at 100 per page.
