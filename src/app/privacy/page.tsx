import Link from 'next/link'

export const metadata = { title: 'Privacy · Fr. Pimen Calendar' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <main className="max-w-2xl mx-auto px-5 py-10">
        <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900">← Back</Link>
        <h1 className="text-3xl font-bold mt-4">Privacy Policy</h1>
        <p className="text-sm text-neutral-500 mt-1">Last updated: April 2026</p>

        <div className="mt-6 space-y-5 text-[15px] leading-relaxed text-neutral-700">
          <section>
            <h2 className="font-semibold text-neutral-900 text-lg mb-1.5">1. Scope</h2>
            <p>Fr. Pimen Calendar is a private, single-user application built for one named priest. The app is not offered to the public.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 text-lg mb-1.5">2. What we store</h2>
            <p>We store: your Google account email, full name, profile photo URL, OAuth tokens (encrypted), event titles, dates, locations, descriptions, attendees, tasks, and chat history with the assistant.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 text-lg mb-1.5">3. Where data lives</h2>
            <p>Data is stored on Supabase (Postgres) and Vercel infrastructure. OAuth tokens and event data never leave Supabase except when (a) syncing to Google Calendar at your request, (b) sending email summaries via Resend, or (c) when the assistant queries event data to answer your questions, which is processed by Anthropic Claude.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 text-lg mb-1.5">4. Confidential events</h2>
            <p>Events marked &quot;Confidential&quot; are best-effort hidden from anyone you grant calendar sharing to. This is not equivalent to the seal of confession in canon law. Do not store sacramental confession content in this application.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 text-lg mb-1.5">5. Sharing</h2>
            <p>You can grant other Gmail addresses limited views of your calendar. They see only what you allow per the access level chosen.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 text-lg mb-1.5">6. Your rights</h2>
            <p>You may export your data or delete your account at any time. Email the operator to request export. Deleting the account removes all event, task, and chat data within 30 days.</p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900 text-lg mb-1.5">7. Contact</h2>
            <p>Questions: contact the operator who provisioned this account.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
