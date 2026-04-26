'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle2, AlertCircle, Loader2, FileText, Calendar as CalIcon } from 'lucide-react'
import { importCalendly } from '@/app/actions/calendly-import'
import { importIcs } from '@/app/actions/ics-import'

type Mode = 'csv' | 'ics'

export function ImportForm() {
  const [mode, setMode] = useState<Mode>('ics')
  const [file, setFile] = useState<File | null>(null)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ imported: number; skipped: number; error?: string; errors?: string[] } | null>(null)

  const handleUpload = async () => {
    if (!file) return
    setResult(null)
    startTransition(async () => {
      if (mode === 'csv') {
        const fd = new FormData()
        fd.set('file', file)
        const res = await importCalendly(fd)
        setResult(res)
      } else {
        const text = await file.text()
        const res = await importIcs(text)
        setResult(res)
      }
    })
  }

  return (
    <div className="space-y-4 max-w-xl">
      {/* Mode tabs */}
      <div className="flex rounded-2xl bg-neutral-100 p-1">
        {([
          { id: 'ics' as Mode, label: 'Calendar (.ics)', desc: 'Apple, Google, Outlook' },
          { id: 'csv' as Mode, label: 'Calendly (.csv)', desc: 'Calendly export' },
        ]).map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null); setFile(null) }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-[13px] font-medium transition ${
                    mode === m.id ? 'bg-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                  }`}>
            {m.label}
          </button>
        ))}
      </div>

      <motion.label
        whileTap={{ scale: 0.99 }}
        className="block bg-white border-2 border-dashed border-neutral-300 hover:border-neutral-400 rounded-2xl p-8 text-center cursor-pointer transition"
      >
        <input type="file" accept={mode === 'csv' ? '.csv' : '.ics,text/calendar'} className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
        {mode === 'ics' ? <CalIcon className="h-8 w-8 mx-auto text-neutral-400 mb-2" /> : <FileText className="h-8 w-8 mx-auto text-neutral-400 mb-2" />}
        <p className="text-sm font-medium text-neutral-900">{file ? file.name : `Drop your .${mode} file or click to browse`}</p>
        <p className="text-[12px] text-neutral-500 mt-1">{mode === 'ics' ? 'Export from Apple Calendar, Google, or Outlook' : 'Export from Calendly Settings → Scheduled Events'}</p>
      </motion.label>

      <button onClick={handleUpload} disabled={!file || pending}
              className="w-full h-11 rounded-full bg-neutral-900 text-white font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2">
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing…</> : <><Upload className="h-4 w-4" /> Import</>}
      </button>

      {result && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-2">
          {result.error ? (
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" /> <span className="font-medium">{result.error}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">{result.imported} events imported</span>
              </div>
              <p className="text-sm text-neutral-600">{result.skipped} skipped (duplicates)</p>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
