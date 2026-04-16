'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export function DailyLimitSetting({
  coupleId,
  currentLimit,
}: {
  coupleId: string
  currentLimit: number | null
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentLimit?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('couples') as any)
      .update({ daily_limit: value ? parseFloat(value) : null })
      .eq('id', coupleId)
    setLoading(false)
    setEditing(false)
    showToast('Limite diário atualizado!')
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">Limite diário de gastos</p>
        <p className="text-xs text-gray-500">Receba um alerta no dashboard quando ultrapassar esse valor em um dia</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="ex: 200,00"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
          <button onClick={handleSave} disabled={loading} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
            Salvar
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
            Cancelar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="text-sm text-primary-600 hover:underline"
        >
          {currentLimit ? formatCurrency(currentLimit) : 'Definir'}
        </button>
      )}
    </div>
  )
}
