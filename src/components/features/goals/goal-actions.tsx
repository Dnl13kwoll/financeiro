'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Plus, Pencil, Trash2, PlusCircle } from 'lucide-react'

type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string | null
}

export function NewGoalButton({ coupleId }: { coupleId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    const payload: any = {
      couple_id: coupleId,
      name: data.get('name') as string,
      target_amount: parseFloat(data.get('target_amount') as string),
      current_amount: parseFloat(data.get('current_amount') as string) || 0,
      deadline: (data.get('deadline') as string) || null,
    }
    await (supabase.from('goals') as any).insert(payload)
    setLoading(false)
    setOpen(false)
    form.reset()
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nova Meta
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Meta">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da meta</label>
            <input
              name="name"
              required
              placeholder="Ex: Viagem para a Europa, Reserva de emergência..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor alvo</label>
            <input
              name="target_amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor já guardado (opcional)</label>
            <input
              name="current_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (opcional)</label>
            <input
              name="deadline"
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export function GoalActions({ goal }: { goal: Goal }) {
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const value = parseFloat(data.get('value') as string)
    const supabase = createClient()
    await (supabase.from('goals') as any)
      .update({ current_amount: goal.current_amount + value })
      .eq('id', goal.id)
    setLoading(false)
    setAddOpen(false)
    form.reset()
    router.refresh()
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    await (supabase.from('goals') as any).update({
      name: data.get('name') as string,
      target_amount: parseFloat(data.get('target_amount') as string),
      deadline: (data.get('deadline') as string) || null,
    }).eq('id', goal.id)
    setLoading(false)
    setEditOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Excluir a meta "${goal.name}"?`)) return
    const supabase = createClient()
    await (supabase.from('goals') as any).delete().eq('id', goal.id)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setAddOpen(true)}
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
          title="Adicionar valor"
        >
          <PlusCircle className="w-4 h-4" />
        </button>
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Adicionar valor à meta">
        <form onSubmit={handleAdd} className="space-y-4">
          <p className="text-sm text-gray-500">Meta: <span className="font-medium text-gray-800">{goal.name}</span></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor a adicionar</label>
            <input
              name="value"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0,00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setAddOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Meta">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              name="name"
              required
              defaultValue={goal.name}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor alvo</label>
            <input
              name="target_amount"
              type="number"
              step="0.01"
              required
              defaultValue={goal.target_amount}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
            <input
              name="deadline"
              type="date"
              defaultValue={goal.deadline ?? ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setEditOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
