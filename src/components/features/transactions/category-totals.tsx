'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ChevronDown, ChevronUp } from 'lucide-react'

type CategoryTotal = { name: string; total: number; pct: number }

export function CategoryTotals({ categories }: { categories: CategoryTotal[] }) {
  const [open, setOpen] = useState(false)
  if (categories.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span>Gastos por categoria neste período</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2.5 border-t border-gray-50 pt-3">
          {categories.map(c => (
            <div key={c.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{c.name}</span>
                <span className="font-medium text-gray-900">{formatCurrency(c.total)} <span className="text-gray-400 font-normal">({c.pct}%)</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
