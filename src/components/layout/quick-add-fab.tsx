'use client'

import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { Plus } from 'lucide-react'
import { DescriptionWithSuggest } from '@/components/features/transactions/category-suggest'

type Account = { id: string; name: string }
type Category = { id: string; name: string; type: 'income' | 'expense' }

export function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [coupleId, setCoupleId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleOpen() {
    setOpen(true)
    if (accounts.length > 0) return
    setFetching(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setFetching(false); return }
    setUserId(user.id)

    const memberRes = await supabase
      .from('couple_members')
      .select('couple_id')
      .eq('user_id', user.id)
      .single()
    const cid = (memberRes.data as any)?.couple_id ?? null
    setCoupleId(cid)

    if (cid) {
      const [accRes, catRes] = await Promise.all([
        supabase.from('accounts').select('id, name').eq('couple_id', cid).is('deleted_at', null),
        supabase.from('categories').select('id, name, type').order('name'),
      ])
      setAccounts((accRes.data ?? []) as Account[])
      setCategories((catRes.data ?? []) as Category[])
    }
    setFetching(false)
  }

  const filteredCategories = categories.filter(c =>
    type === 'transfer' ? false : c.type === type
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coupleId || !userId) return
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const rawTags = (data.get('tags') as string) ?? ''
    const tags = rawTags.split(',').map(t => t.trim()).filter(Boolean)

    const supabase = createClient()
    await (supabase.from('transactions') as any).insert({
      type,
      amount: parseFloat(data.get('amount') as string),
      description: (data.get('description') as string) || null,
      category_id: (data.get('category_id') as string) || null,
      account_id: data.get('account_id') as string,
      to_account_id: type === 'transfer' ? (data.get('to_account_id') as string) || null : null,
      date: data.get('date') as string,
      competence_date: data.get('date') as string,
      is_private: data.get('is_private') === 'on',
      tags,
      user_id: userId,
      couple_id: coupleId,
    })
    setLoading(false)
    setOpen(false)
    form.reset()
    setType('expense')
    setSelectedCategoryId('')
    showToast('Transação salva!')
    startTransition(() => { router.refresh() })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 active:scale-95 transition-all flex items-center justify-center"
        title="Nova transação rápida"
        aria-label="Nova transação"
      >
        <Plus className="w-6 h-6" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Transação">
        {fetching ? (
          <div className="py-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : !coupleId ? (
          <div className="py-8 text-center text-gray-400 text-sm">
            Crie um casal em Configurações para lançar transações.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <div className="grid grid-cols-3 gap-2">
                {(['expense', 'income', 'transfer'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 text-sm rounded-lg border transition-colors ${
                      type === t
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-300 text-gray-600 hover:border-primary-400'
                    }`}
                  >
                    {t === 'expense' ? 'Saída' : t === 'income' ? 'Entrada' : 'Transferência'}
                  </button>
                ))}
              </div>
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
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <DescriptionWithSuggest
              coupleId={coupleId}
              categories={filteredCategories}
              type={type}
              onCategoryChange={(id) => setSelectedCategoryId(id)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'transfer' ? 'Conta de origem' : 'Conta'}
              </label>
              <select
                name="account_id"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta de destino</label>
                <select
                  name="to_account_id"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Selecione...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}

            {type !== 'transfer' && filteredCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  name="category_id"
                  value={selectedCategoryId}
                  onChange={e => setSelectedCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Sem categoria</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <input
                name="tags"
                placeholder="viagem, casa, pet (separadas por vírgula)"
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

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input name="is_private" type="checkbox" className="rounded" />
              Transação privada (só você vê)
            </label>

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
        )}
      </Modal>
    </>
  )
}
