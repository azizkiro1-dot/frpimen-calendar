'use client'

import { useEffect } from 'react'

export default function Error({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="h-12 w-12 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
          <span className="text-xl">⚠</span>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900">Couldn't load this page</h2>
        <p className="text-sm text-neutral-600 mt-1.5">
          A network or server error occurred.
        </p>
        <button
          onClick={reset}
          className="mt-4 h-9 px-4 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
