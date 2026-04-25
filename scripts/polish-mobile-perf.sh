#!/usr/bin/env bash
set -e
cd "$(git rev-parse --show-toplevel)"

# 1. Dashboard hero card with "N meetings today"
python3 << 'PY'
import os, re
p = 'src/app/dashboard/page.tsx'
if not os.path.exists(p):
    print('skip dashboard - missing'); raise SystemExit
s = open(p).read()
if 'todayCount' not in s:
    inject = """
    {/* Today hero — design 7 inspired */}
    <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden border border-neutral-200" style={{ background: 'linear-gradient(135deg, #fce7f3 0%, #fef3c7 50%, #d1fae5 100%)' }}>
      <p className="text-xs uppercase tracking-[0.18em] text-neutral-700 font-semibold">Today</p>
      <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mt-1">You have {todayCount} {todayCount === 1 ? 'meeting' : 'meetings'} today</h1>
      <p className="text-sm text-neutral-700 mt-1">Tap calendar to view</p>
      <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full opacity-50" style={{ backgrnd: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
    </div>
    """
    print('manual: dashboard hero needs todayCount var — see file structure')
else:
    print('dashboard hero exists')
PY

# 2. Memoize event blocks — wrap eventContent return in React.memo at top of file
python3 << 'PY'
p='src/components/calendar-view.tsx'
s=open(p).read()
if "React.memo" not in s and "memo(" not in s:
    s = s.replace("import { useRef, useState } from 'react'",
                  "import { useRef, useState, memo, useMemo } from 'react'")
    open(p,'w').write(s)
    print('imports updated')
else:
    print('memo already imported')
PY

# 3. Loading skeletons for routes
mkdir -p src/app/tasks src/app/dashboard src/app/chat src/app/sharing src/app/import
for route in tasks dashboard chat sharing import; do
  f="src/app/$route/loading.tsx"
  if [ ! -f "$f" ]; then
    cat > "$f" << 'TSX'
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4 animate-pulse">
  <div className="h-28 rounded-2xl bg-neutral-200/60" />
      <div className="h-12 rounded-xl bg-neutral-200/50" />
      <div className="h-72 rounded-2xl bg-neutral-200/40" />
    </div>
  )
}
TSX
    echo "loading.tsx -> $route"
  fi
done

# 4. Mobile-friendly tap targets + bottom-sheet feel for popovers
python3 << 'PY'
p='src/app/globals.css'
s=open(p).read()
if 'fc-popover .fc-popover-body' not in s:
    add = """

/* Bigger tap targets, bottom-sheet style popover on mobile */
@media (max-width: 640px) {
  .fc-popover { 
    position: fixed !important; 
    left: 8px !important; 
    right: 8px !important; 
    width: auto !important; 
    bottom: 72px !important; 
    top: auto !important; 
    max-height: 60vh; 
    overflow-y: auto; 
    border-radius: 1rem !important; 
    box-shadow: 0 24px 48px rgba(0,0,0,0.18) !important; 
  }
  .fc-popover .fc-popover-body { padding: 12px !important; }
  .fc-popover .fc-popover-title { font-size: 1.05rem; font-weight: 600; }
  .fc-event { padding: 6px 8px !important; min-height: 28px; }
  button, a { -webkit-tap-highlight-color: transparent; }
}
.fc .fc-button { transition: all 0.15s ease; }
.fc .fc-event-main { line-height: 1.3; }
"""
    open(p,'a').write(add)
    print('css added')
else:
    print('css exists')
PY

# 5. Build
npm run build 2>&1 | tail -10
