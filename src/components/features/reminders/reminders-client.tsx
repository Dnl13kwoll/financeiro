'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, X, CheckCircle2, AlertTriangle,
  Clock, Circle, BellRing,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { confirmDialog } from '@/components/ui/confirm-dialog'

interface Reminder {
  id: string
  couple_id: string
  title: string
  description: string | null
  due_date: string
  amount: number | null
  priority: 'baixa' | 'media' | 'alta' | 'urgente'
  status: 'pendente' | 'concluido' | 'cancelado'
  created_at: string
}

const PRIORITY_CONFIG = {
  baixa:   { label: 'Baixa',   dot: 'bg-gray-300',   text: 'text-gray-500' },
  media:   { label: 'Média',   dot: 'bg-blue-400',   text: 'text-blue-600' },
  alta:    { label: 'Alta',    dot: 'bg-amber-400',  text: 'text-amber-600' },
  urgente: { label: 'Urgente', dot: 'bg-red-500',    text: 'text-red-600' },
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getDueStatus(dueDate: string, status: string): 'done' | 'overdue' | 'today' | 'soon' | 'ok' {
  if (status !== 'pendente') return 'done'
  const diff = differenceInDays(parseISO(dueDate), new Date())
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff <= 7) return 'soon'
  return 'ok'
}

function useToast() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'success' | 'error' }[]>([])
  function show(msg: string, type: 'success' | 'error' = 'success') {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }
  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-[999] space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={cn('px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white',
          t.type === 'success' ? 'bg-green-600' : 'bg-red-600')}>{t.msg}</div>
      ))}
    </div>
  )
  return { show, ToastContainer }
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function ReminderModal({ reminder, coupleId, onClose, onSaved }: {
  reminder: Reminder | null
  coupleId: string
  onClose: () => void
  onSaved: (r: Reminder) => void
}) {
  const [loading, setLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    title: reminder?.title ?? '',
    description: reminder?.description ?? '',
    due_date: reminder?.due_date ?? today,
    amount: reminder?.amount?.toString() ?? '',
    priority: reminder?.priority ?? 'media',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.title.trim() || !form.due_date) return
    setLoading(true)
    const db = createClient() as any
    const payload = {
      couple_id: coupleId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date,
      amount: form.amount ? parseFloat(form.amount) : null,
      priority: form.priority,
    }
    if (reminder) {
      const { data, error } = await db.from('financial_reminders').update(payload).eq('id', reminder.id).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    } else {
      const { data, error } = await db.from('financial_reminders').insert(payload).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{reminder ? 'Editar Lembrete' : 'Novo Lembrete'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
            <input type="text" placeholder='Ex: "Pagar IPVA", "Renovar seguro"' value={form.title}
              onChange={e => set('title', e.target.value)} autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data limite *</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
              <input type="number" step="0.01" placeholder="Opcional" value={form.amount}
                onChange={e => set('amount', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
            <div className="grid grid-cols-4 gap-2">
              {(['baixa', 'media', 'alta', 'urgente'] as const).map(p => (
                <button key={p} type="button" onClick={() => set('priority', p)}
                  className={cn('py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    form.priority === p
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  )}>
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
            <input type="text" placeholder="Detalhes adicionais..." value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !form.title.trim() || !form.due_date}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium">
            {loading ? 'Salvando...' : reminder ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Client ───────────────────────────────────────────────────────────────

export function RemindersClient({ coupleId, initialReminders }: {
  coupleId: string
  initialReminders: Reminder[]
}) {
  const { show: showToast, ToastContainer } = useToast()
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders)
  const [modal, setModal] = useState<Reminder | null | 'new'>(null)
  const [filter, setFilter] = useState<'pendente' | 'concluido'>('pendente')

  const pending = reminders.filter(r => r.status === 'pendente')
  const overdue = pending.filter(r => differenceInDays(parseISO(r.due_date), new Date()) < 0)
  const filtered = reminders.filter(r => r.status === filter)

  async function handleDone(r: Reminder) {
    const db = createClient() as any
    const newStatus = r.status === 'pendente' ? 'concluido' : 'pendente'
    const { data, error } = await db.from('financial_reminders').update({ status: newStatus }).eq('id', r.id).select().single()
    if (error) { showToast('Erro', 'error'); return }
    setReminders(prev => prev.map(x => x.id === r.id ? data : x))
    showToast(newStatus === 'concluido' ? 'Lembrete concluído!' : 'Reaberto')
  }

  async function handleDelete(id: string) {
    if (!await confirmDialog('Excluir este lembrete?')) return
    const { error } = await (createClient() as any).from('financial_reminders').delete().eq('id', id)
    if (error) { showToast('Erro ao excluir', 'error'); return }
    setReminders(r => r.filter(x => x.id !== id))
    showToast('Lembrete removido')
  }

  function handleSaved(r: Reminder) {
    setReminders(prev => {
      const idx = prev.findIndex(x => x.id === r.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = r; return n }
      return [r, ...prev]
    })
    setModal(null)
    showToast(modal === 'new' ? 'Lembrete criado!' : 'Lembrete atualizado!')
  }

  return (
    <>
      <ToastContainer />
      {modal !== null && (
        <ReminderModal
          reminder={modal === 'new' ? null : modal}
          coupleId={coupleId}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="p-4 md:p-6 space-y-5 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Lembretes Financeiros</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {pending.length} pendente{pending.length !== 1 ? 's' : ''}
              {overdue.length > 0 && <span className="text-red-500 ml-1">· {overdue.length} atrasado{overdue.length !== 1 ? 's' : ''}</span>}
            </p>
          </div>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-gray-100 pb-1">
          {(['pendente', 'concluido'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-4 py-1.5 text-sm rounded-lg transition-colors',
                filter === f ? 'bg-primary-100 text-primary-700 font-medium' : 'text-gray-500 hover:bg-gray-100')}>
              {f === 'pendente' ? 'Pendentes' : 'Concluídos'}
              <span className="ml-1.5 text-xs opacity-60">({reminders.filter(r => r.status === f).length})</span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <BellRing className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {filter === 'pendente' ? 'Nenhum lembrete pendente.' : 'Nenhum lembrete concluído.'}
            </p>
            {filter === 'pendente' && (
              <button onClick={() => setModal('new')} className="mt-3 text-sm text-primary-600 hover:underline">
                Criar primeiro lembrete
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered
              .sort((a, b) => {
                if (a.status !== 'pendente') return 1
                const da = differenceInDays(parseISO(a.due_date), new Date())
                const db = differenceInDays(parseISO(b.due_date), new Date())
                return da - db
              })
              .map(r => {
                const due = getDueStatus(r.due_date, r.status)
                const diff = differenceInDays(parseISO(r.due_date), new Date())
                const priorityConf = PRIORITY_CONFIG[r.priority]

                return (
                  <div key={r.id} className={cn(
                    'bg-white border rounded-xl p-3 flex items-start gap-3 shadow-sm transition-all',
                    due === 'overdue' ? 'border-red-200' : due === 'today' ? 'border-amber-200' : due === 'soon' ? 'border-amber-100' : 'border-gray-100',
                    r.status === 'concluido' && 'opacity-60'
                  )}>
                    {/* Check button */}
                    <button onClick={() => handleDone(r)}
                      className={cn('mt-0.5 shrink-0 transition-colors',
                        r.status === 'concluido' ? 'text-green-500 hover:text-gray-400' : 'text-gray-300 hover:text-green-500')}>
                      {r.status === 'concluido'
                        ? <CheckCircle2 className="w-5 h-5" />
                        : <Circle className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-sm font-medium', r.status === 'concluido' ? 'line-through text-gray-400' : 'text-gray-800')}>
                          {r.title}
                        </span>
                        <span className={cn('w-2 h-2 rounded-full shrink-0', priorityConf.dot)} />
                        {r.amount && (
                          <span className="text-xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {formatCurrency(r.amount)}
                          </span>
                        )}
                      </div>

                      {r.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                      )}

                      <div className={cn('flex items-center gap-1 text-xs mt-1',
                        due === 'overdue' ? 'text-red-500' :
                        due === 'today' ? 'text-amber-600' :
                        due === 'soon' ? 'text-amber-500' : 'text-gray-400')}>
                        {due === 'overdue' && <AlertTriangle className="w-3 h-3" />}
                        {due === 'today' && <Clock className="w-3 h-3" />}
                        {format(parseISO(r.due_date), "dd 'de' MMM", { locale: ptBR })}
                        {due === 'overdue' && ` — atrasado ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}`}
                        {due === 'today' && ' — hoje!'}
                        {due === 'soon' && ` — em ${diff} dia${diff !== 1 ? 's' : ''}`}
                        {r.status === 'concluido' && ' — concluído'}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => setModal(r)} className="p-1.5 text-gray-300 hover:text-primary-600 rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </>
  )
}
