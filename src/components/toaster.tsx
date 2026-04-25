'use client'

import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl shadow-lg border',
          title: 'text-[14px] font-medium',
          description: 'text-[12.5px] opacity-80',
        },
      }}
    />
  )
}
