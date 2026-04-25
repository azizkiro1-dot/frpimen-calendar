import { AppSidebar } from '@/components/app-sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Help · Fr. Pimen Calendar' }

const FAQ: { q: string; a: string }[] = [
  { q: 'How do I create an event?',           a: 'Tap "+ New" on the calendar header, fill in title and times, and tap Add. On phones the editor slides up from the bottom.' },
  { q: 'How do conflicts work?',              a: 'When you set a time, the app checks for overlapping events. If conflicts exist, you\'ll see a warning. You can accept the conflict or ask AI to suggest alternatives.' },
  { q: 'What does "Confidential" mean?',      a: 'Confidential events show as "Busy" to anyone you share your calendar with. They will not see the title or details unless you specifically allow it. This is best-effort and not a substitute for sacramental confidentiality.' },
  { q: 'Can multiple people use this app?',   a: 'No. The app is licensed for one user. You can grant read-only views of your calendar via the Sharing page.' },
  { q: 'How does the AI assistant work?',     a: 'The Chat page sends your question plus a snapshot of your upcoming events to Anthropic Claude. The AI does not have continuous access to your data — it\'s sent fresh each request.' },
  { q: 'How do I import from Calendly?',      a: 'Open Import from the sidebar, upload your Calendly CSV. Duplicates by exact (title, start) are skipped automatically.' },
  { q: 'How do I get reminders?',             a: 'Daily summary email arrives at 7am. For 15-min push reminders, enable from the Settings page (foreground browser only on iOS).' },
  { q: 'Where is my data stored?',            a: 'Supabase (Postgres) and Vercel infrastructure. See /privacy for details.' },
  { q: 'Can I export my data?',               a: 'Yes — Settings → Download data. Returns JSON of all events, tasks, shares, and meeting types.' },
  { q: 'How do I delete my account?',         a: 'Settings → Delete account. Removes everything within 30 days.' },
]

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppSidebar userName={profile?.full_name ?? user.email ?? ''} userEmail={user.email ?? ''} />
      <div className="lg:pl-64">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold tracking-tight">Help</h1>
          <p className="text-sm text-neutral-600 mt-1.5">Common questions about Fr. Pimen Calendar</p>
          <div className="mt-6 space-y-2.5">
            {FAQ.map((f, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 flex items-center justify-between hover:bg-neutral-50 select-none">
                  <span className="font-medium text-[14.5px] text-neutral-900 pr-4">{f.q}</span>
                  <span className="text-neutral-400 text-xl transition group-open:rotate-45">+</span>
                </summary>
                <div className="px-5 pb-4 text-[14px] text-neutral-700 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-8 text-center">
            Need more? Email the operator who provisioned this account.
          </p>
        </main>
      </div>
    </div>
  )
}
