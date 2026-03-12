# KruiseKonnect — Rate Limiting Specification

---

## Architecture: Three Independent Layers

```
Request → Netlify Edge (Layer 1) → NestJS Throttler (Layer 2) → Redis Store (Layer 3)
```

Rate limiting at one layer is not enough.
If Netlify is bypassed and someone hits Render directly, NestJS + Redis still enforces limits.

---

## Layer 1 — Netlify Edge (Coarse IP Throttle)

Blocks volumetric attacks before they hit Render.
Protects Render compute budget.

```javascript
// netlify/edge-functions/rate-limiter.js
import { Redis } from 'https://esm.sh/@upstash/redis'

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL'),
  token: Deno.env.get('UPSTASH_REDIS_TOKEN'),
})

export default async (request, context) => {
  const ip = context.ip ?? 'unknown'
  const key = `edge:ratelimit:${ip}`

  const current = await redis.incr(key)
  if (current === 1) await redis.expire(key, 60) // 60 second window

  if (current > 100) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: { 'Retry-After': '60' }
    })
  }

  return context.next()
}
```

```toml
# netlify.toml
[[edge_functions]]
  path = "/api/*"
  function = "rate-limiter"
```

---

## Layer 2 — NestJS Throttler Setup

```typescript
// apps/api/src/app.module.ts
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    storage: new ThrottlerStorageRedisService({
      host: config.get('UPSTASH_REDIS_URL'),
      token: config.get('UPSTASH_REDIS_TOKEN'),
    }),
    throttlers: [
      { name: 'burst',    ttl: 1_000,       limit: 5    }, // 5 per second
      { name: 'standard', ttl: 60_000,      limit: 60   }, // 60 per minute
      { name: 'daily',    ttl: 86_400_000,  limit: 2000 }, // 2000 per day
    ],
  }),
})
```

---

## Layer 3 — Per-Endpoint Rate Limit Table

Each sensitive endpoint has its own override via `@Throttle()` decorator.

| Endpoint | Limit | Window | Key By | Reason |
|---|---|---|---|---|
| `POST /auth/login` | 5 | 15 min | IP + email | Brute force |
| `POST /auth/signup` | 3 | 1 hour | IP | Account farming |
| `POST /auth/forgot-password` | 3 | 1 hour | IP + email | Abuse prevention |
| `GET /routes/search` | 20 | 1 min | IP | Compute cost |
| `POST /bookings/create` | 5 | 10 min | User ID | Booking spam |
| `POST /payments/initialize` | 3 | 5 min | User ID | Costs money |
| `POST /payments/webhook` | Unlimited (IP whitelist) | — | Paystack IPs only | High vol legitimate |
| `GET /bookings/reference/:code` | 10 | 15 min | IP | Reference enumeration |
| `GET /booking/retrieve` | 10 | 15 min | IP + email | Reference brute force |
| `GET /documents/receipt/:id` | 10 | 5 min | User ID | PDF gen cost |
| `GET /documents/itinerary/:id` | 10 | 5 min | User ID | PDF gen cost |
| `GET /admin/*` | 60 | 1 min | Admin User ID | Normal admin use |
| `POST /admin/*` | 20 | 1 min | Admin User ID | Mutation control |
| `DELETE /admin/*` | 10 | 1 min | Admin User ID | Destructive action |

---

## Sliding Window for High-Risk Endpoints

Fixed window allows burst at boundary. Use sliding window for payments and bookings.

```typescript
// apps/api/src/common/guards/sliding-window.guard.ts
@Injectable()
export class SlidingWindowGuard implements CanActivate {
  constructor(
    @InjectRedis() private redis: Redis,
    private readonly options: { key: string; limit: number; windowMs: number }
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const userId = request.user?.id ?? request.ip
    const key = `sw:${this.options.key}:${userId}`
    const now = Date.now()
    const windowStart = now - this.options.windowMs

    const pipe = this.redis.pipeline()
    pipe.zremrangebyscore(key, 0, windowStart)
    pipe.zcard(key)
    pipe.zadd(key, now, `${now}-${Math.random()}`)
    pipe.expire(key, Math.ceil(this.options.windowMs / 1000))

    const results = await pipe.exec()
    const count = results[1] as number

    if (count >= this.options.limit) {
      throw new ThrottlerException()
    }

    return true
  }
}
```

Apply to:
- `POST /payments/initialize` — limit 3 per 5 min per user (sliding)
- `POST /bookings/create` — limit 5 per 10 min per user (sliding)

---

## Response Headers for Rate Limits

Always include these headers so clients know their limit status:

```typescript
// apps/api/src/common/interceptors/throttle-headers.interceptor.ts
@Injectable()
export class ThrottleHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse()

    return next.handle().pipe(
      tap(() => {
        response.setHeader('X-RateLimit-Limit', limit)
        response.setHeader('X-RateLimit-Remaining', remaining)
        response.setHeader('X-RateLimit-Reset', resetTime)
      })
    )
  }
}
```

---

## Rate Limit Error Response

Always return consistent structure:

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "retryAfter": 60
}
```

Never expose internal limit values or key patterns in the error response.

---

## Paystack Webhook — IP Whitelist Guard

The webhook endpoint bypasses rate limiting entirely but is guarded by IP whitelist.
Keep Paystack's IP list up to date.

```typescript
// Check https://paystack.com/docs/payments/webhooks for current IPs
const PAYSTACK_WEBHOOK_IPS = [
  '52.31.139.75',
  '52.49.173.169',
  '52.214.14.220',
]

@Injectable()
export class PaystackIpGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest()
    const forwarded = req.headers['x-forwarded-for']
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip

    if (!PAYSTACK_WEBHOOK_IPS.includes(ip)) {
      throw new ForbiddenException()
    }
    return true
  }
}
```
