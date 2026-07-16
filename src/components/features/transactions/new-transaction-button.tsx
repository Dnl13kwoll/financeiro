'use client'
import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { ColorSelect } from '@/components/ui/color-select'
import { Plus, Bookmark } from 'lucide-react'
import { DescriptionWithSuggest } from './category-suggest'
import { TransactionTemplates, saveTransactionTemplate } from './transaction-templates'
import { TagsInput } from './tags-input'

type Account = { id: string; name: string; type?: string; color?: string | null }
type Category = { id: string; name: string; type: 'income' | 'expense'; color?: string | null }

export function NewTransactionButton({
  coupleId,
  userId,
  accounts,
  categories,
}: {
  coupleId: string
  userId: string
  accounts: Account[]
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [installments, setInstallments] = useState(1)
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTags, setFormTags] = useState<string[]>([])
  const [dupWarning, setDupWarning] = useState<{ description: string; amount: number; date: string } | null>(null)
  const skipDupCheck = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Keyboard shortcut: press 'n' to open new transaction
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'n' || e.key === 'N') {
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const filteredCategories = categories.filter(c =>
    type === 'transfer' ? false : c.type === type
  )

  function handleLoadTemplate(t: {
    type: string
    amount: number | null
    description: string | null
    category_id: string | null
    account_id: string | null
    tags: string[] | null
  }) {
    if (t.type === 'income' || t.type === 'expense' || t.type === 'transfer') setType(t.type)
    if (t.amount) setFormAmount(String(t.amount))
    if (t.description) setFormDescription(t.description)
    if (t.category_id) setSelectedCategoryId(t.category_id)
    if (t.account_id) setSelectedAccountId(t.account_id)
    if (t.tags?.length) setFormTags(t.tags)
  }

  async function handleSaveTemplate() {
    const name = window.prompt('Nome do template:')
    if (!name?.trim()) return
    const tags = formTags
    await saveTransactionTemplate(coupleId, userId, {
      name: name.trim(),
      type,
      amount: formAmount ? parseFloat(formAmount) : null,
      description: formDescription || null,
      category_id: selectedCategoryId || null,
      account_id: selectedAccountId || null,
      tags,
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)

    const supabase = createClient()
    const tags = formTags

    const n = installments
    const totalAmount = parseFloat(formAmount)
    if (isNaN(totalAmount) || totalAmount <= 0) {
      showToast('Informe um valor válido maior que zero.', 'error')
      setLoading(false)
      return
    }
    const baseDate = new Date((data.get('date') as string) + 'T12:00:00')
    const description = formDescription || null

    // Duplicate detection (only for single transactions, not installments)
    if (n === 1 && !skipDupCheck.current && type !== 'transfer') {
      const dateFrom = new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const dateTo = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const { data: dups } = await supabase.from('transactions')
        .select('id, description, amount, date')
        .eq('couple_id', coupleId)
        .eq('amount', totalAmount)
        .eq('type', type)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .is('deleted_at', null)
        .limit(1)
      if (dups && dups.length > 0) {
        setDupWarning({ description: dups[0].description ?? '', amount: dups[0].amount, date: dups[0].date })
        setLoading(false)
        return
      }
    }
    skipDupCheck.current = false

    if (n > 1 && type === 'expense') {
      const { data: installGroup, error: installError } = await supabase.from('installments').insert({
        description: description ?? '',
        total_amount: totalAmount,
        total_parts: n,
        couple_id: coupleId,
        user_id: userId,
        start_date: baseDate.toISOString().slice(0, 10),
      }).select('id').single()

      if (installError) {
        showToast('Erro ao criar parcelamento: ' + installError.message, 'error')
        setLoading(false)
        return
      }

      if (installGroup) {
        const items = Array.from({ length: n }, (_, i) => {
          const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate())
          return {
            installment_id: installGroup.id,
            part_number: i + 1,
            amount: parseFloat((totalAmount / n).toFixed(2)),
            due_date: dueDate.toISOString().slice(0, 10),
            paid: false,
          }
        })
        const { error: itemsError } = await supabase.from('installment_items').insert(items)
        if (itemsError) {
          showToast('Erro ao criar parcelas: ' + itemsError.message, 'error')
          setLoading(false)
          return
        }
      }
    } else {
      const payload: any = {
        type,
        amount: totalAmount,
        description,
        category_id: selectedCategoryId || null,
        account_id: selectedAccountId || (data.get('account_id') as string),
        to_account_id: type === 'transfer' ? toAccountId || null : null,
        date: baseDate.toISOString().slice(0, 10),
        competence_date: baseDate.toISOString().slice(0, 10),
        is_private: data.get('is_private') === 'on',
        tags: tags.length > 0 ? tags : [],
        user_id: userId,
        couple_id: coupleId,
        comment: (data.get('comment') as string) || null,
        receipt_url: (data.get('receipt_url') as string) || null,
      }
      const { error: txError } = await supabase.from('transactions').insert(payload)
      if (txError) {
        showToast('Erro ao salvar transação: ' + txError.message, 'error')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    setOpen(false)
    resetForm()
    showToast(n > 1 ? `Parcelamento em ${n}x criado!` : 'Transação salva!')
    startTransition(() => { router.refresh() })
  }

  function resetForm() {
    setType('expense')
    setSelectedCategoryId('')
    setSelectedAccountId('')
    setToAccountId('')
    setInstallments(1)
    setFormAmount('')
    setFormDescription('')
    setFormTags([])
    setDupWarning(null)
    skipDupCheck.current = false
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nova Transação
        <kbd className="hidden sm:inline-flex items-center text-[10px] px-1.5 py-0.5 bg-primary-700 group-hover:bg-primary-800 rounded font-mono leading-none transition-colors">
          N
        </kbd>
      </button>

      <Modal open={open} onClose={() => { setOpen(false); resetForm() }} title="Nova Transação">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Templates picker */}
          <div className="flex items-center justify-between">
            <TransactionTemplates coupleId={coupleId} userId={userId} onLoad={handleLoadTemplate} />
            <button
              type="button"
              onClick={handleSaveTemplate}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors"
              title="Salvar formulário atual como template"
            >
              <Bookmark className="w-3.5 h-3.5" />
              Salvar como template
            </button>
          </div>

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
              value={formAmount}
              onChange={e => setFormAmount(e.target.value)}
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <DescriptionWithSuggest
            coupleId={coupleId}
            categories={filteredCategories}
            type={type}
            onCategoryChange={(id) => setSelectedCategoryId(id)}
            value={formDescription}
            onChange={setFormDescription}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'transfer' ? 'Conta de origem' : 'Conta'}
            </label>
            <ColorSelect
              options={[
                { value: '', label: 'Selecione...' },
                ...accounts.map(a => ({ value: a.id, label: a.name, color: a.color })),
              ]}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
            />
          </div>

          {type === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta de destino</label>
              <ColorSelect
                options={[
                  { value: '', label: 'Selecione...' },
                  ...accounts.map(a => ({ value: a.id, label: a.name, color: a.color })),
                ]}
                value={toAccountId}
                onChange={setToAccountId}
              />
            </div>
          )}

          {type !== 'transfer' && filteredCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <ColorSelect
                options={[
                  { value: '', label: 'Sem categoria' },
                  ...filteredCategories.map(c => ({ value: c.id, label: c.name, color: c.color })),
                ]}
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
              />
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <TagsInput value={formTags} onChange={setFormTags} placeholder="viagem, casa, pet..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comentário</label>
            <input
              name="comment"
              placeholder="Observação opcional"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link do comprovante</label>
            <input
              name="receipt_url"
              type="url"
              placeholder="https://... (opcional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
              <select
                name="installments"
                value={installments}
                onChange={e => setInstallments(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n === 1 ? 'À vista' : `${n}x`}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input name="is_private" type="checkbox" className="rounded" />
            Transação privada (só você vê)
          </label>

          {dupWarning && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
              <p className="font-medium text-orange-800 mb-1">Possível duplicata detectada</p>
              <p className="text-orange-700 text-xs mb-2">
                Já existe uma transação de mesmo valor ({dupWarning.description ?? '—'}) em {new Date(dupWarning.date + 'T12:00:00').toLocaleDateString('pt-BR')}.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDupWarning(null)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => { skipDupCheck.current = true; setDupWarning(null); formRef.current?.requestSubmit() }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                >
                  Salvar mesmo assim
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setOpen(false); resetForm() }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !!dupWarning}
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
