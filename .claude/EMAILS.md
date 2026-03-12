# KruiseKonnect — Email Service (Resend)

---

## Setup

Provider: **Resend**
All emails are sent from NestJS via background jobs — never synchronously in a request handler.

```typescript
// apps/api/src/emails/emails.module.ts
import { Resend } from 'resend'

@Module({
  providers: [
    {
      provide: 'RESEND_CLIENT',
      useFactory: () => new Resend(process.env.RESEND_API_KEY),
    },
    EmailsService,
  ],
})
export class EmailsModule {}
```

---

## Email Types

| Type | Trigger | Template |
|---|---|---|
| `confirmation` | Booking confirmed (payment success) | Booking reference, passengers, flight details, PDF attached |
| `receipt` | Same as confirmation (separate email) | Payment receipt, amount, date |
| `cancellation` | Booking cancelled | Booking reference, reason, refund info if applicable |
| `reminder` | 24 hours before departure | Flight details, check-in info |

---

## Email Service

```typescript
// apps/api/src/emails/emails.service.ts

@Injectable()
export class EmailsService {
  constructor(
    @Inject('RESEND_CLIENT') private resend: Resend,
    private emailLogsRepo: EmailLogsRepository,
  ) {}

  async sendConfirmation(bookingId: string) {
    const booking = await this.getFullBookingData(bookingId)

    try {
      const result = await this.resend.emails.send({
        from: 'KruiseKonnect <bookings@kruisekonnect.com>',
        to: booking.contactEmail,
        subject: `Booking Confirmed — ${booking.bookingReference}`,
        html: this.renderConfirmationTemplate(booking),
        attachments: [
          {
            filename: `receipt-${booking.bookingReference}.pdf`,
            content: booking.receiptPdfBase64,
          },
          {
            filename: `itinerary-${booking.bookingReference}.pdf`,
            content: booking.itineraryPdfBase64,
          },
        ],
      })

      await this.emailLogsRepo.create({
        bookingId,
        recipient: booking.contactEmail,
        emailType: 'confirmation',
        status: 'sent',
        resendId: result.data?.id,
      })
    } catch (error) {
      await this.emailLogsRepo.create({
        bookingId,
        recipient: booking.contactEmail,
        emailType: 'confirmation',
        status: 'failed',
        errorMessage: error.message,
      })
      throw error // re-throw so job queue can retry
    }
  }
}
```

---

## Email Log Rules

- Every email attempt (success or fail) is logged to `email_logs`
- `email_logs` is append-only — never UPDATE or DELETE entries
- Failed emails can be retried via admin dashboard (queues a new job)
- Resend message ID is stored for tracking delivery status

---

## Retry Strategy (BullMQ)

```typescript
// Email jobs retry on failure with exponential backoff
await this.queue.add('send-confirmation-email', { bookingId }, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s, 10s, 20s
  },
  removeOnComplete: true,
  removeOnFail: false, // keep failed jobs for inspection
})
```

---

## Email Templates

Templates are rendered in NestJS — plain TypeScript string templates.
Do NOT use external template files that could be tampered with.
All user-supplied content (passenger names, etc.) must be HTML-escaped before insertion.

```typescript
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function renderConfirmationTemplate(booking: BookingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmed</title>
    </head>
    <body style="font-family: sans-serif; color: #0F1A2E;">
      <h1>Booking Confirmed</h1>
      <p>Reference: <strong>${escapeHtml(booking.bookingReference)}</strong></p>
      <p>Flight: ${escapeHtml(booking.origin)} → ${escapeHtml(booking.destination)}</p>
      <p>Departure: ${booking.departureTime.toISOString()}</p>
      <h2>Passengers</h2>
      <ul>
        ${booking.passengers.map(p => `<li>${escapeHtml(p.fullName)}</li>`).join('')}
      </ul>
      <p>Your receipt and itinerary are attached to this email.</p>
    </body>
    </html>
  `
}
```
