'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Pencil, Trash2 } from 'lucide-react'

const ACCOUNT_COLORS = [
  { value: '#6366f1', label: 'Índigo' },
  { value: '#0ea5e9', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#6b7280', label: 'Cinza' },
]

type Account = {
  id: string
  name: string
  type: 'cash' | 'bank' | 'credit_card'
  limit_amount?: number | null
  closing_day?: number | null
  due_day?: number | null
  min_balance_alert?: number | null
  color?: string | null
  notes?: string | null
}

export function AccountActions({ account }: { account: Account }) {
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    const minAlert = data.get('min_balance_alert') as string
    const payload: any = {
      name: data.get('name') as string,
      min_balance_alert: minAlert ? parseFloat(minAlert) : null,
      color: (data.get('color') as string) || null,
      notes: (data.get('notes') as string) || null,
    }
    if (account.type === 'credit_card') {
      payload.limit_amount = parseFloat(data.get('limit_amount') as string) || null
      payload.closing_day = parseInt(data.get('closing_day') as string) || null
      payload.due_day = parseInt(data.get('due_day') as string) || null
    }
    await (supabase.from('accounts') as any).update(payload).eq('id', account.id)
    setLoading(false)
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Excluir a conta "${account.name}"?`)) return
    const supabase = createClient()
    await (supabase.from('accounts') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', account.id)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditOpen(true)}
          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Conta">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              name="name"
              required
              defaultValue={account.name}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {account.type === 'credit_card' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Limite</label>
                <input
                  name="limit_amount"
                  type="number"
                  step="0.01"
                  defaultValue={account.limit_amount ?? ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia fechamento</label>
                  <input
                    name="closing_day"
                    type="number"
                    min="1"
                    max="31"
                    defaultValue={account.closing_day ?? ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia vencimento</label>
                  <input
                    name="due_day"
                    type="number"
                    min="1"
                    max="31"
                    defaultValue={account.due_day ?? ''}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </>
          )}

          {account.type !== 'credit_card' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alertar saldo abaixo de (opcional)</label>
              <input
                name="min_balance_alert"
                type="number"
                step="0.01"
                min="0"
                defaultValue={account.min_balance_alert ?? ''}
                placeholder="Ex: 500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <input
              name="notes"
              defaultValue={account.notes ?? ''}
              placeholder="Observações sobre a conta (opcional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor da conta</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ACCOUNT_COLORS.map(c => (
                <label key={c.value} className="cursor-pointer">
                  <input type="radio" name="color" value={c.value} defaultChecked={account.color === c.value} className="sr-only" />
                  <span
                    className="block w-7 h-7 rounded-full border-2 border-transparent hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value, outline: account.color === c.value ? `2px solid ${c.value}` : 'none', outlineOffset: '2px' }}
                    title={c.label}
                  />
                </label>
              ))}
              <label className="cursor-pointer">
                <input type="radio" name="color" value="" defaultChecked={!account.color} className="sr-only" />
                <span className="block w-7 h-7 rounded-full border-2 border-gray-300 bg-white hover:scale-110 transition-transform text-gray-400 flex items-center justify-center text-xs" title="Padrão">✕</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
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
