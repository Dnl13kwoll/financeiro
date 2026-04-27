'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Pencil, Trash2 } from 'lucide-react'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { showToast } from '@/components/ui/toast'

type Account = { id: string; name: string }
type Category = { id: string; name: string }
type Recurring = {
  id: string
  name: string
  day_due: number
  amount?: number | null
  account_id?: string | null
  category_id?: string | null
  type?: string | null
}

export function RecurringActions({
  recurring,
  accounts = [],
  categories = [],
}: {
  recurring: Recurring
  accounts?: Account[]
  categories?: Category[]
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    const amountRaw = data.get('amount') as string
    const categoryId = (data.get('category_id') as string) || null
    const accountId = (data.get('account_id') as string) || null
    const { error } = await supabase.from('recurring_accounts').update({
      name: data.get('name') as string,
      day_due: parseInt(data.get('day_due') as string),
      amount: amountRaw ? parseFloat(amountRaw) : null,
      category_id: categoryId,
      account_id: accountId,
      type: data.get('type') as string,
    }).eq('id', recurring.id)
    setLoading(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Recorrente atualizada.')
    setEditOpen(false)
    startTransition(() => { router.refresh() })
  }

  async function handleDelete() {
    if (!await confirmDialog(`Excluir "${recurring.name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('recurring_accounts')
      .update({ active: false })
      .eq('id', recurring.id)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Recorrente removida.')
    startTransition(() => { router.refresh() })
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditOpen(true)}
          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Recorrente">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {(['expense', 'income'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                  <input type="radio" name="type" value={t} defaultChecked={(recurring.type ?? 'expense') === t} className="accent-primary-600" />
                  <span className="text-sm">{t === 'expense' ? 'Despesa' : 'Receita'}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              name="name"
              required
              defaultValue={recurring.name}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              defaultValue={recurring.day_due}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor mensal padrão (opcional)</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue={recurring.amount ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (opcional)</label>
              <select
                name="category_id"
                defaultValue={recurring.category_id ?? ''}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta padrão (opcional)</label>
              <select
                name="account_id"
                defaultValue={recurring.account_id ?? ''}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem conta específica</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
