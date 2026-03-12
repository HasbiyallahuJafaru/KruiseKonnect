import type { Metadata } from 'next'
import { Sora, Figtree } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { cn } from '@/lib/utils'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://kruisekonnect.netlify.app'),
  title: {
    default: 'KruiseKonnect — Lagos Aviation Booking',
    template: '%s | KruiseKonnect',
  },
  description:
    'Book charter and scheduled flights across Lagos and Nigeria. Fast, secure, and reliable aviation booking.',
  keywords: ['Lagos flights', 'Nigeria aviation', 'charter flights', 'flight booking'],
  openGraph: {
    type: 'website',
    url: 'https://kruisekonnect.netlify.app',
    locale: 'en_NG',
    siteName: 'KruiseKonnect',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(sora.variable, figtree.variable, 'font-figtree')}>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: 'font-figtree',
            },
          }}
        />
      </body>
    </html>
  )
}
