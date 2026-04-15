'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function InstallmentCollapsible({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4 border-t border-gray-50 pt-3">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-2"
      >
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {open ? 'Ocultar parcelas' : 'Ver parcelas'}
      </button>
      {open && (
        <div className="space-y-1.5">
          {children}
        </div>
      )}
    </div>
  )
}
