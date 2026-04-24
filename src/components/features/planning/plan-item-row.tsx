'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export function PlanItemRow({
  id,
  label,
  planned,
  spent,
}: {
  id: string
  label: string
  planned: number
  spent: number
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(planned))
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function save() {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('monthly_plans') as any)
      .update({ planned_amount: parseFloat(value) || 0 })
      .eq('id', id)
    setLoading(false)
    setEditing(false)
    startTransition(() => { router.refresh() })
  }

  async function handleDelete() {
    const supabase = createClient()
    await (supabase.from('monthly_plans') as any).delete().eq('id', id)
    startTransition(() => { router.refresh() })
  }

  const diff = planned - spent
  const pct = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0
  const over = spent > planned

  return (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-800">{label}</span>
            <div className="flex items-center gap-2">
              {editing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    step="0.01"
                    className="w-24 border border-primary-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    autoFocus
                    onBlur={save}
                    onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-gray-500 hover:text-primary-600 transition-colors tabular-nums"
                  disabled={loading}
                >
                  R$ {planned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </button>
              )}
              <button
                onClick={handleDelete}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-primary-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="text-xs text-gray-400">
              Gasto: R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({pct}%)
            </span>
            <span className={`text-xs font-medium ${over ? 'text-red-600' : 'text-green-600'}`}>
              {over ? '-' : '+'}R$ {Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
