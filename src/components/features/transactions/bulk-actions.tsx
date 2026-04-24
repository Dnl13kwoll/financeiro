'use client'
import { useState, useEffect, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { Trash2, Tag, X, CheckCircle2 } from 'lucide-react'

type Category = { id: string; name: string; type: string }

export function BulkActionsBar({
  selectedIds,
  categories,
  onClearSelection,
}: {
  selectedIds: string[]
  categories: Category[]
  onClearSelection: () => void
}) {
  const [categorizingOpen, setCategorizingOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleBulkDelete() {
    if (!confirm(`Excluir ${selectedIds.length} transação(ões)?`)) return
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('transactions') as any)
      .update({ deleted_at: new Date().toISOString() })
      .in('id', selectedIds)
    setLoading(false)
    onClearSelection()
    showToast(`${selectedIds.length} transação(ões) excluída(s).`, 'error')
    startTransition(() => { router.refresh() })
  }

  async function handleBulkReconcile() {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('transactions') as any)
      .update({ reconciled: true })
      .in('id', selectedIds)
    setLoading(false)
    onClearSelection()
    showToast(`${selectedIds.length} transação(ões) conciliada(s)!`)
    startTransition(() => { router.refresh() })
  }

  async function handleBulkCategorize(categoryId: string) {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('transactions') as any)
      .update({ category_id: categoryId || null })
      .in('id', selectedIds)
    setLoading(false)
    setCategorizingOpen(false)
    onClearSelection()
    showToast(`Categoria aplicada em ${selectedIds.length} transação(ões)!`)
    startTransition(() => { router.refresh() })
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 text-sm animate-in slide-in-from-bottom-3 duration-200">
      <span className="font-medium">{selectedIds.length} selecionada(s)</span>
      <div className="w-px h-4 bg-gray-600" />

      <div className="relative">
        <button
          onClick={() => setCategorizingOpen(o => !o)}
          className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
          disabled={loading}
        >
          <Tag className="w-4 h-4" /> Categorizar
        </button>
        {categorizingOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 w-48 py-1 max-h-48 overflow-y-auto">
            <button
              onClick={() => handleBulkCategorize('')}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-400"
            >
              Sem categoria
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => handleBulkCategorize(c.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleBulkReconcile}
        disabled={loading}
        className="flex items-center gap-1.5 text-green-400 hover:text-green-300 transition-colors"
      >
        <CheckCircle2 className="w-4 h-4" /> Conciliar
      </button>

      <button
        onClick={handleBulkDelete}
        disabled={loading}
        className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors"
      >
        <Trash2 className="w-4 h-4" /> Excluir
      </button>

      <div className="w-px h-4 bg-gray-600" />
      <button onClick={onClearSelection} className="text-gray-400 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
