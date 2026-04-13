'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { CheckCircle2, Circle } from 'lucide-react'

export function RecurringToggle({
  recurringId,
  referenceMonth,
  recordId,
  paid,
  amount,
}: {
  recurringId: string
  referenceMonth: string
  recordId?: string
  paid: boolean
  amount?: number
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(amount ? String(amount) : '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUnpay() {
    if (!recordId) return
    const supabase = createClient()
    await (supabase.from('recurring_records') as any).update({ paid: false }).eq('id', recordId)
    router.refresh()
  }

  async function handlePay() {
    setLoading(true)
    const supabase = createClient()
    const realAmount = parseFloat(value) || 0
    if (recordId) {
      await (supabase.from('recurring_records') as any)
        .update({ paid: true, amount: realAmount })
        .eq('id', recordId)
    } else {
      await (supabase.from('recurring_records') as any).insert({
        recurring_account_id: recurringId,
        reference_month: referenceMonth,
        amount: realAmount,
        paid: true,
      })
    }
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  if (paid) {
    return (
      <button onClick={handleUnpay} className="transition-colors" title="Marcar como não pago">
        <CheckCircle2 className="w-5 h-5 text-green-500 hover:text-green-600" />
      </button>
    )
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="transition-colors" title="Marcar como pago">
        <Circle className="w-5 h-5 text-gray-300 hover:text-green-400" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar Pagamento">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor pago</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button
              onClick={handlePay}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
