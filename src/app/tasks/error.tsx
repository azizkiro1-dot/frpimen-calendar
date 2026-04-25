'use client'
export default function Err({ reset }: { reset: () => void }) {
  return (
    <div className="md:pl-64 min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm text-neutral-600">Couldn't load this page.</p>
        <button onClick={reset} className="mt-3 text-sm font-medium text-blue-600 hover:underline">Retry</button>
      </div>
    </div>
  )
}
