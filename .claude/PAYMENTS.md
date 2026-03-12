# KruiseKonnect — Paystack Integration

Read this file completely before touching any payment code.
Payments are the most critical and most dangerous part of this system.

---

## Rules — No Exceptions

1. Amount is ALWAYS calculated server-side from the database — never from the client request
2. Webhook body MUST be read as raw Buffer before any JSON parsing
3. Signature verification uses `crypto.timingSafeEqual` — never `===`
4. Every webhook event is checked for idempotency before processing
5. Paystack verify API is called independently after webhook — never trust webhook alone
6. Amount from Paystack response is compared against stored `total_price` — mismatch = reject
7. Payment status is only updated from `payments` table via NestJS service role — never client
8. Any amount mismatch is logged to `audit_logs` and flagged for manual review
9. Webhook endpoint only accepts requests from Paystack IP whitelist

---

## Environment Variables

```
PAYSTACK_SECRET_KEY=sk_live_...       ← NestJS only, never frontend
PAYSTACK_WEBHOOK_SECRET=...           ← NestJS only, never frontend
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...  ← Frontend only, for popup
```

---

## Flow: Initialize Payment

```typescript
// apps/api/src/payments/payments.service.ts

async initialize(bookingId: string, userId: string) {
  // 1. Verify booking belongs to this user
  const booking = await this.bookingsRepo.findOne({
    where: { id: bookingId, userId, status: 'pending' }
  })
  if (!booking) throw new NotFoundException('Booking not found')

  // 2. Get user email for Paystack
  const profile = await this.profilesRepo.findOne({ where: { id: userId } })
  const { data: { user } } = await this.supabase.auth.admin.getUserById(userId)

  // 3. Amount comes from DB — never from request body
  const amountKobo = Math.round(booking.totalPrice * 100) // NGN to kobo

  // 4. Generate idempotency reference
  const reference = `KK-PAY-${booking.bookingReference}-${Date.now()}`

  // 5. Call Paystack
  const response = await this.http.post(
    'https://api.paystack.co/transaction/initialize',
    {
      email: user.email,
      amount: amountKobo,
      reference,
      currency: 'NGN',
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        userId,
      },
      callback_url: `${process.env.FRONTEND_URL}/booking/payment/${reference}`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )

  // 6. Store payment record
  await this.paymentsRepo.create({
    bookingId: booking.id,
    paystackReference: reference,
    amount: booking.totalPrice,
    status: 'initialized',
  })

  return {
    authorizationUrl: response.data.data.authorization_url,
    reference,
    amount: booking.totalPrice,
  }
}
```

---

## Flow: Webhook Handler (Exact Implementation)

```typescript
// apps/api/src/webhooks/webhooks.controller.ts

// CRITICAL: main.ts must register raw body for this route BEFORE app.use(json())
// app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }))

@Post('payments/webhook')
@HttpCode(200)
@UseGuards(PaystackIpGuard)
async handleWebhook(
  @Req() req: Request & { rawBody: Buffer },
  @Headers('x-paystack-signature') signature: string,
) {
  // Step 1: Ensure raw body exists
  if (!req.rawBody) {
    throw new BadRequestException('No request body')
  }

  // Step 2: Verify signature using timingSafeEqual (not ===)
  const expectedSignature = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(req.rawBody)
    .digest('hex')

  let signaturesMatch = false
  try {
    signaturesMatch = crypto.timingSafeEqual(
      Buffer.from(signature ?? '', 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    signaturesMatch = false
  }

  if (!signaturesMatch) {
    this.logger.warn('Invalid Paystack webhook signature')
    throw new UnauthorizedException('Invalid signature')
  }

  // Step 3: Parse body only after verification
  const event = JSON.parse(req.rawBody.toString())

  // Step 4: Process asynchronously — always return 200 immediately
  this.webhooksService.processPaystackEvent(event).catch(err => {
    this.logger.error('Webhook processing error', err)
    this.sentry.captureException(err)
  })

  return { received: true }
}
```

---

## Flow: Webhook Processing Service

```typescript
// apps/api/src/webhooks/webhooks.service.ts

async processPaystackEvent(event: PaystackWebhookEvent) {
  if (event.event !== 'charge.success') return

  const { reference } = event.data

  // Step 1: Idempotency check
  const existing = await this.paymentsRepo.findByReference(reference)
  if (!existing) {
    this.logger.warn(`Webhook for unknown reference: ${reference}`)
    return
  }
  if (existing.status === 'success') {
    this.logger.log(`Duplicate webhook for ${reference} — ignoring`)
    return // Already processed
  }

  // Step 2: Independent server-side verification with Paystack API
  const verification = await this.verifyWithPaystack(reference)
  if (!verification.status || verification.data.status !== 'success') {
    await this.paymentsRepo.updateStatus(reference, 'failed')
    await this.bookingsRepo.updateStatusByPaymentRef(reference, 'failed')
    await this.sseService.push(reference, { status: 'failed', reason: 'Payment verification failed' })
    return
  }

  // Step 3: Amount verification — CRITICAL
  const booking = await this.bookingsRepo.findByPaymentReference(reference)
  const storedAmountKobo = Math.round(booking.totalPrice * 100)
  const receivedAmountKobo = verification.data.amount

  if (storedAmountKobo !== receivedAmountKobo) {
    await this.auditService.log({
      action: 'PAYMENT_AMOUNT_MISMATCH',
      targetId: booking.id,
      targetType: 'booking',
      metadata: {
        reference,
        expected: storedAmountKobo,
        received: receivedAmountKobo,
      }
    })
    this.logger.error(`Amount mismatch for ${reference}: expected ${storedAmountKobo}, got ${receivedAmountKobo}`)
    // Do NOT confirm booking — flag for manual review
    return
  }

  // Step 4: All checks passed — update records
  await this.paymentsRepo.updateStatus(reference, 'success', verification.data)
  await this.bookingsRepo.updateStatus(booking.id, 'confirmed')

  // Step 5: Queue background jobs
  await this.queue.add('generate-pdf', { bookingId: booking.id })
  await this.queue.add('send-confirmation-email', { bookingId: booking.id })

  // Step 6: Push SSE event to waiting client
  await this.sseService.push(reference, { status: 'confirmed' })

  this.logger.log(`Payment confirmed for booking ${booking.bookingReference}`)
}

private async verifyWithPaystack(reference: string) {
  const response = await this.http.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  )
  return response.data
}
```

---

## NestJS main.ts Setup for Raw Body

```typescript
// apps/api/src/main.ts
import * as express from 'express'
import * as crypto from 'crypto'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body
  })

  // Raw body middleware MUST be registered before global JSON parser
  app.use('/api/v1/payments/webhook', express.raw({ type: 'application/json' }))

  // ... rest of setup
}
```

---

## Paystack Frontend Integration

```typescript
// apps/web/components/booking/PaymentButton.tsx
'use client'
import { usePaystackPayment } from 'react-paystack'

export function PaymentButton({ bookingId }: { bookingId: string }) {
  const [authData, setAuthData] = useState(null)

  const initializePayment = async () => {
    // Call YOUR backend — not Paystack directly
    const res = await fetch('/api/v1/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
      credentials: 'include', // send cookies
    })
    const { data } = await res.json()
    // Redirect to Paystack authorization URL
    window.location.href = data.authorizationUrl
  }

  return (
    <button onClick={initializePayment}>
      Pay with Paystack
    </button>
  )
}
```

---

## Error Scenarios and Handling

| Scenario | Action |
|---|---|
| Webhook signature mismatch | Log warning, return 401, do nothing |
| Duplicate webhook (already processed) | Return 200, do nothing |
| Paystack verify returns failed | Mark payment failed, mark booking failed, SSE push |
| Amount mismatch | Log to audit_logs, do NOT confirm, alert admin |
| Paystack API unreachable | Retry 3x with exponential backoff, then queue for manual check |
| SSE client disconnected | Payment still processes, client falls back to polling verify endpoint |
