# KruiseKonnect — Background Jobs (BullMQ)

---

## Why Background Jobs

Never do these things in a request handler (they would block the response):
- PDF generation
- Email sending
- Report generation
- Booking reminder scheduling

All of these go into BullMQ queues, processed by a separate NestJS worker process on Render.

---

## Queue Setup

```typescript
// apps/api/src/queue/queue.module.ts
import { BullModule } from '@nestjs/bullmq'

BullModule.forRootAsync({
  useFactory: () => ({
    connection: {
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    },
  }),
})

// Register queues
BullModule.registerQueue(
  { name: 'pdf-generation' },
  { name: 'email' },
  { name: 'reports' },
  { name: 'reminders' },
)
```

---

## Queue Definitions

### pdf-generation queue

| Job | Payload | Triggered By |
|---|---|---|
| `generate-receipt` | `{ bookingId }` | Payment confirmed |
| `generate-itinerary` | `{ bookingId }` | Payment confirmed |
| `regenerate-documents` | `{ bookingId }` | Admin requests regeneration |

```typescript
// Processor
@Processor('pdf-generation')
export class PdfProcessor {
  @Process('generate-receipt')
  async generateReceipt(job: Job<{ bookingId: string }>) {
    const { bookingId } = job.data

    const booking = await this.bookingsRepo.findFullById(bookingId)
    const pdfBuffer = await this.pdfService.generateReceipt(booking)

    // Store in private Supabase Storage bucket
    const path = `receipts/${bookingId}/receipt.pdf`
    await this.supabase.storage
      .from('booking-documents')
      .upload(path, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    // Record in booking_documents table
    await this.documentsRepo.upsert({
      bookingId,
      documentType: 'receipt',
      storagePath: path,
    })

    this.logger.log(`Receipt generated for booking ${bookingId}`)
  }
}
```

---

### email queue

| Job | Payload | Triggered By |
|---|---|---|
| `send-confirmation` | `{ bookingId }` | PDF generation complete |
| `send-cancellation` | `{ bookingId, reason }` | Booking cancelled |
| `send-reminder` | `{ bookingId }` | Scheduled 24h before departure |
| `resend-confirmation` | `{ bookingId }` | Admin resend action |

Email jobs wait for PDF jobs to complete first:
```typescript
// After both PDFs are generated, trigger email
await this.queue.add('pdf-generation', 'generate-receipt', { bookingId })
await this.queue.add('pdf-generation', 'generate-itinerary', { bookingId })
// Email job depends on both PDFs existing — check before sending
```

---

### reports queue

| Job | Payload | Triggered By |
|---|---|---|
| `export-bookings` | `{ adminId, dateFrom, dateTo, format }` | Admin report request |
| `export-revenue` | `{ adminId, dateFrom, dateTo, format }` | Admin report request |
| `export-passengers` | `{ adminId, scheduleId, format }` | Admin report request |

Report files are stored temporarily in Supabase Storage with a 1-hour signed URL.

---

### reminders queue

| Job | Payload | Triggered By |
|---|---|---|
| `schedule-reminder` | `{ bookingId, departureTime }` | Booking confirmed |

```typescript
// Schedule reminder 24 hours before departure
await this.queue.add(
  'reminders',
  'schedule-reminder',
  { bookingId, departureTime },
  {
    delay: reminderTime - Date.now(), // delay until 24h before departure
    jobId: `reminder-${bookingId}`, // prevent duplicate reminders
  }
)
```

---

## Job Options (Retry & Failure)

```typescript
const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000, // 5s → 10s → 20s
  },
  removeOnComplete: { count: 100 }, // keep last 100 completed
  removeOnFail: false, // keep all failed jobs for inspection
}
```

---

## Worker Process (Render)

The BullMQ worker runs as a separate Background Worker service on Render.
It connects to the same Redis and Supabase as the API.

```typescript
// apps/api/src/worker.ts (separate entry point)
async function bootstrapWorker() {
  const app = await NestFactory.createApplicationContext(WorkerModule)
  await app.init()
  console.log('Worker started')
}
bootstrapWorker()
```

The worker module imports only: `PdfModule`, `EmailsModule`, `DocumentsModule`, `ReportsModule`, `RemindersModule`.
It does NOT start an HTTP server.
