import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNgn(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(iso))
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeZone: 'Africa/Lagos',
  }).format(new Date(iso))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(iso))
}

export function getStatusColour(
  status: string
): 'green' | 'yellow' | 'red' | 'gray' | 'blue' {
  switch (status) {
    case 'confirmed':
    case 'success':
      return 'green'
    case 'pending':
    case 'initialized':
      return 'yellow'
    case 'cancelled':
    case 'failed':
      return 'red'
    case 'refunded':
    case 'reversed':
      return 'blue'
    default:
      return 'gray'
  }
}
