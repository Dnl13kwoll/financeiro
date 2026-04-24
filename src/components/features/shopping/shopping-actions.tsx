'use client'
import { useState, useRef } from 'react'
import { Plus, X, ShoppingCart, Trash2, Check, MoreVertical, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'

type BudgetCategory = { id: string; name: string; amount: number }

// ── New List ──────────────────────────────────────────────────────────────────
export function NewShoppingListButton({
  coupleId,
  userId,
  budgetCategories = [],
}: {
  coupleId: string
  userId: string
  budgetCategories?: BudgetCategory[]
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [budgetCategoryId, setBudgetCategoryId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleCategoryChange(id: string) {
    setBudgetCategoryId(id)
    if (id) {
      const cat = budgetCategories.find(c => c.id === id)
      if (cat) setBudget(String(cat.amount))
    } else {
      setBudget('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await (supabase.from('shopping_lists') as any).insert({
      couple_id: coupleId,
      name: name.trim() || 'Lista de compras',
      budget: budget ? parseFloat(budget) : null,
      budget_category_id: budgetCategoryId || null,
      created_by: userId,
    })
    setLoading(false)
    if (error) { showToast('Erro ao criar lista', 'error'); return }
    setOpen(false)
    setName('')
    setBudget('')
    setBudgetCategoryId('')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" /> Nova lista
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Nova lista de compras</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nome</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Mercado semana"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>

              {budgetCategories.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Vincular ao orçamento (opcional)</label>
                  <select
                    value={budgetCategoryId}
                    onChange={e => handleCategoryChange(e.target.value)}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  >
                    <option value="">Sem vínculo</option>
                    {budgetCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-500 font-medium">
                  {budgetCategoryId ? 'Limite do orçamento' : 'Orçamento manual (opcional)'}
                </label>
                <input
                  type="number"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  placeholder="R$ 0,00"
                  min="0"
                  step="0.01"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Criando...' : 'Criar lista'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}

// ── Add Item ──────────────────────────────────────────────────────────────────
export function AddShoppingItemButton({ listId, userId }: { listId: string; userId: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await (supabase.from('shopping_items') as any).insert({
      list_id: listId,
      name: name.trim(),
      quantity: parseFloat(qty) || 1,
      unit: unit.trim() || null,
      estimated_price: price ? parseFloat(price) : null,
      category: category.trim() || null,
      added_by: userId,
    })
    setLoading(false)
    if (error) { showToast('Erro ao adicionar item', 'error'); return }
    setOpen(false)
    setName(''); setQty('1'); setUnit(''); setPrice(''); setCategory('')
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-100 transition-colors font-medium"
      >
        <Plus className="w-3.5 h-3.5" /> Adicionar item
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Adicionar item</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Item *</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Arroz 5kg"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Quantidade</label>
                <input
                  type="number"
                  value={qty}
                  onChange={e => setQty(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Unidade</label>
                <input
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="kg, un, L"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Preço estimado (R$)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0,00"
                min="0"
                step="0.01"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium">Categoria</label>
              <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ex: Hortifruti, Limpeza"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}

// ── Check / uncheck item ──────────────────────────────────────────────────────
export function CheckShoppingItem({ id, checked, actualPrice }: { id: string; checked: boolean; actualPrice: number | null }) {
  const [loading, setLoading] = useState(false)
  const [showPrice, setShowPrice] = useState(false)
  const [price, setPrice] = useState(actualPrice?.toString() ?? '')
  const router = useRouter()

  async function toggle() {
    if (!checked && !showPrice) { setShowPrice(true); return }
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('shopping_items') as any).update({
      checked: !checked,
      actual_price: price ? parseFloat(price) : null,
    }).eq('id', id)
    setLoading(false)
    setShowPrice(false)
    router.refresh()
  }

  async function uncheck() {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('shopping_items') as any).update({ checked: false }).eq('id', id)
    setLoading(false)
    router.refresh()
  }

  if (checked) {
    return (
      <button onClick={uncheck} disabled={loading}
        className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 hover:bg-green-600 transition-colors">
        <Check className="w-3.5 h-3.5 text-white" />
      </button>
    )
  }

  if (showPrice) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          value={price}
          onChange={e => setPrice(e.target.value)}
          placeholder="R$"
          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary-300"
          onKeyDown={e => { if (e.key === 'Enter') toggle(); if (e.key === 'Escape') setShowPrice(false) }}
        />
        <button onClick={toggle} disabled={loading}
          className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors">
          <Check className="w-3.5 h-3.5 text-white" />
        </button>
        <button onClick={() => setShowPrice(false)}
          className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
          <X className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    )
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 hover:border-primary-400 transition-colors" />
  )
}

// ── Delete item ───────────────────────────────────────────────────────────────
export function DeleteShoppingItem({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function del() {
    if (!confirm('Remover item?')) return
    setLoading(true)
    await (createClient().from('shopping_items') as any).delete().eq('id', id)
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={del} disabled={loading}
      className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}

// ── Delete list ───────────────────────────────────────────────────────────────
export function DeleteShoppingList({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function del() {
    if (!confirm('Excluir lista e todos os itens?')) return
    setLoading(true)
    await (createClient().from('shopping_lists') as any).delete().eq('id', id)
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={del} disabled={loading}
      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
      <Trash2 className="w-3 h-3" /> Excluir lista
    </button>
  )
}

// ── Complete list ─────────────────────────────────────────────────────────────
export function CompleteShoppingList({ id, completed }: { id: string; completed: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function toggle() {
    setLoading(true)
    await (createClient().from('shopping_lists') as any).update({ completed: !completed }).eq('id', id)
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${completed ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}`}>
      <Check className="w-3 h-3" />
      {completed ? 'Reabrir' : 'Finalizar'}
    </button>
  )
}
