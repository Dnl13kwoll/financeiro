'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { CalendarDays } from 'lucide-react'

export function InstallmentItemReschedule({
  itemId,
  dueDate,
  partNumber,
}: {
  itemId: string
  dueDate: string
  partNumber: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const data = new FormData(e.currentTarget)
    const newDate = data.get('due_date') as string

    const supabase = createClient()
    const { error } = await (supabase.from('installment_items') as any)
      .update({ due_date: newDate })
      .eq('id', itemId)

    setLoading(false)
    if (error) {
      showToast('Erro ao reagendar.', 'error')
    } else {
      showToast(`Parcela ${partNumber} reagendada!`)
      setOpen(false)
      startTransition(() => { router.refresh() })
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
        title="Reagendar vencimento"
      >
        <CalendarDays className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Reagendar Parcela ${partNumber}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova data de vencimento</label>
            <input
              name="due_date"
              type="date"
              required
              defaultValue={dueDate}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Reagendar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
