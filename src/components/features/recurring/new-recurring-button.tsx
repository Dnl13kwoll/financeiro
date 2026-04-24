'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'

type Category = { id: string; name: string }

export function NewRecurringButton({
  coupleId,
  userId,
  categories = [],
}: {
  coupleId: string
  userId: string
  categories?: Category[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = e.currentTarget
    const data = new FormData(form)

    const supabase = createClient()
    const amountRaw = data.get('amount') as string
    const categoryId = (data.get('category_id') as string) || null
    const endDate = (data.get('end_date') as string) || null
    const payload: any = {
      name: data.get('name') as string,
      day_due: parseInt(data.get('day_due') as string),
      amount: amountRaw ? parseFloat(amountRaw) : null,
      category_id: categoryId,
      end_date: endDate,
      user_id: userId,
      couple_id: coupleId,
    }
    const result = await (supabase.from('recurring_accounts') as any).insert(payload)

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
        Nova Recorrente
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Conta Recorrente">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Netflix, Aluguel, Luz..."
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
              placeholder="Ex: 10"
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (opcional)</label>
              <select
                name="category_id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de encerramento (opcional)</label>
            <input
              name="end_date"
              type="date"
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
