'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { importCalendly } from '@/app/actions/calendly-import'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)

  async function handleUpload() {
    if (!file) return
    setResult(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('file', file)
      const res = await importCalendly(fd)
      setResult(res)
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {file && <p className="text-sm text-slate-600">Ready: {file.name}</p>}
          <Button onClick={handleUpload} disabled={!file || pending} className="w-full">
            {pending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</> : <><Upload className="h-4 w-4 mr-2" /> Upload and import</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">{result.imported} events imported</span>
            </div>
            <p className="text-sm text-slate-600">{result.skipped} skipped (duplicates or invalid)</p>
            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-1">
                <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                  <AlertCircle className="h-4 w-4" /> Errors
                </div>
                <ul className="text-xs text-red-700 space-y-0.5 pl-5 list-disc">
                  {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  {result.errors.length > 10 && <li>...and {result.errors.length - 10} more</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
