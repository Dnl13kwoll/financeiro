'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus } from 'lucide-react'

export function NewAccountButton({ coupleId, userId }: { coupleId: string; userId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<'cash' | 'bank' | 'credit_card'>('bank')
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)

    const supabase = createClient()
    const payload: any = {
      name: data.get('name') as string,
      type,
      initial_balance: parseFloat(data.get('initial_balance') as string) || 0,
      limit_amount: type === 'credit_card' ? parseFloat(data.get('limit_amount') as string) || null : null,
      closing_day: type === 'credit_card' ? parseInt(data.get('closing_day') as string) || null : null,
      due_day: type === 'credit_card' ? parseInt(data.get('due_day') as string) || null : null,
      color: (data.get('color') as string) || null,
      notes: (data.get('notes') as string) || null,
      min_balance_alert: data.get('min_balance_alert') ? parseFloat(data.get('min_balance_alert') as string) : null,
      user_id: userId,
      couple_id: coupleId,
    }
    await (supabase.from('accounts') as any).insert(payload)

    setLoading(false)
    setOpen(false)
    form.reset()
    setType('bank')
    startTransition(() => { router.refresh() })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nova Conta
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Conta">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              name="name"
              required
              placeholder="Ex: Nubank, Carteira..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="bank">Conta Bancária</option>
              <option value="cash">Dinheiro</option>
              <option value="credit_card">Cartão de Crédito</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'credit_card' ? 'Saldo inicial da fatura' : 'Saldo inicial'}
            </label>
            <input
              name="initial_balance"
              type="number"
              step="0.01"
              defaultValue="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {type === 'credit_card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
                <input
                  name="limit_amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia de fechamento</label>
                  <input
                    name="closing_day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 20"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia de vencimento</label>
                  <input
                    name="due_day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="Ex: 5"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Color + notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cor de identificação</label>
              <div className="flex items-center gap-2">
                <input
                  name="color"
                  type="color"
                  defaultValue="#6366f1"
                  className="h-9 w-14 border border-gray-300 rounded-lg cursor-pointer"
                />
                <span className="text-xs text-gray-400">opcional</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alerta de saldo mínimo</label>
              <input
                name="min_balance_alert"
                type="number"
                step="0.01"
                min="0"
                placeholder="ex: 100,00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <input
              name="notes"
              placeholder="Ex: conta salário, reserva de emergência..."
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
