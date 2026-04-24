'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { Plus, Pencil, Trash2, PlusCircle } from 'lucide-react'

type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline?: string | null
  account_id?: string | null
}

export function NewGoalButton({ coupleId, accounts = [] }: { coupleId: string; accounts?: { id: string; name: string }[] }) {
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
    const payload: any = {
      couple_id: coupleId,
      name: data.get('name') as string,
      target_amount: parseFloat(data.get('target_amount') as string),
      current_amount: parseFloat(data.get('current_amount') as string) || 0,
      deadline: (data.get('deadline') as string) || null,
      account_id: (data.get('account_id') as string) || null,
    }
    const result = await (supabase.from('goals') as any).insert(payload)
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
          {accounts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta vinculada (opcional)</label>
              <select
                name="account_id"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Sem conta</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              Erro: {error}
            </div>
          )}
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
  const [, startTransition] = useTransition()

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const value = parseFloat(data.get('value') as string)
    const note = (data.get('note') as string) || null
    const supabase = createClient()
    const [updateRes, histRes] = await Promise.all([
      (supabase.from('goals') as any).update({ current_amount: goal.current_amount + value }).eq('id', goal.id),
      (supabase.from('goal_history') as any).insert({ goal_id: goal.id, amount: value, note }),
    ])
    if (updateRes.error || histRes.error) {
      const msg = (updateRes.error || histRes.error).message
      showToast('Erro: ' + msg, 'error')
      setLoading(false)
      return
    }
    showToast('Valor adicionado à meta!')
    setLoading(false)
    setAddOpen(false)
    form.reset()
    startTransition(() => { router.refresh() })
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const supabase = createClient()
    const { error } = await (supabase.from('goals') as any).update({
      name: data.get('name') as string,
      target_amount: parseFloat(data.get('target_amount') as string),
      deadline: (data.get('deadline') as string) || null,
    }).eq('id', goal.id)
    if (error) {
      showToast('Erro: ' + error.message, 'error')
      setLoading(false)
      return
    }
    showToast('Meta atualizada!')
    setLoading(false)
    setEditOpen(false)
    startTransition(() => { router.refresh() })
  }

  async function handleDelete() {
    if (!confirm(`Excluir a meta "${goal.name}"?`)) return
    const supabase = createClient()
    const { error } = await (supabase.from('goals') as any).delete().eq('id', goal.id)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    showToast('Meta excluída.', 'error')
    startTransition(() => { router.refresh() })
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação (opcional)</label>
            <input
              name="note"
              placeholder="Ex: Salário de março..."
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
