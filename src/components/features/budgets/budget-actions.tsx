'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { Pencil, Trash2 } from 'lucide-react'

export function BudgetDeleteButton({ id }: { id: string }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleDelete() {
    if (!confirm('Excluir este orçamento?')) return
    const supabase = createClient()
    await (supabase.from('budgets') as any).delete().eq('id', id)
    startTransition(() => { router.refresh() })
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
      title="Excluir"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  )
}

export function BudgetEditButton({
  id,
  currentAmount,
  currentThreshold,
}: {
  id: string
  currentAmount: number
  currentThreshold: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const supabase = createClient()
    await (supabase.from('budgets') as any).update({
      amount: parseFloat(data.get('amount') as string),
      alert_threshold: parseInt(data.get('threshold') as string),
    }).eq('id', id)
    setLoading(false)
    setOpen(false)
    showToast('Orçamento atualizado!')
    startTransition(() => { router.refresh() })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
        title="Editar"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Editar Orçamento">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite orçado</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={currentAmount}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alertar ao atingir (%)
            </label>
            <input
              name="threshold"
              type="number"
              min="1"
              max="100"
              required
              defaultValue={currentThreshold}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">Ex: 80 para alertar quando 80% do orçamento for usado</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
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
