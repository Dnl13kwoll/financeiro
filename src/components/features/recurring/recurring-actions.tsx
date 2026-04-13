'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Pencil, Trash2 } from 'lucide-react'

type Recurring = { id: string; name: string; day_due: number }

export function RecurringActions({ recurring }: { recurring: Recurring }) {
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    await (supabase.from('recurring_accounts') as any).update({
      name: data.get('name') as string,
      day_due: parseInt(data.get('day_due') as string),
    }).eq('id', recurring.id)
    setLoading(false)
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${recurring.name}"?`)) return
    const supabase = createClient()
    await (supabase.from('recurring_accounts') as any)
      .update({ active: false })
      .eq('id', recurring.id)
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

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Recorrente">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              name="name"
              required
              defaultValue={recurring.name}
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
              defaultValue={recurring.day_due}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
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
