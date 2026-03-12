import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuth = !!user
  const { pathname } = req.nextUrl

  const isDashboardPath = pathname.startsWith('/dashboard')
  const isBookingProtected = /^\/booking\/(checkout|payment|confirmation)/.test(pathname)
  const isAdminPath = pathname.startsWith('/admin')

  if ((isDashboardPath || isBookingProtected) && !isAuth) {
    const redirectUrl = new URL(`/login?redirect=${encodeURIComponent(pathname)}`, req.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminPath) {
    if (!isAuth) return NextResponse.redirect(new URL('/login', req.url))
    // app_metadata is set server-side by Supabase and is not user-modifiable
    if (user.app_metadata?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/booking/checkout/:path*',
    '/booking/payment/:path*',
    '/booking/confirmation/:path*',
  ],
}
