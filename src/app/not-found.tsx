import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-neutral-50">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold text-neutral-300 tracking-tighter">404</p>
        <h1 className="text-2xl font-semibold text-neutral-900 mt-2">Page not found</h1>
        <p className="text-sm text-neutral-600 mt-1.5">That page doesn't exist on Fr. Pimen Calendar.</p>
        <Link
          href="/"
          className="inline-block mt-5 h-10 px-5 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 leading-[40px]"
        >
          Back to calendar
        </Link>
      </div>
    </div>
  )
}
