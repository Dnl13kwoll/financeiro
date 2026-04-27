'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { SlidersHorizontal } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function AccountReconcile({
  accountId,
  coupleId,
  userId,
  currentBalance,
}: {
  accountId: string
  coupleId: string
  userId: string
  currentBalance: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const realBalance = parseFloat(data.get('real_balance') as string)
    const diff = realBalance - currentBalance

    if (Math.abs(diff) < 0.01) {
      showToast('Saldo já está correto!')
      setLoading(false)
      setOpen(false)
      return
    }

    const supabase = createClient()
    await supabase.from('transactions').insert({
      type: diff > 0 ? 'income' : 'expense',
      amount: Math.abs(diff),
      description: 'Ajuste de saldo (reconciliação)',
      account_id: accountId,
      date: new Date().toISOString().slice(0, 10),
      competence_date: new Date().toISOString().slice(0, 10),
      user_id: userId,
      couple_id: coupleId,
    })

    setLoading(false)
    setOpen(false)
    showToast(`Saldo ajustado em ${formatCurrency(Math.abs(diff))}!`)
    startTransition(() => { router.refresh() })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Reconciliar saldo"
        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Reconciliar Saldo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="text-gray-500">Saldo calculado pelo app:</p>
            <p className="font-bold text-gray-900 text-lg">{formatCurrency(currentBalance)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saldo real (extrato bancário)</label>
            <input
              name="real_balance"
              type="number"
              step="0.01"
              required
              defaultValue={currentBalance}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <p className="text-xs text-gray-400">
            Será criada uma transação de ajuste (entrada ou saída) para equilibrar a diferença.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Aplicar ajuste'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
