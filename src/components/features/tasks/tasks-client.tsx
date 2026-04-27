'use client'
import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Pencil, Trash2, Circle, CircleDot, CheckCircle2, Calendar, User, AlertCircle, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

type Member = { id: string; name: string; email: string }

type Task = {
  id: string
  couple_id: string
  created_by: string
  assigned_to: string | null
  title: string
  description: string | null
  status: string
  priority: string
  due_date: string | null
  category: string | null
  tags: string[]
  completed_at: string | null
  created_at: string
}

const STATUS_CYCLE: Record<string, string> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

const STATUS_LABEL: Record<string, string> = { todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluída' }

const PRIORITY_LABEL: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }

const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}

const PRIORITY_FLAG: Record<string, string> = {
  low: 'text-gray-300',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-500',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle2 className="w-5 h-5 text-green-500" />
  if (status === 'in_progress') return <CircleDot className="w-5 h-5 text-blue-500" />
  return <Circle className="w-5 h-5 text-gray-300" />
}

function TaskFormFields({ members, defaultValues }: { members: Member[], defaultValues?: Partial<Task> }) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title ?? ''}
          placeholder="Ex: Pagar IPTU, Organizar documentos..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={defaultValues?.description ?? ''}
          placeholder="Detalhes adicionais..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
        <div className="grid grid-cols-4 gap-1.5">
          {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
            <label
              key={p}
              className="flex flex-col items-center gap-1 border border-gray-200 rounded-lg px-2 py-2 cursor-pointer has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 text-center"
            >
              <input
                type="radio"
                name="priority"
                value={p}
                defaultChecked={(defaultValues?.priority ?? 'medium') === p}
                className="sr-only"
              />
              <Flag className={cn('w-3.5 h-3.5', PRIORITY_FLAG[p])} />
              <span className="text-xs">{PRIORITY_LABEL[p]}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prazo (opcional)</label>
          <input
            name="due_date"
            type="date"
            defaultValue={defaultValues?.due_date ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
          <select
            name="assigned_to"
            defaultValue={defaultValues?.assigned_to ?? ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Sem responsável</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria (opcional)</label>
        <input
          name="category"
          defaultValue={defaultValues?.category ?? ''}
          placeholder="Ex: Casa, Financeiro, Saúde..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </>
  )
}

export function TasksClient({
  tasks: initialTasks,
  members,
  coupleId,
  userId,
}: {
  tasks: Task[]
  members: Member[]
  coupleId: string | null
  userId: string
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [filterAssigned, setFilterAssigned] = useState<string>('all')
  const [newOpen, setNewOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    let list = tasks
    if (filter !== 'all') list = list.filter(t => t.status === filter)
    if (filterAssigned !== 'all') list = list.filter(t => t.assigned_to === filterAssigned)
    return [...list].sort((a, b) => {
      const prioOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
      const pa = prioOrder[a.priority as keyof typeof prioOrder] ?? 2
      const pb = prioOrder[b.priority as keyof typeof prioOrder] ?? 2
      if (pa !== pb) return pa - pb
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [tasks, filter, filterAssigned])

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }), [tasks])

  async function handleStatusCycle(task: Task) {
    const next = STATUS_CYCLE[task.status] ?? 'todo'
    const completedAt = next === 'done' ? new Date().toISOString() : null
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next, completed_at: completedAt } : t))
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({
      status: next,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    }).eq('id', task.id)
    if (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t))
      showToast('Erro ao atualizar status.', 'error')
      return
    }
    startTransition(() => router.refresh())
  }

  async function handleNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coupleId) return
    setSavingNew(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const assignedTo = (data.get('assigned_to') as string) || null
    const dueDate = (data.get('due_date') as string) || null
    const category = (data.get('category') as string) || null
    const description = (data.get('description') as string) || null

    const payload = {
      couple_id: coupleId,
      created_by: userId,
      assigned_to: assignedTo,
      title: data.get('title') as string,
      description,
      priority: data.get('priority') as string,
      due_date: dueDate,
      category,
    }

    const supabase = createClient()
    const { data: inserted, error } = await supabase.from('tasks').insert(payload).select().single()
    setSavingNew(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    setTasks(prev => [inserted as Task, ...prev])
    setNewOpen(false)
    form.reset()
    showToast('Tarefa criada!')
    startTransition(() => router.refresh())
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTask) return
    setSavingEdit(true)
    const form = e.currentTarget
    const data = new FormData(form)
    const assignedTo = (data.get('assigned_to') as string) || null
    const dueDate = (data.get('due_date') as string) || null
    const category = (data.get('category') as string) || null
    const description = (data.get('description') as string) || null

    const updates = {
      title: data.get('title') as string,
      description,
      priority: data.get('priority') as string,
      assigned_to: assignedTo,
      due_date: dueDate,
      category,
      updated_at: new Date().toISOString(),
    }

    const supabase = createClient()
    const { error } = await supabase.from('tasks').update(updates).eq('id', editTask.id)
    setSavingEdit(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    setTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...updates } : t))
    setEditTask(null)
    showToast('Tarefa atualizada.')
    startTransition(() => router.refresh())
  }

  async function handleDelete(task: Task) {
    if (!await confirmDialog(`Excluir "${task.title}"?`)) return
    setTasks(prev => prev.filter(t => t.id !== task.id))
    const supabase = createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', task.id)
    if (error) {
      setTasks(prev => [task, ...prev])
      showToast('Erro ao excluir.', 'error')
      return
    }
    showToast('Tarefa excluída.')
    startTransition(() => router.refresh())
  }

  const today = new Date().toISOString().slice(0, 10)

  function getMemberName(id: string | null) {
    if (!id) return null
    return members.find(m => m.id === id)?.name ?? 'Usuário'
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'todo', 'in_progress', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {f === 'all' ? 'Todas' : STATUS_LABEL[f]}
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                filter === f ? 'bg-white/20 text-white' : 'bg-white text-gray-500'
              )}>
                {counts[f]}
              </span>
            </button>
          ))}

          {members.length > 1 && (
            <select
              value={filterAssigned}
              onChange={e => setFilterAssigned(e.target.value)}
              className="border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>

        {coupleId && (
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Summary bar for overdue */}
      {(() => {
        const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today)
        if (overdue.length === 0) return null
        return (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{overdue.length} tarefa{overdue.length !== 1 ? 's' : ''} em atraso</span>
          </div>
        )
      })()}

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map(task => {
          const isOverdue = task.status !== 'done' && task.due_date && task.due_date < today
          const memberName = getMemberName(task.assigned_to)

          return (
            <div
              key={task.id}
              className={cn(
                'bg-white rounded-xl border shadow-sm px-4 py-3 flex items-start gap-3 transition-opacity',
                task.status === 'done' ? 'opacity-60' : '',
                isOverdue ? 'border-red-200' : 'border-gray-100'
              )}
            >
              {/* Status toggle */}
              <button
                onClick={() => handleStatusCycle(task)}
                className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                title={`Mudar para: ${STATUS_LABEL[STATUS_CYCLE[task.status] ?? 'todo']}`}
              >
                <StatusIcon status={task.status} />
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium text-gray-900 leading-snug',
                  task.status === 'done' ? 'line-through text-gray-400' : ''
                )}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {task.due_date && (
                    <span className={cn(
                      'flex items-center gap-1 text-xs',
                      isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'
                    )}>
                      <Calendar className="w-3 h-3" />
                      {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      {isOverdue && ' · Atrasada'}
                    </span>
                  )}
                  {memberName && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <User className="w-3 h-3" />
                      {memberName}
                    </span>
                  )}
                  {task.category && (
                    <span className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{task.category}</span>
                  )}
                </div>
              </div>

              {/* Priority + actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLOR[task.priority])}>
                  {PRIORITY_LABEL[task.priority]}
                </span>
                <button
                  onClick={() => setEditTask(task)}
                  className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          {!coupleId
            ? 'Crie um casal em Configurações para começar.'
            : tasks.length === 0
            ? 'Nenhuma tarefa ainda. Crie a primeira!'
            : 'Nenhuma tarefa neste filtro.'}
        </div>
      )}

      {/* New task modal */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nova Tarefa">
        <form onSubmit={handleNew} className="space-y-4">
          <TaskFormFields members={members} />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setNewOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingNew}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {savingNew ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit task modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Editar Tarefa">
        {editTask && (
          <form onSubmit={handleEdit} className="space-y-4">
            <TaskFormFields members={members} defaultValues={editTask} />
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setEditTask(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {savingEdit ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
