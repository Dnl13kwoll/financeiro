'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { showToast } from '@/components/ui/toast'
import { Modal } from '@/components/ui/modal'
import { PlusCircle, Trash2 } from 'lucide-react'

export function CardInvoicePayment({
  accountId,
  coupleId,
  userId,
  invoiceTotal,
  totalPaid,
  payments,
}: {
  accountId: string
  coupleId: string
  userId: string
  invoiceTotal: number
  totalPaid: number
  payments: any[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()
  const remaining = invoiceTotal - totalPaid

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    await (supabase.from('card_invoice_payments') as any).insert({
      account_id: accountId,
      couple_id: coupleId,
      user_id: userId,
      amount: parseFloat(data.get('amount') as string),
      paid_at: data.get('paid_at') as string,
      note: (data.get('note') as string) || null,
    })
    setLoading(false)
    setOpen(false)
    form.reset()
    showToast('Pagamento registrado!')
    startTransition(() => { router.refresh() })
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await (supabase.from('card_invoice_payments') as any).delete().eq('id', id)
    showToast('Pagamento removido.', 'error')
    startTransition(() => { router.refresh() })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">Pagamentos da fatura</h3>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
        >
          <PlusCircle className="w-4 h-4" /> Registrar
        </button>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum pagamento registrado.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 financial-value">{formatCurrency(p.amount)}</p>
                <p className="text-xs text-gray-400">{formatDate(p.paid_at)}{p.note ? ` · ${p.note}` : ''}</p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-1 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar Pagamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={remaining > 0 ? remaining.toFixed(2) : ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data do pagamento</label>
            <input
              name="paid_at"
              type="date"
              required
              defaultValue={today}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
            <input
              name="note"
              placeholder="Ex: pagamento mínimo, integral..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
