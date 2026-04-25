'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Sparkles } from 'lucide-react'
import { DateTime } from 'luxon'

const TZ = 'America/Chicago'

export function ConflictsView({ report, days }: { report: any; days: number }) {
  const router = useRouter()
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {[7, 14, 30, 90].map(d => (
          <button key={d} onClick={() => router.push(`/conflicts?days=${d}`)}
                  className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border ${
                    days === d ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-700 border-neutral-200'
                  }`}>
            Next {d} days
          </button>
        ))}
      </div>

      {report.conflicts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
          <p className="text-sm text-neutral-600">No conflicts in the next {days} days</p>
        </div>
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-[14px] text-amber-900">{report.conflicts.length} conflicts found</p>
                {report.suggestion && (
                  <p className="text-[13px] text-amber-900 mt-1.5 flex items-start gap-1.5"><Sparkles className="h-3 w-3 mt-1 shrink-0" /> {report.suggestion}</p>
                )}
              </div>
            </div>
          </div>
          {report.conflicts.map((c: any, i: number) => {
            const aS = DateTime.fromISO(c.a.starts_at, { zone: 'utc' }).setZone(TZ)
            const bS = DateTime.fromISO(c.b.starts_at, { zone: 'utc' }).setZone(TZ)
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="bg-white rounded-2xl border border-neutral-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="font-semibold text-[14px] truncate">{c.a.title}</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">{aS.toFormat('EEE LLL d, h:mm a')}</p>
                  </div>
                  <div className="border-l border-neutral-100 pl-3">
                    <p className="font-semibold text-[14px] truncate">{c.b.title}</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">{bS.toFormat('EEE LLL d, h:mm a')}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </>
      )}
    </div>
  )
}
