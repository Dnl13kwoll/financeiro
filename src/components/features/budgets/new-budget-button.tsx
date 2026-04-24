'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'

type Category = { id: string; name: string }

export function NewBudgetButton({ coupleId, categories }: { coupleId: string; categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const now = new Date()
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const data = new FormData(form)

    const supabase = createClient()
    const threshold = data.get('alert_threshold') as string

    // Tenta com alert_threshold primeiro; se falhar (coluna não existe), tenta sem
    let result = await (supabase.from('budgets') as any).upsert({
      category_id: data.get('category_id') as string,
      couple_id: coupleId,
      amount: parseFloat(data.get('amount') as string),
      month: data.get('month') + '-01',
      alert_threshold: threshold ? parseInt(threshold) : 80,
    }, { onConflict: 'couple_id,category_id,month' })

    if (result.error?.message?.includes('alert_threshold')) {
      result = await (supabase.from('budgets') as any).upsert({
        category_id: data.get('category_id') as string,
        couple_id: coupleId,
        amount: parseFloat(data.get('amount') as string),
        month: data.get('month') + '-01',
      }, { onConflict: 'couple_id,category_id,month' })
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    setLoading(false)
    setOpen(false)
    form.reset()
    startTransition(() => { router.refresh() })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Definir Orçamento
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Definir Orçamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <input
              name="month"
              type="month"
              required
              defaultValue={currentMonth.slice(0, 7)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              name="category_id"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Selecione...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alertar a partir de (% do orçamento)</label>
            <input
              name="alert_threshold"
              type="number"
              min="1"
              max="100"
              defaultValue={80}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              Erro: {error}
            </div>
          )}
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
