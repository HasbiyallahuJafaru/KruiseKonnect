import { Mail, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'

const EMAIL_TEMPLATES = [
  { name: 'Booking confirmation', trigger: 'On booking creation (pending)', status: 'active' },
  { name: 'Payment confirmed', trigger: 'On payment success', status: 'active' },
  { name: 'Itinerary PDF', trigger: 'On payment success (attachment)', status: 'active' },
  { name: 'Booking cancelled', trigger: 'On cancellation', status: 'active' },
  { name: 'Payment failed', trigger: 'On payment failure', status: 'active' },
  { name: 'Booking reminder', trigger: '24h before departure', status: 'active' },
]

export default function AdminEmailsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-navy">Emails</h1>
        <p className="text-sm text-navy/60">Automated transactional emails sent via Resend</p>
      </div>

      <Card padding="none">
        <div className="divide-y divide-navy/8">
          {EMAIL_TEMPLATES.map((tpl) => (
            <div key={tpl.name} className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-sky-pale flex items-center justify-center">
                  <Mail size={15} className="text-sky-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">{tpl.name}</p>
                  <p className="text-xs text-navy/50">{tpl.trigger}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 size={12} />
                Active
              </div>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-xs text-navy/40 mt-4">
        Email templates are managed in code. To customise templates, edit the Resend templates in the API service.
      </p>
    </div>
  )
}
