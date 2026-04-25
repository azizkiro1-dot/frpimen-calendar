'use client'

export default function GlobalError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-red-100 flex items-center justify-center mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Something broke</h1>
          <p className="text-sm text-neutral-600 mt-2">
            We hit an unexpected error. Try refreshing.
          </p>
          {error.digest && (
            <p className="text-[11px] text-neutral-400 mt-2 font-mono">ref {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="mt-5 h-10 px-5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
