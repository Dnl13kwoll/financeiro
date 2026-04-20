'use client'
import { useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'

const CATEGORIES = [
  'Combustível', 'Mercado', 'Hortifruti', 'Padaria', 'Açougue',
  'Farmácia', 'Higiene', 'Limpeza', 'Vestuário', 'Eletrônicos', 'Outros',
]

export function NewPriceRecordButton({ coupleId, userId, itemSuggestions }: {
  coupleId: string
  userId: string
  itemSuggestions: string[]
}) {
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('')
  const [store, setStore] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const filtered = itemName.length > 1
    ? itemSuggestions.filter(s => s.toLowerCase().includes(itemName.toLowerCase())).slice(0, 5)
    : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!itemName.trim() || !price) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await (supabase.from('price_history') as any).insert({
      couple_id: coupleId,
      item_name: itemName.trim(),
      price: parseFloat(price),
      quantity: parseFloat(qty) || 1,
      unit: unit.trim() || null,
      store: store.trim() || null,
      category: category || null,
      recorded_at: date,
      created_by: userId,
    })
    setLoading(false)
    if (error) { showToast('Erro ao registrar preço', 'error'); return }
    setOpen(false)
    setItemName(''); setPrice(''); setQty('1'); setUnit(''); setStore(''); setCategory('')
    setDate(new Date().toISOString().slice(0, 10))
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" /> Registrar preço
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Registrar preço</h2>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <label className="text-xs text-gray-500 font-medium">Item *</label>
              <input
                autoFocus
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                placeholder="Ex: Gasolina, Arroz 5kg"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              {filtered.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-0.5">
                  {filtered.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setItemName(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Preço (R$) *</label>
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
                <label className="text-xs text-gray-500 font-medium">Qtd / unidade</label>
                <div className="flex gap-1 mt-1">
                  <input
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <input
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="L, kg"
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-medium">Estabelecimento</label>
              <input
                value={store}
                onChange={e => setStore(e.target.value)}
                placeholder="Ex: Carrefour, Posto BR"
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
                >
                  <option value="">Selecionar</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !itemName.trim() || !price}
              className="w-full bg-primary-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export function DeletePriceRecord({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  async function del() {
    if (!confirm('Excluir registro?')) return
    setLoading(true)
    await (createClient().from('price_history') as any).delete().eq('id', id)
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
