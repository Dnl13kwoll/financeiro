'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { CheckCircle2, Circle } from 'lucide-react'

type Account = { id: string; name: string }

export function InstallmentItemToggle({
  itemId,
  paid,
  amount,
  description,
  accounts,
  defaultAccountId,
  userId,
  coupleId,
}: {
  itemId: string
  paid: boolean
  amount: number
  description?: string
  accounts: Account[]
  defaultAccountId?: string | null
  userId: string
  coupleId: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleUnpay() {
    const supabase = createClient()
    await supabase.from('installment_items').update({ paid: false }).eq('id', itemId)
    startTransition(() => { router.refresh() })
  }

  async function handlePay(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const accountId = data.get('account_id') as string
    const createTx = data.get('create_transaction') === 'on'

    const supabase = createClient()
    await supabase.from('installment_items').update({ paid: true }).eq('id', itemId)

    if (createTx && accountId) {
      await supabase.from('transactions').insert({
        type: 'expense',
        amount,
        description: description ? `Parcela: ${description}` : 'Parcela',
        account_id: accountId,
        date: new Date().toISOString().slice(0, 10),
        competence_date: new Date().toISOString().slice(0, 10),
        user_id: userId,
        couple_id: coupleId,
      })
    }

    setLoading(false)
    setOpen(false)
    showToast('Parcela marcada como paga!')
    startTransition(() => { router.refresh() })
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

      <Modal open={open} onClose={() => setOpen(false)} title="Confirmar Pagamento">
        <form onSubmit={handlePay} className="space-y-4">
          {accounts.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta debitada</label>
                <select
                  name="account_id"
                  defaultValue={defaultAccountId ?? ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sem débito automático</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input name="create_transaction" type="checkbox" defaultChecked className="rounded" />
                Lançar transação de saída automaticamente
              </label>
            </>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
