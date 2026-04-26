'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  value: string  // HH:mm 24h
  onChange: (v: string) => void
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)  // 1..12
const MINS = Array.from({ length: 12 }, (_, i) => i * 5)   // 0,5,..55
const PERIODS = ['AM', 'PM']

function parse(value: string): { h: number; m: number; p: 'AM' | 'PM' } {
  const [hh, mm] = value.split(':').map(Number)
  const period = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh
  return { h: h12, m: mm || 0, p: period }
}

function combine(h: number, m: number, p: 'AM' | 'PM'): string {
  let h24 = h % 12
  if (p === 'PM') h24 += 12
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function TimeWheel({ value, onChange }: Props) {
  const init = parse(value || '09:00')
  const [hour, setHour] = useState(init.h)
  const [minute, setMinute] = useState(MINS.reduce((p, c) => Math.abs(c - init.m) < Math.abs(p - init.m) ? c : p, 0))
  const [period, setPeriod] = useState<'AM' | 'PM'>(init.p)

  useEffect(() => {
    onChange(combine(hour, minute, period))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, period])

  return (
    <div className="flex gap-1 bg-neutral-50 rounded-xl p-2">
      <Wheel items={HOURS}     value={hour}   onChange={setHour}   format={n => String(n)} />
      <span className="self-center text-neutral-400 font-bold pb-1">:</span>
      <Wheel items={MINS}      value={minute} onChange={setMinute} format={n => String(n).padStart(2, '0')} />
      <Wheel items={PERIODS as any} value={period} onChange={(v: any) => setPeriod(v)} format={v => String(v)} />
    </div>
  )
}

function Wheel<T extends string | number>({
  items, value, onChange, format,
}: { items: T[]; value: T; onChange: (v: T) => void; format: (v: T) => string }) {
  const ref = useRef<HTMLDivElement>(null)
  const ITEM_H = 36
  const idx = items.indexOf(value)

  useEffect(() => {
    if (!ref.current) return
    ref.current.scrollTop = idx * ITEM_H
  }, [idx])

  const onScroll = () => {
    if (!ref.current) return
    const i = Math.round(ref.current.scrollTop / ITEM_H)
    if (items[i] !== undefined && items[i] !== value) onChange(items[i])
  }

  return (
    <div className="relative h-[108px] w-16 overflow-hidden">
      <div className="absolute inset-x-0 top-[36px] h-[36px] bg-white rounded-md pointer-events-none" />
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
        style={{ scrollSnapType: 'y mandatory', paddingTop: ITEM_H, paddingBottom: ITEM_H }}
      >
        {items.map((it, i) => (
          <div key={i} className={`h-9 flex items-center justify-center snap-center text-[15px] tabular-nums ${
            it === value ? 'font-semibold text-neutral-900' : 'text-neutral-400'
          }`}>
            {format(it)}
          </div>
        ))}
      </div>
    </div>
  )
}
