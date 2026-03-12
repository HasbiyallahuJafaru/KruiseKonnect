import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/dashboard')

  const fullName  = (user.user_metadata?.full_name as string | undefined) ?? ''
  const email     = user.email ?? ''
  const userName  = fullName || email.split('@')[0]
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-chalk">
      <DashboardSidebar
        userName={userName}
        userEmail={email}
        userInitial={userInitial}
      />

      {/* Main content — offset for mobile top/bottom bars */}
      <main className="flex-1 min-w-0 pt-14 pb-24 md:pt-0 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
