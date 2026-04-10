'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'

export function NewInstallmentButton({ coupleId, userId }: { coupleId: string; userId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)

    const totalAmount = parseFloat(data.get('total_amount') as string)
    const totalParts = parseInt(data.get('total_parts') as string)
    const interestRate = parseFloat(data.get('interest_rate') as string) / 100 || 0
    const startDate = new Date(data.get('start_date') as string)

    const partAmount = parseFloat(((totalAmount * (1 + interestRate)) / totalParts).toFixed(2))

    const supabase = createClient()
    const installmentPayload: any = {
      description: data.get('description') as string,
      total_amount: totalAmount,
      total_parts: totalParts,
      interest_rate: interestRate,
      start_date: (data.get('start_date') as string),
      user_id: userId,
      couple_id: coupleId,
    }
    const { data: installment } = await supabase
      .from('installments')
      .insert(installmentPayload)
      .select()
      .single()

    if (installment) {
      const items: any[] = Array.from({ length: totalParts }, (_, i) => {
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + i)
        return {
          installment_id: (installment as any).id,
          part_number: i + 1,
          amount: partAmount,
          due_date: dueDate.toISOString().slice(0, 10),
        }
      })
      await (supabase.from('installment_items') as any).insert(items)
    }

    setLoading(false)
    setOpen(false)
    form.reset()
    router.refresh()
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo Parcelamento
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Parcelamento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              name="description"
              required
              placeholder="Ex: Notebook, TV..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor total</label>
            <input
              name="total_amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº de parcelas</label>
              <input
                name="total_parts"
                type="number"
                min="1"
                required
                placeholder="Ex: 12"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Juros % (opcional)</label>
              <input
                name="interest_rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data da 1ª parcela</label>
            <input
              name="start_date"
              type="date"
              required
              defaultValue={today}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

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
