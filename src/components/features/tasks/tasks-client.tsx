'use client'
import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import {
  Plus, Pencil, Trash2, Circle, CircleDot, CheckCircle2,
  Calendar, User, Flag, Search, ChevronDown, ChevronRight, X,
} from 'lucide-react'
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

const STATUS_NEXT: Record<string, string> = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
const STATUS_LABEL: Record<string, string> = { todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluída' }
const STATUS_BADGE: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
  in_progress: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  done: 'bg-green-100 text-green-700 hover:bg-green-200',
}

const PRIORITY_LABEL: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' }
const PRIORITY_COLOR: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500',
  medium: 'bg-blue-50 text-blue-600',
  high: 'bg-orange-50 text-orange-600',
  urgent: 'bg-red-50 text-red-600',
}
const PRIORITY_BAR: Record<string, string> = {
  low: 'bg-gray-200',
  medium: 'bg-blue-300',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
}
const PRIORITY_FLAG: Record<string, string> = {
  low: 'text-gray-300',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  urgent: 'text-red-500',
}

// ── Status badge (clickable, cycles status) ───────────────────────────────────
function StatusBadge({ status, onClick }: { status: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors shrink-0',
        STATUS_BADGE[status] ?? STATUS_BADGE.todo
      )}
      title={`Avançar para: ${STATUS_LABEL[STATUS_NEXT[status] ?? 'todo']}`}
    >
      {status === 'done'
        ? <CheckCircle2 className="w-3 h-3" />
        : status === 'in_progress'
        ? <CircleDot className="w-3 h-3" />
        : <Circle className="w-3 h-3" />}
      <span className="hidden sm:inline">{STATUS_LABEL[status] ?? status}</span>
      <ChevronRight className="w-3 h-3 opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
    </button>
  )
}

// ── Form fields (shared by new + edit modals) ─────────────────────────────────
function TaskFormFields({ members, defaultValues }: { members: Member[]; defaultValues?: Partial<Task> }) {
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
              <input type="radio" name="priority" value={p} defaultChecked={(defaultValues?.priority ?? 'medium') === p} className="sr-only" />
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
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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

// ── Task card ─────────────────────────────────────────────────────────────────
type CardHandlers = {
  today: string
  members: Member[]
  onStatusCycle: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function TaskCard({ task, today, members, onStatusCycle, onEdit, onDelete }: { task: Task } & CardHandlers) {
  const isOverdue = task.status !== 'done' && !!task.due_date && task.due_date < today
  const memberName = members.find(m => m.id === task.assigned_to)?.name ?? null

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm flex items-stretch overflow-hidden',
      task.status === 'done' ? 'opacity-60' : '',
      isOverdue ? 'border-red-200' : 'border-gray-100'
    )}>
      <div className={cn('w-1 shrink-0', PRIORITY_BAR[task.priority] ?? 'bg-gray-200')} />
      <div className="flex-1 flex items-start gap-3 px-4 py-3">
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
            <StatusBadge status={task.status} onClick={() => onStatusCycle(task)} />
            {task.due_date && (
              <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-500 font-medium' : 'text-gray-400')}>
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

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLOR[task.priority] ?? '')}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Task group (section with label) ──────────────────────────────────────────
function TaskGroup({
  label, tasks, labelClass, ...handlers
}: { label: string; tasks: Task[]; labelClass?: string } & CardHandlers) {
  if (tasks.length === 0) return null
  return (
    <div>
      <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2 px-1', labelClass ?? 'text-gray-400')}>
        {label} <span className="font-normal normal-case opacity-60">({tasks.length})</span>
      </p>
      <div className="space-y-2">
        {tasks.map(t => <TaskCard key={t.id} task={t} {...handlers} />)}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
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
  const [filter, setFilter] = useState<'active' | 'done' | 'all'>('active')
  const [search, setSearch] = useState('')
  const [myTasks, setMyTasks] = useState(false)
  const [filterAssigned, setFilterAssigned] = useState('all')
  const [doneOpen, setDoneOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [savingNew, setSavingNew] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const endOfWeek = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  }, [])

  const stats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(t => t.status === 'done').length
    const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && t.due_date < today).length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, done, overdue, pct }
  }, [tasks, today])

  const baseFiltered = useMemo(() => {
    let list = tasks
    if (myTasks) list = list.filter(t => t.assigned_to === userId || t.created_by === userId)
    if (filterAssigned !== 'all') list = list.filter(t => t.assigned_to === filterAssigned)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.category?.toLowerCase().includes(q)
      )
    }
    return list
  }, [tasks, myTasks, filterAssigned, search, userId])

  function sortByPriorityThenDate(list: Task[]) {
    const prioOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    return [...list].sort((a, b) => {
      const pa = prioOrder[a.priority] ?? 2, pb = prioOrder[b.priority] ?? 2
      if (pa !== pb) return pa - pb
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  const activeTasks = useMemo(() => baseFiltered.filter(t => t.status !== 'done'), [baseFiltered])
  const doneTasks = useMemo(() =>
    [...baseFiltered.filter(t => t.status === 'done')]
      .sort((a, b) => (b.completed_at ?? b.created_at).localeCompare(a.completed_at ?? a.created_at)),
    [baseFiltered]
  )

  // Groups for active tasks by due date
  const groups = useMemo(() => ({
    overdue:  sortByPriorityThenDate(activeTasks.filter(t => t.due_date && t.due_date < today)),
    dueToday: sortByPriorityThenDate(activeTasks.filter(t => t.due_date === today)),
    thisWeek: sortByPriorityThenDate(activeTasks.filter(t => t.due_date && t.due_date > today && t.due_date <= endOfWeek)),
    upcoming: sortByPriorityThenDate(activeTasks.filter(t => t.due_date && t.due_date > endOfWeek)),
    noDue:    sortByPriorityThenDate(activeTasks.filter(t => !t.due_date)),
  }), [activeTasks, today, endOfWeek])

  async function handleStatusCycle(task: Task) {
    const next = STATUS_NEXT[task.status] ?? 'todo'
    const completedAt = next === 'done' ? new Date().toISOString() : null
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next, completed_at: completedAt } : t))
    const { error } = await createClient().from('tasks').update({
      status: next, completed_at: completedAt, updated_at: new Date().toISOString(),
    }).eq('id', task.id)
    if (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t))
      showToast('Erro ao atualizar status.', 'error')
    } else {
      startTransition(() => router.refresh())
    }
  }

  async function handleNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coupleId) return
    setSavingNew(true)
    const data = new FormData(e.currentTarget)
    const payload = {
      couple_id: coupleId,
      created_by: userId,
      assigned_to: (data.get('assigned_to') as string) || null,
      title: data.get('title') as string,
      description: (data.get('description') as string) || null,
      priority: data.get('priority') as string,
      due_date: (data.get('due_date') as string) || null,
      category: (data.get('category') as string) || null,
    }
    const { data: inserted, error } = await createClient().from('tasks').insert(payload).select().single()
    setSavingNew(false)
    if (error) { showToast('Erro: ' + error.message, 'error'); return }
    setTasks(prev => [inserted as Task, ...prev])
    setNewOpen(false)
    ;(e.target as HTMLFormElement).reset()
    showToast('Tarefa criada!')
    startTransition(() => router.refresh())
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTask) return
    setSavingEdit(true)
    const data = new FormData(e.currentTarget)
    const updates = {
      title: data.get('title') as string,
      description: (data.get('description') as string) || null,
      priority: data.get('priority') as string,
      assigned_to: (data.get('assigned_to') as string) || null,
      due_date: (data.get('due_date') as string) || null,
      category: (data.get('category') as string) || null,
      updated_at: new Date().toISOString(),
    }
    const { error } = await createClient().from('tasks').update(updates).eq('id', editTask.id)
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
    const { error } = await createClient().from('tasks').delete().eq('id', task.id)
    if (error) {
      setTasks(prev => [task, ...prev])
      showToast('Erro ao excluir.', 'error')
    } else {
      showToast('Tarefa excluída.')
      startTransition(() => router.refresh())
    }
  }

  const handlers: CardHandlers = { today, members, onStatusCycle: handleStatusCycle, onEdit: (t) => setEditTask(t), onDelete: handleDelete }

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* ── Stats ── */}
      {tasks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <p className="text-xs text-gray-400">Concluídas</p>
            <p className="text-xl font-bold text-green-600 mt-0.5">{stats.done}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <p className="text-xs text-gray-400">Em atraso</p>
            <p className={cn('text-xl font-bold mt-0.5', stats.overdue > 0 ? 'text-red-500' : 'text-gray-300')}>
              {stats.overdue}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
            <p className="text-xs text-gray-400">Conclusão</p>
            <p className="text-xl font-bold text-primary-600 mt-0.5">{stats.pct}%</p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${stats.pct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tarefas..."
            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {([
              { key: 'active', label: 'Ativas', count: tasks.filter(t => t.status !== 'done').length },
              { key: 'done',   label: 'Concluídas', count: stats.done },
              { key: 'all',    label: 'Todas', count: stats.total },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  filter === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {label} <span className="opacity-50">{count}</span>
              </button>
            ))}
          </div>

          {/* Minhas tarefas */}
          <button
            onClick={() => setMyTasks(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              myTasks ? 'bg-primary-50 border-primary-200 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            )}
          >
            <User className="w-3.5 h-3.5" />
            Minhas
          </button>

          {/* Assignee filter */}
          {members.length > 1 && (
            <select
              value={filterAssigned}
              onChange={e => setFilterAssigned(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Todos</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}

          {coupleId && (
            <button
              onClick={() => setNewOpen(true)}
              className="flex items-center gap-1.5 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {filter === 'done' ? (
        /* Flat done list */
        <div className="space-y-2">
          {doneTasks.map(t => <TaskCard key={t.id} task={t} {...handlers} />)}
          {doneTasks.length === 0 && (
            <p className="text-center py-12 text-gray-400 text-sm">Nenhuma tarefa concluída.</p>
          )}
        </div>
      ) : (
        /* Active grouped + collapsible done */
        <div className="space-y-5">
          {activeTasks.length === 0 && doneTasks.length === 0 && (
            <p className="text-center py-16 text-sm text-gray-400">
              {!coupleId
                ? 'Crie um casal em Configurações para começar.'
                : tasks.length === 0
                ? 'Nenhuma tarefa ainda. Crie a primeira!'
                : 'Nenhuma tarefa neste filtro.'}
            </p>
          )}

          {activeTasks.length > 0 && (
            <div className="space-y-5">
              <TaskGroup label="Atrasadas"   tasks={groups.overdue}  labelClass="text-red-500"    {...handlers} />
              <TaskGroup label="Hoje"        tasks={groups.dueToday} labelClass="text-orange-500" {...handlers} />
              <TaskGroup label="Esta semana" tasks={groups.thisWeek} labelClass="text-blue-500"   {...handlers} />
              <TaskGroup label="Próximas"    tasks={groups.upcoming}                              {...handlers} />
              <TaskGroup label="Sem prazo"   tasks={groups.noDue}                                {...handlers} />
            </div>
          )}

          {/* Collapsible done section */}
          {doneTasks.length > 0 && (
            <div>
              <button
                onClick={() => setDoneOpen(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 py-1 hover:text-gray-600 transition-colors"
              >
                {doneOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Concluídas ({doneTasks.length})
              </button>
              {doneOpen && (
                <div className="space-y-2 mt-2">
                  {doneTasks.map(t => <TaskCard key={t.id} task={t} {...handlers} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── New task modal ── */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Nova Tarefa">
        <form onSubmit={handleNew} className="space-y-4">
          <TaskFormFields members={members} />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setNewOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={savingNew} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {savingNew ? 'Salvando...' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Edit task modal ── */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title="Editar Tarefa">
        {editTask && (
          <form onSubmit={handleEdit} className="space-y-4">
            <TaskFormFields members={members} defaultValues={editTask} />
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setEditTask(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
              <button type="submit" disabled={savingEdit} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {savingEdit ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
