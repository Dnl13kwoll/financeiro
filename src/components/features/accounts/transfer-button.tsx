'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { ArrowLeftRight } from 'lucide-react'

type Account = { id: string; name: string }

export function TransferButton({
  coupleId,
  userId,
  accounts,
}: {
  coupleId: string
  userId: string
  accounts: Account[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const fromId = data.get('from_account_id') as string
    const toId = data.get('to_account_id') as string
    const amount = parseFloat(data.get('amount') as string)
    const description = (data.get('description') as string) || 'Transferência'
    const dateVal = data.get('date') as string

    if (fromId === toId) {
      showToast('Selecione contas diferentes.', 'error')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const base = {
      type: 'transfer',
      amount,
      description,
      date: dateVal,
      competence_date: dateVal,
      user_id: userId,
      couple_id: coupleId,
    }
    // Two transactions: expense from source, income to destination
    await Promise.all([
      (supabase.from('transactions') as any).insert({ ...base, account_id: fromId }),
      (supabase.from('transactions') as any).insert({ ...base, account_id: toId }),
    ])

    setLoading(false)
    setOpen(false)
    showToast('Transferência realizada!')
    startTransition(() => { router.refresh() })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <ArrowLeftRight className="w-4 h-4" />
        Transferência
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Transferência">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conta de origem</label>
            <select
              name="from_account_id"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecionar...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conta de destino</label>
            <select
              name="to_account_id"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecionar...</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              name="description"
              placeholder="Transferência"
              defaultValue="Transferência"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={today}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Transferindo...' : 'Transferir'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
