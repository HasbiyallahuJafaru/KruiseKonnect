import { cn } from '@/lib/utils'

type Color = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'navy'

interface BadgeProps {
  children: React.ReactNode
  color?: Color
  className?: string
}

const colorClasses: Record<Color, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  gray: 'bg-slate-50 text-slate-600 border-slate-200',
  navy: 'bg-navy/10 text-navy border-navy/20',
}

export function Badge({ children, color = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  )
}
