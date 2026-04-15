'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

type Category = { id: string; name: string; type: 'income' | 'expense'; sort_order?: number }

export function CategoryManager({ categories, coupleId }: { categories: Category[]; coupleId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    await (supabase.from('categories') as any).insert({
      name: data.get('name') as string,
      type: data.get('type') as string,
      couple_id: coupleId,
    })
    setLoading(false)
    form.reset()
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir categoria "${name}"?`)) return
    const supabase = createClient()
    await (supabase.from('categories') as any).delete().eq('id', id)
    router.refresh()
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const custom = categories.filter(c => (c as any).couple_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const idx = custom.findIndex(c => c.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === custom.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const supabase = createClient()
    const aOrder = custom[idx].sort_order ?? idx
    const bOrder = custom[swapIdx].sort_order ?? swapIdx
    await Promise.all([
      (supabase.from('categories') as any).update({ sort_order: bOrder }).eq('id', custom[idx].id),
      (supabase.from('categories') as any).update({ sort_order: aOrder }).eq('id', custom[swapIdx].id),
    ])
    router.refresh()
  }

  const custom = categories.filter(c => (c as any).couple_id).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const defaults = categories.filter(c => !(c as any).couple_id)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Categorias
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Gerenciar Categorias">
        <div className="space-y-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Nova categoria</p>
            <div className="flex gap-2">
              <input
                name="name"
                required
                placeholder="Nome da categoria"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                name="type"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="expense">Saída</option>
                <option value="income">Entrada</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {custom.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Personalizadas</p>
              <div className="space-y-1">
                {custom.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${c.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {c.type === 'expense' ? 'Saída' : 'Entrada'}
                      </span>
                      <span className="text-sm text-gray-700">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleReorder(c.id, 'up')} disabled={i === 0} className="p-1 text-gray-300 hover:text-gray-600 rounded disabled:opacity-20">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleReorder(c.id, 'down')} disabled={i === custom.length - 1} className="p-1 text-gray-300 hover:text-gray-600 rounded disabled:opacity-20">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Padrão</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {defaults.map(c => (
                <div key={c.id} className="flex items-center gap-2 py-1.5 px-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${c.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {c.type === 'expense' ? 'Saída' : 'Entrada'}
                  </span>
                  <span className="text-sm text-gray-500">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
