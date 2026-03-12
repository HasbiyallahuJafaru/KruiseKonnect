# KruiseKonnect — Product Requirements Document (PRD)

Version: 1.0 (Security & Performance Hardened)
Last updated: 2025

---

## 1. Product Overview

### Goal
A modern aviation booking platform where customers can:
- Search available routes or charter flights
- Book seats or full aircraft
- Pay securely via Paystack
- Receive booking confirmation and downloadable itinerary
- Re-download booking documents anytime
- Manage bookings from their account dashboard

### Admin Goals
- Manage all bookings (view, cancel, resend confirmation)
- Manage routes, schedules, and fleet
- Track all payments (success, failed, pending)
- Manage customers and their booking history
- Generate and export reports
- Full audit trail of all admin actions

---

## 2. Booking Statuses

```
pending      → booking created, payment not yet completed
confirmed    → payment verified, booking active
cancelled    → cancelled by user or admin
failed       → payment failed
refunded     → payment reversed/refunded
```

## 3. Payment Statuses

```
initialized  → Paystack transaction created
pending      → awaiting Paystack callback
success      → payment verified server-side
failed       → payment failed
reversed     → refund processed
```

---

## 4. Application Pages

### Public Pages

#### Homepage (`/`)
Sections:
- Hero with booking search widget, tagline, CTA
- Features / benefits section
- Featured routes (statically generated, revalidated every 30 min)
- How booking works (static)
- Safety & trust (static)
- Testimonials (static)
- CTA banner
- Footer

**Rendering**: Static generation with ISR (revalidate: 1800)
**API calls on load**: 0 (all static or server-rendered)

---

#### Search Flights (`/flights/search`)
- User selects: origin, destination, date, passenger count
- Results show: aircraft, price, duration, seats available
- Results are server-rendered with 2-minute revalidation
- Empty state and no-results state must be handled

---

#### Flight Details (`/flights/[scheduleId]`)
- Aircraft info, departure/arrival, seat availability, fare, policies
- "Book this flight" CTA
- Server-rendered, cached 10 min

---

#### Booking Page (`/booking/[scheduleId]`)
- Passenger details form (name, passport, seat selection)
- Contact email and phone
- Real-time seat availability check on load
- Backend creates a `pending` booking on form submit
- No payment yet at this stage

---

#### Checkout Page (`/booking/checkout/[bookingId]`)
- Booking summary, total cost breakdown
- "Pay with Paystack" button
- Must verify booking belongs to authenticated user
- Initialises Paystack on button click (server-side)
- `force-dynamic` — never cache

---

#### Payment Processing (`/booking/payment/[reference]`)
- Shows loading state
- Connects to SSE endpoint for payment status push
- No polling — SSE only
- Redirects to confirmation on success, shows error on failure

---

#### Booking Confirmation (`/booking/confirmation/[bookingId]`)
- Booking reference, passenger list, itinerary summary
- Download PDF receipt button
- Download PDF itinerary button
- "Email receipt again" button
- `force-dynamic` — never cache

---

#### Retrieve Booking (`/booking/retrieve`)
- Public page — no login required
- User enters booking reference + email
- Backend verifies both match before returning data
- Rate limited: 10 requests / 15 min per IP

---

#### Login / Signup (`/auth/login`, `/auth/signup`)
- Supabase Auth (email + password)
- JWT stored in httpOnly cookie (SSR helpers)
- Never localStorage

---

#### Contact (`/contact`)
- Static page, contact form posts to `/api/contact`

---

### Customer Dashboard (`/dashboard/*`)

All dashboard pages: `force-dynamic`, authenticated only, user sees only their own data.

- `/dashboard` — Overview: upcoming bookings, quick stats
- `/dashboard/bookings` — Full booking history (paginated)
- `/dashboard/bookings/[id]` — Single booking detail + download documents
- `/dashboard/profile` — Update name, phone, preferences

---

### Admin Dashboard (`/admin/*`)

All admin pages: `force-dynamic`, admin role required at API level (not just UI).

- `/admin` — Overview: bookings today, revenue, pending payments, cancellations
- `/admin/bookings` — Search, filter, view, resend, cancel bookings
- `/admin/payments` — Payment logs: success, failed, pending
- `/admin/customers` — Customer profiles + booking history
- `/admin/routes` — CRUD routes
- `/admin/schedules` — CRUD schedules + aircraft assignment + pricing
- `/admin/aircraft` — CRUD fleet
- `/admin/documents` — Regenerate receipt/itinerary per booking
- `/admin/emails` — Email send log + failed emails
- `/admin/reports` — Export bookings, revenue, passengers (CSV/PDF)
- `/admin/users` — Manage admin user roles and permissions

---

## 5. Booking Flow (Exact Sequence)

```
1.  User searches route → GET /routes/search (cached 2 min)
2.  User selects flight → GET /schedules/:id (cached 10 min)
3.  User enters passenger details → client-side form
4.  Form submit → POST /bookings/create
    - Validates seat availability (atomic SQL)
    - Decrements available_seats (inside transaction)
    - Creates booking with status: pending
    - Returns bookingId
5.  Redirect to /booking/checkout/:bookingId
6.  User clicks Pay → POST /payments/initialize
    - Server calculates amount (never trust client)
    - Compares against booking total_price in DB
    - Creates Paystack transaction
    - Returns Paystack authorization_url + reference
7.  Frontend opens Paystack popup/redirect
8.  Paystack sends webhook → POST /payments/webhook
    - Verify x-paystack-signature (HMAC-SHA512, raw body)
    - Check idempotency (reference already processed?)
    - Call Paystack verify API independently
    - Compare received amount vs stored booking total_price
    - If match: update payment status → success
    - Update booking status → confirmed
    - Decrement nothing (already done in step 4)
    - Trigger: PDF generation job
    - Trigger: confirmation email job
    - Push SSE event → payment status stream
9.  Frontend SSE receives 'confirmed' event
10. Redirect to /booking/confirmation/:bookingId
11. Background: PDF receipt generated, stored in private Supabase Storage
12. Background: Confirmation email sent via Resend with signed document URLs
```

---

## 6. MVP Scope

**Included in MVP:**
- Full booking search and flow
- Paystack payment integration
- Confirmation emails with PDF attachments
- Downloadable receipts and itineraries
- User dashboard (bookings + profile)
- Admin dashboard (bookings, payments, routes, schedules, fleet)
- Route and schedule management
- Booking management (view, cancel, resend)

**Phase 2 (Not in MVP):**
- Promo codes
- Loyalty points
- Corporate accounts
- Automated refunds
- WhatsApp notifications
- Advanced analytics
- Mobile app
