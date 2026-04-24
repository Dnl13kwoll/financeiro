'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { Plus } from 'lucide-react'

type Account = { id: string; name: string }
type Category = { id: string; name: string }

export function NewInstallmentButton({ coupleId, userId, accounts = [], categories = [] }: { coupleId: string; userId: string; accounts?: Account[]; categories?: Category[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)

    const totalAmount = parseFloat(data.get('total_amount') as string)
    const totalParts = parseInt(data.get('total_parts') as string)
    const interestRate = parseFloat(data.get('interest_rate') as string) / 100 || 0
    const startDate = new Date(data.get('start_date') as string)

    const partAmount = parseFloat(((totalAmount * (1 + interestRate)) / totalParts).toFixed(2))

    const supabase = createClient()
    const accountId = (data.get('account_id') as string) || null
    const categoryId = (data.get('category_id') as string) || null
    const installmentPayload: any = {
      category_id: categoryId,
      description: data.get('description') as string,
      total_amount: totalAmount,
      total_parts: totalParts,
      interest_rate: interestRate,
      start_date: (data.get('start_date') as string),
      account_id: accountId,
      user_id: userId,
      couple_id: coupleId,
    }
    const { data: installment, error: installError } = await supabase
      .from('installments')
      .insert(installmentPayload)
      .select()
      .single()

    if (installError) {
      showToast('Erro ao criar parcelamento: ' + installError.message, 'error')
      setLoading(false)
      return
    }

    if (installment) {
      const items: any[] = Array.from({ length: totalParts }, (_, i) => {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        return {
          installment_id: (installment as any).id,
          part_number: i + 1,
          amount: partAmount,
          due_date: dueDate.toISOString().slice(0, 10),
        }
      })
      const { error: itemsError } = await (supabase.from('installment_items') as any).insert(items)
      if (itemsError) {
        showToast('Parcelamento criado, mas erro nas parcelas: ' + itemsError.message, 'error')
        setLoading(false)
        return
      }
    }

    showToast(`Parcelamento criado com ${totalParts} parcelas!`)
    setLoading(false)
    setOpen(false)
    form.reset()
    startTransition(() => { router.refresh() })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Parcelamento
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Parcelamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              name="description"
              required
              placeholder="Ex: Notebook, TV..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor total</label>
            <input
              name="total_amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº de parcelas</label>
              <input
                name="total_parts"
                type="number"
                min="1"
                required
                placeholder="Ex: 12"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Juros % (opcional)</label>
              <input
                name="interest_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                name="category_id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {accounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta vinculada (para débito automático)</label>
              <select
                name="account_id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem conta vinculada</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data da 1ª parcela</label>
            <input
              name="start_date"
              type="date"
              required
              defaultValue={today}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
