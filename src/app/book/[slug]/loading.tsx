export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl border border-neutral-200 overflow-hidden grid md:grid-cols-[280px_1fr] animate-pulse">
        <div className="bg-neutral-50 p-7 space-y-3">
          <div className="h-9 w-9 rounded-2xl bg-neutral-200" />
          <div className="h-3 w-20 bg-neutral-200 rounded" />
          <div className="h-6 w-32 bg-neutral-200 rounded" />
          <div className="h-3 w-28 bg-neutral-200 rounded mt-3" />
        </div>
        <div className="p-7 space-y-3">
          <div className="h-6 w-40 bg-neutral-200 rounded" />
          <div className="h-72 w-full bg-neutral-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
