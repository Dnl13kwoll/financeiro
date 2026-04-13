'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Pencil, Trash2 } from 'lucide-react'

type Account = {
  id: string
  name: string
  type: 'cash' | 'bank' | 'credit_card'
  limit_amount?: number | null
  closing_day?: number | null
  due_day?: number | null
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
    const payload: any = { name: data.get('name') as string }
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
