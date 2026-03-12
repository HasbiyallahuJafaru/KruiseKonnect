# KruiseKonnect — Zero Trust Security Specification

Zero Trust means: trust nothing, verify everything, always.
No component trusts another by default — not the frontend, not the backend, not an admin user.

---

## 1. Authentication

### JWT Strategy
- Supabase issues JWTs on login
- Every protected NestJS endpoint verifies the JWT signature using `SUPABASE_JWT_SECRET`
- Expiry is checked on every request — an expired token is always rejected
- JWTs are stored in **httpOnly cookies only** — never localStorage, never sessionStorage

### Supabase SSR Auth (Next.js)
```typescript
// apps/web/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set({ name, value, ...options }) },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  )
}
```

### NestJS JWT Guard
```typescript
// All protected routes use this guard
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException();

    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      if (error || !user) throw new UnauthorizedException();
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

### Role-Based Access
- Roles are stored in `public.profiles.role`
- Admin role is verified server-side on every `/admin/*` endpoint
- Frontend role checks are cosmetic only — backend is the source of truth
- A user cannot elevate their own role via any API call

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) throw new ForbiddenException();

    // Check role from DB, not from JWT claims
    const profile = await this.profilesService.findById(userId);
    if (!['admin', 'super_admin'].includes(profile.role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
```

### Session Expiry
- Customer JWT: 7 days
- Admin JWT: 2 hours
- After expiry, user must re-authenticate — no silent refresh for admin sessions

---

## 2. API Security

### Helmet Configuration
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.paystack.co"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### CORS Configuration
```typescript
app.enableCors({
  origin: [
    'https://kruisekonnect.com',
    'https://www.kruisekonnect.com',
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

### Input Validation
- Every request body uses a `class-validator` DTO
- `ValidationPipe` is global with `whitelist: true` and `forbidNonWhitelisted: true`
- This strips unknown properties — users cannot inject extra fields

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: false },
}));
```

### Error Handling — Never Leak Internals
```typescript
// Global exception filter — always returns generic messages to client
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log full error internally
    this.logger.error(exception);
    this.sentry.captureException(exception);

    // Return generic message to client
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'An error occurred. Please try again.';

    response.status(status).json({ statusCode: status, message });
  }
}
```

---

## 3. Payment Security

### Webhook Signature Verification (Critical)

The raw body MUST be read as a Buffer BEFORE any JSON parsing.
NestJS parses JSON by default — disable it on the webhook route.

```typescript
// main.ts — raw body middleware for webhook
app.use('/payments/webhook', express.raw({ type: 'application/json' }));

// webhook.controller.ts
@Post('webhook')
@HttpCode(200)
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Headers('x-paystack-signature') signature: string,
) {
  const rawBody = req.rawBody; // Buffer
  if (!rawBody) throw new BadRequestException();

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  // MUST use timingSafeEqual — not === (prevents timing attacks)
  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    throw new UnauthorizedException('Invalid webhook signature');
  }

  const event = JSON.parse(rawBody.toString());
  await this.webhooksService.process(event);
}
```

### Idempotency Check
```typescript
async process(event: PaystackEvent) {
  if (event.event !== 'charge.success') return; // only handle success

  const { reference } = event.data;

  // Check if already processed
  const existing = await this.paymentsRepo.findByReference(reference);
  if (existing?.status === 'success') {
    return; // Already processed — return 200, do nothing
  }

  // Double-verify with Paystack API
  const verified = await this.paystackService.verifyTransaction(reference);
  if (!verified.status || verified.data.status !== 'success') {
    await this.paymentsRepo.updateStatus(reference, 'failed');
    return;
  }

  // Verify amount matches stored booking total_price
  const booking = await this.bookingsRepo.findByPaymentReference(reference);
  const expectedAmountKobo = booking.total_price * 100; // NGN to kobo
  if (verified.data.amount !== expectedAmountKobo) {
    // Amount mismatch — flag for manual review, do NOT confirm booking
    await this.auditService.log({
      action: 'PAYMENT_AMOUNT_MISMATCH',
      metadata: { reference, expected: expectedAmountKobo, received: verified.data.amount }
    });
    return;
  }

  // All checks passed — confirm
  await this.paymentsRepo.updateStatus(reference, 'success', verified.data);
  await this.bookingsRepo.updateStatus(booking.id, 'confirmed');
  await this.queueService.addPdfJob(booking.id);
  await this.queueService.addEmailJob(booking.id);
  await this.sseService.push(reference, { status: 'confirmed' });
}
```

### Paystack IP Whitelist
Only accept webhook requests from Paystack's published IP ranges.
```typescript
const PAYSTACK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];

@Injectable()
export class PaystackIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.connection.remoteAddress;
    if (!PAYSTACK_IPS.includes(ip)) {
      throw new ForbiddenException('Webhook source not recognised');
    }
    return true;
  }
}
```

---

## 4. Document Security

### Private Supabase Storage Bucket
- Bucket name: `booking-documents`
- Bucket is **private** — no public URLs
- Files are stored at path: `receipts/{bookingId}/receipt.pdf`

### Signed URL Generation
```typescript
async getDocumentUrl(bookingId: string, userId: string, type: 'receipt' | 'itinerary') {
  // Verify ownership first
  const booking = await this.bookingsRepo.findOne({
    where: { id: bookingId, userId }
  });
  if (!booking) throw new NotFoundException();

  const doc = await this.documentsRepo.findOne({
    where: { bookingId, documentType: type }
  });
  if (!doc) throw new NotFoundException();

  // Generate signed URL — expires in 15 minutes
  const { data, error } = await this.supabase.storage
    .from('booking-documents')
    .createSignedUrl(doc.storagePath, 900); // 900 seconds = 15 min

  if (error) throw new InternalServerErrorException();
  return data.signedUrl;
}
```

---

## 5. Frontend Security

### Middleware — Route Protection
```typescript
// apps/web/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  if (req.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/booking/:path*']
}
```

### Content Security Policy (Next.js)
```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

---

## 6. Secrets Management Rules

| Secret | Location | NEVER |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Render env vars | Frontend, Git, logs |
| `PAYSTACK_SECRET_KEY` | Render env vars | Frontend, Git, logs |
| `PAYSTACK_WEBHOOK_SECRET` | Render env vars | Frontend, Git, logs |
| `SUPABASE_JWT_SECRET` | Render env vars | Frontend, Git, logs |
| `RESEND_API_KEY` | Render env vars | Frontend, Git, logs |
| `UPSTASH_REDIS_TOKEN` | Render env vars | Frontend, Git, logs |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Netlify env vars | Backend secrets |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Netlify env vars | Payment processing |

- `.env` files are always in `.gitignore`
- Separate secret values for staging and production
- Rotate all secrets if any accidental exposure occurs
- Never log secrets — use log sanitisation

---

## 7. Admin Security

- All admin actions are logged to `audit_logs` (who, what, which record, when, from where)
- Admin sessions expire after 2 hours
- Consider TOTP (2FA) for admin accounts in Phase 2
- Admin cannot delete audit_logs or email_logs — these are append-only
- Super admin is the only role that can create/deactivate other admins
