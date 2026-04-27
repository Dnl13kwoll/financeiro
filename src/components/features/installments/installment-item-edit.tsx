'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { Pencil } from 'lucide-react'

export function InstallmentItemEdit({
  itemId,
  amount,
  partNumber,
}: {
  itemId: string
  amount: number
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
    const newAmount = parseFloat(data.get('amount') as string)

    const supabase = createClient()
    const { error } = await supabase.from('installment_items')
      .update({ amount: newAmount })
      .eq('id', itemId)

    setLoading(false)
    if (error) {
      showToast('Erro ao salvar.', 'error')
    } else {
      showToast(`Parcela ${partNumber} atualizada!`)
      setOpen(false)
      startTransition(() => { router.refresh() })
    }
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100"
        title="Editar valor da parcela"
      >
        <Pencil className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Editar Parcela ${partNumber}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={amount}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
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
