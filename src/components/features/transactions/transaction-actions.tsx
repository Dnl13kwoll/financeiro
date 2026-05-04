'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { ColorSelect } from '@/components/ui/color-select'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { TransactionSplitToggle } from '@/components/features/transactions/transaction-split-toggle'
import { ConvertToRecurring } from '@/components/features/transactions/convert-to-recurring'

type Account = { id: string; name: string; color?: string | null }
type Category = { id: string; name: string; type: 'income' | 'expense'; color?: string | null }

type Transaction = {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description?: string | null
  category_id?: string | null
  account_id: string
  date: string
  is_private: boolean
  tags?: string[]
  comment?: string | null
  split_id?: string | null
}

export function TransactionActions({
  transaction,
  accounts,
  categories,
  coupleId,
  userId,
}: {
  transaction: Transaction
  accounts: Account[]
  categories: Category[]
  coupleId?: string
  userId?: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteTimer, setDeleteTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [editAccountId, setEditAccountId] = useState(transaction.account_id)
  const [editCategoryId, setEditCategoryId] = useState(transaction.category_id ?? '')
  const router = useRouter()
  const [, startTransition] = useTransition()

  const filteredCategories = categories.filter(c =>
    transaction.type === 'transfer' ? false : c.type === transaction.type
  )

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    const rawTags = (data.get('tags') as string) ?? ''
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean)
    await supabase.from('transactions').update({
      comment: (data.get('comment') as string) || null,
      receipt_url: (data.get('receipt_url') as string) || null,
      amount: parseFloat(data.get('amount') as string),
      description: (data.get('description') as string) || null,
      category_id: editCategoryId || null,
      account_id: editAccountId,
      date: data.get('date') as string,
      competence_date: data.get('date') as string,
      is_private: data.get('is_private') === 'on',
      tags: tags,
    }).eq('id', transaction.id)
    setLoading(false)
    setEditOpen(false)
    showToast('Transação atualizada!')
    startTransition(() => { router.refresh() })
  }

  async function handleDuplicate() {
    setDuplicating(true)
    const supabase = createClient()
    const today = new Date().toISOString().slice(0, 10)
    // Fetch full transaction to get couple_id, user_id
    const { data: original } = await supabase.from('transactions')
      .select('*')
      .eq('id', transaction.id)
      .single()
    if (original) {
      const { id: _id, created_at: _c, updated_at: _u, deleted_at: _d, ...rest } = original
      await supabase.from('transactions').insert({
        ...rest,
        date: today,
        competence_date: today,
      })
    }
    setDuplicating(false)
    showToast('Transação duplicada!')
    startTransition(() => { router.refresh() })
  }

  function handleDelete() {
    // Optimistic: show undo toast, commit after 4 s unless cancelled
    const timer = setTimeout(async () => {
      const supabase = createClient()
      await supabase.from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', transaction.id)
      startTransition(() => { router.refresh() })
    }, 4000)
    setDeleteTimer(timer)
    showToast('Transação excluída. Desfazer?', 'error', () => {
      clearTimeout(timer)
      setDeleteTimer(null)
    })
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
          onClick={handleDuplicate}
          disabled={duplicating}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-40"
          title="Duplicar"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        {transaction.type === 'expense' && (
          <TransactionSplitToggle
            transactionId={transaction.id}
            amount={transaction.amount}
            hasSplit={!!transaction.split_id}
          />
        )}
        {transaction.type === 'expense' && coupleId && userId && (
          <ConvertToRecurring
            transaction={transaction}
            coupleId={coupleId}
            userId={userId}
          />
        )}
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Transação">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={transaction.amount}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              name="description"
              defaultValue={transaction.description ?? ''}
              placeholder="Opcional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
            <ColorSelect
              options={accounts.map(a => ({ value: a.id, label: a.name, color: a.color }))}
              value={editAccountId}
              onChange={setEditAccountId}
            />
          </div>

          {filteredCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <ColorSelect
                options={[
                  { value: '', label: 'Sem categoria' },
                  ...filteredCategories.map(c => ({ value: c.id, label: c.name, color: c.color })),
                ]}
                value={editCategoryId}
                onChange={setEditCategoryId}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={transaction.date}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input
              name="tags"
              defaultValue={(transaction.tags ?? []).join(', ')}
              placeholder="viagem, casa, pet (separadas por vírgula)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentário (visível para o casal)</label>
            <input
              name="comment"
              defaultValue={transaction.comment ?? ''}
              placeholder="Ex: era presente, dividido com amigos..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link do comprovante</label>
            <input
              name="receipt_url"
              type="url"
              defaultValue={(transaction as any).receipt_url ?? ''}
              placeholder="https://... (link de foto ou PDF)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input name="is_private" type="checkbox" defaultChecked={transaction.is_private} className="rounded" />
            Transação privada
          </label>

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
