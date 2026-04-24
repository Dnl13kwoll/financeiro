'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { RefreshCw } from 'lucide-react'

export function ConvertToRecurring({
  transaction,
  coupleId,
  userId,
}: {
  transaction: { id: string; description?: string | null; amount: number; account_id: string }
  coupleId: string
  userId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    await (supabase.from('recurring_accounts') as any).insert({
      name: data.get('name') as string,
      day_due: parseInt(data.get('day_due') as string),
      amount: transaction.amount,
      couple_id: coupleId,
      user_id: userId,
    })
    setLoading(false)
    setOpen(false)
    showToast('Conta recorrente criada!')
    startTransition(() => { router.refresh() })
  }

  const defaultDay = new Date().getDate()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
        title="Converter em recorrente"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Tornar Recorrente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">Cria uma conta recorrente baseada nesta transação.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              name="name"
              required
              defaultValue={transaction.description ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor mensal</label>
            <input
              type="number"
              value={transaction.amount}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento</label>
            <input
              name="day_due"
              type="number"
              min="1"
              max="31"
              required
              defaultValue={defaultDay}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Criando...' : 'Criar recorrente'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
