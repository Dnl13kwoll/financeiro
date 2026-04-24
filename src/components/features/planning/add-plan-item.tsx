'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus } from 'lucide-react'

type Category = { id: string; name: string }

export function AddPlanItem({
  coupleId,
  month,
  categories,
}: {
  coupleId: string
  month: string
  categories: Category[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    const categoryId = (data.get('category_id') as string) || null
    const label = categoryId
      ? (categories.find((c) => c.id === categoryId)?.name ?? (data.get('label') as string))
      : (data.get('label') as string)
    await (supabase.from('monthly_plans') as any).upsert({
      couple_id: coupleId,
      month,
      category_id: categoryId,
      label,
      planned_amount: parseFloat(data.get('planned_amount') as string) || 0,
    }, { onConflict: 'couple_id,month,label' })
    setLoading(false)
    setOpen(false)
    form.reset()
    startTransition(() => { router.refresh() })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 px-3 py-2 rounded-lg hover:bg-primary-50 transition-colors"
      >
        <Plus className="w-4 h-4" /> Adicionar linha
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3 bg-gray-50 rounded-lg mt-2">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Categoria</label>
        <select
          name="category_id"
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">— Personalizado —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Nome (se personalizado)</label>
        <input
          name="label"
          placeholder="Ex: Lazer"
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div className="w-28">
        <label className="block text-xs text-gray-500 mb-1">Valor planejado</label>
        <input
          name="planned_amount"
          type="number"
          step="0.01"
          required
          placeholder="0,00"
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? '...' : 'Adicionar'}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800"
      >
        Cancelar
      </button>
    </form>
  )
}
