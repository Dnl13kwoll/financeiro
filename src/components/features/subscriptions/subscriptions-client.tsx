'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Plus, Pencil, Trash2, X, AlertTriangle, Clock,
  ToggleLeft, ToggleRight, TrendingDown, Calendar,
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Subscription {
  id: string
  couple_id: string
  name: string
  category: string
  cost: number
  billing_cycle: string
  renewal_date: string | null
  color: string | null
  active: boolean
  notes: string | null
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CYCLE_MONTHLY: Record<string, number> = {
  semanal: 4.33, mensal: 1, trimestral: 1 / 3, semestral: 1 / 6, anual: 1 / 12,
}

const CYCLE_LABELS: Record<string, string> = {
  semanal: 'Semanal', mensal: 'Mensal', trimestral: 'Trimestral',
  semestral: 'Semestral', anual: 'Anual',
}

const CATEGORY_COLORS: Record<string, string> = {
  streaming:  'bg-red-100 text-red-700',
  'música':   'bg-purple-100 text-purple-700',
  jogos:      'bg-blue-100 text-blue-700',
  software:   'bg-slate-100 text-slate-700',
  'saúde':    'bg-green-100 text-green-700',
  academia:   'bg-orange-100 text-orange-700',
  'educação': 'bg-yellow-100 text-yellow-700',
  'notícias': 'bg-cyan-100 text-cyan-700',
  cloud:      'bg-sky-100 text-sky-700',
  outro:      'bg-gray-100 text-gray-600',
}

const CATEGORY_LABELS: Record<string, string> = {
  streaming: 'Streaming', 'música': 'Música', jogos: 'Jogos',
  software: 'Software', 'saúde': 'Saúde', academia: 'Academia',
  'educação': 'Educação', 'notícias': 'Notícias', cloud: 'Cloud', outro: 'Outro',
}

const SERVICE_PRESETS = [
  { name: 'Netflix',        category: 'streaming', color: '#e50914' },
  { name: 'Disney+',        category: 'streaming', color: '#0063e5' },
  { name: 'Max (HBO)',       category: 'streaming', color: '#002be7' },
  { name: 'Amazon Prime',   category: 'streaming', color: '#00a8e0' },
  { name: 'Apple TV+',      category: 'streaming', color: '#1c1c1e' },
  { name: 'Globoplay',      category: 'streaming', color: '#f2590c' },
  { name: 'Spotify',        category: 'música',    color: '#1db954' },
  { name: 'Apple Music',    category: 'música',    color: '#fc3c44' },
  { name: 'Deezer',         category: 'música',    color: '#a238ff' },
  { name: 'YouTube Premium',category: 'streaming', color: '#ff0000' },
  { name: 'ChatGPT Plus',   category: 'software',  color: '#10a37f' },
  { name: 'Microsoft 365',  category: 'software',  color: '#d83b01' },
  { name: 'Adobe Creative', category: 'software',  color: '#ff0000' },
  { name: 'Canva Pro',      category: 'software',  color: '#7d2ae8' },
  { name: 'Notion',         category: 'software',  color: '#1c1c1e' },
  { name: 'iCloud+',        category: 'cloud',     color: '#1c7aeb' },
  { name: 'Google One',     category: 'cloud',     color: '#4285f4' },
  { name: 'Dropbox',        category: 'cloud',     color: '#0061ff' },
  { name: 'GitHub Copilot', category: 'software',  color: '#24292e' },
  { name: 'PlayStation Plus',category: 'jogos',   color: '#003087' },
  { name: 'Xbox Game Pass', category: 'jogos',     color: '#107c10' },
  { name: 'Nintendo Online',category: 'jogos',     color: '#e60012' },
]

const COLORS_PALETTE = [
  '#e50914','#1db954','#0063e5','#ff9900','#fc3c44',
  '#00a8e0','#10a37f','#7d2ae8','#f2590c','#24292e',
  '#1c1c1e','#4285f4','#d83b01','#0061ff','#107c10',
]

function toMonthly(cost: number, cycle: string) {
  return cost * (CYCLE_MONTHLY[cycle] ?? 1)
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getRenewalStatus(renewalDate: string | null): 'overdue' | 'soon' | 'ok' | null {
  if (!renewalDate) return null
  const diff = differenceInDays(parseISO(renewalDate), new Date())
  if (diff < 0) return 'overdue'
  if (diff <= 7) return 'soon'
  return 'ok'
}

// ── Toast ─────────────────────────────────────────────────────────────────────

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

// ── Subscription Modal ────────────────────────────────────────────────────────

function SubscriptionModal({ sub, coupleId, onClose, onSaved }: {
  sub: Subscription | null
  coupleId: string
  onClose: () => void
  onSaved: (s: Subscription) => void
}) {
  const [loading, setLoading] = useState(false)
  const [showPresets, setShowPresets] = useState(!sub)
  const [form, setForm] = useState({
    name: sub?.name ?? '',
    category: sub?.category ?? 'streaming',
    cost: sub?.cost?.toString() ?? '',
    billing_cycle: sub?.billing_cycle ?? 'mensal',
    renewal_date: sub?.renewal_date ?? '',
    color: sub?.color ?? COLORS_PALETTE[0],
    notes: sub?.notes ?? '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function applyPreset(p: typeof SERVICE_PRESETS[0]) {
    setForm(f => ({ ...f, name: p.name, category: p.category, color: p.color }))
    setShowPresets(false)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.cost) return
    setLoading(true)
    const db = createClient() as any
    const payload = {
      couple_id: coupleId,
      name: form.name.trim(),
      category: form.category,
      cost: parseFloat(form.cost),
      billing_cycle: form.billing_cycle,
      renewal_date: form.renewal_date || null,
      color: form.color || null,
      notes: form.notes.trim() || null,
    }
    if (sub) {
      const { data, error } = await db.from('subscriptions').update(payload).eq('id', sub.id).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    } else {
      const { data, error } = await db.from('subscriptions').insert(payload).select().single()
      if (error) { alert('Erro: ' + error.message); setLoading(false); return }
      onSaved(data)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{sub ? 'Editar Assinatura' : 'Nova Assinatura'}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Presets */}
          {showPresets && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Serviços populares</p>
              <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto">
                {SERVICE_PRESETS.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-colors text-center">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: p.color }} />
                    <span className="text-xs text-gray-600 leading-tight">{p.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowPresets(false)}
                className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
                Preencher manualmente
              </button>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
            <input type="text" placeholder="Ex: Netflix, Spotify" value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {/* Cost + cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" placeholder="0,00" value={form.cost}
                onChange={e => set('cost', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ciclo de cobrança</label>
              <select value={form.billing_cycle} onChange={e => set('billing_cycle', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {Object.entries(CYCLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Renewal date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Data de renovação</label>
            <input type="date" value={form.renewal_date} onChange={e => set('renewal_date', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS_PALETTE.map(c => (
                <button key={c} type="button" onClick={() => set('color', c)}
                  className={cn('w-7 h-7 rounded-full transition-transform hover:scale-110',
                    form.color === c && 'ring-2 ring-offset-1 ring-primary-500 scale-110')}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <input type="text" placeholder="Ex: Plano família" value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading || !form.name.trim() || !form.cost}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium">
            {loading ? 'Salvando...' : sub ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Subscription Card ─────────────────────────────────────────────────────────

function SubCard({ sub, onEdit, onDelete, onToggle }: {
  sub: Subscription
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  const monthly = toMonthly(sub.cost, sub.billing_cycle)
  const renewal = getRenewalStatus(sub.renewal_date)

  return (
    <div className={cn(
      'bg-white border rounded-2xl p-4 shadow-sm transition-all',
      !sub.active && 'opacity-50',
      renewal === 'overdue' ? 'border-red-200' : renewal === 'soon' ? 'border-amber-200' : 'border-gray-100'
    )}>
      <div className="flex items-start gap-3">
        {/* Color dot */}
        <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: sub.color ?? '#6b7280' }}>
          {sub.name.charAt(0)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{sub.name}</span>
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[sub.category] ?? 'bg-gray-100 text-gray-600')}>
              {CATEGORY_LABELS[sub.category] ?? sub.category}
            </span>
            {!sub.active && <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Inativa</span>}
          </div>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm font-bold text-gray-900">
              {formatCurrency(sub.cost)}
              <span className="text-xs text-gray-400 font-normal ml-1">/{CYCLE_LABELS[sub.billing_cycle]?.toLowerCase()}</span>
            </span>
            {sub.billing_cycle !== 'mensal' && (
              <span className="text-xs text-gray-400">≈ {formatCurrency(monthly)}/mês</span>
            )}
          </div>

          {sub.renewal_date && (
            <div className={cn('flex items-center gap-1 text-xs mt-1',
              renewal === 'overdue' ? 'text-red-500' : renewal === 'soon' ? 'text-amber-500' : 'text-gray-400')}>
              {renewal === 'overdue' && <AlertTriangle className="w-3 h-3" />}
              {renewal === 'soon' && <Clock className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              Renovação: {format(parseISO(sub.renewal_date), 'dd/MM/yyyy', { locale: ptBR })}
              {renewal === 'overdue' && ' — vencida'}
              {renewal === 'soon' && ` — em ${differenceInDays(parseISO(sub.renewal_date), new Date())} dias`}
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onToggle} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors" title={sub.active ? 'Desativar' : 'Ativar'}>
            {sub.active ? <ToggleRight className="w-4 h-4 text-primary-500" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Client ───────────────────────────────────────────────────────────────

export function SubscriptionsClient({ coupleId, initialSubscriptions }: {
  coupleId: string
  initialSubscriptions: Subscription[]
}) {
  const { show: showToast, ToastContainer } = useToast()
  const [subs, setSubs] = useState<Subscription[]>(initialSubscriptions)
  const [modal, setModal] = useState<Subscription | null | 'new'>(null)

  const active = subs.filter(s => s.active)
  const monthlyTotal = active.reduce((sum, s) => sum + toMonthly(s.cost, s.billing_cycle), 0)
  const annualTotal = monthlyTotal * 12

  const renewingSoon = active.filter(s => {
    const r = getRenewalStatus(s.renewal_date)
    return r === 'overdue' || r === 'soon'
  })

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of active) {
      map[s.category] = (map[s.category] ?? 0) + toMonthly(s.cost, s.billing_cycle)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [active])

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta assinatura?')) return
    const { error } = await (createClient() as any).from('subscriptions').delete().eq('id', id)
    if (error) { showToast('Erro ao excluir', 'error'); return }
    setSubs(s => s.filter(x => x.id !== id))
    showToast('Assinatura removida')
  }

  async function handleToggle(sub: Subscription) {
    const { data, error } = await (createClient() as any)
      .from('subscriptions').update({ active: !sub.active }).eq('id', sub.id).select().single()
    if (error) { showToast('Erro', 'error'); return }
    setSubs(s => s.map(x => x.id === sub.id ? data : x))
    showToast(data.active ? 'Assinatura ativada' : 'Assinatura pausada')
  }

  function handleSaved(s: Subscription) {
    setSubs(prev => {
      const idx = prev.findIndex(x => x.id === s.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = s; return n }
      return [s, ...prev]
    })
    setModal(null)
    showToast(modal === 'new' ? 'Assinatura adicionada!' : 'Assinatura atualizada!')
  }

  return (
    <>
      <ToastContainer />
      {modal !== null && (
        <SubscriptionModal
          sub={modal === 'new' ? null : modal}
          coupleId={coupleId}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="p-4 md:p-6 space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Assinaturas</h2>
            <p className="text-xs text-gray-400 mt-0.5">{active.length} ativa{active.length !== 1 ? 's' : ''} de {subs.length} total</p>
          </div>
          <button onClick={() => setModal('new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>

        {/* Summary */}
        {subs.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400">Custo mensal</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(monthlyTotal)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(annualTotal)}/ano</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-gray-400 mb-2">Por categoria</p>
              <div className="space-y-1">
                {byCategory.slice(0, 3).map(([cat, val]) => (
                  <div key={cat} className="flex items-center justify-between">
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full', CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600')}>
                      {CATEGORY_LABELS[cat] ?? cat}
                    </span>
                    <span className="text-xs font-medium text-gray-700">{formatCurrency(val)}/mês</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Renewal alerts */}
        {renewingSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Renovações próximas
            </p>
            <div className="space-y-1">
              {renewingSoon.map(s => {
                const r = getRenewalStatus(s.renewal_date)
                const diff = s.renewal_date ? differenceInDays(parseISO(s.renewal_date), new Date()) : 0
                return (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-amber-800 font-medium">{s.name}</span>
                    <span className={cn(r === 'overdue' ? 'text-red-600' : 'text-amber-600')}>
                      {r === 'overdue' ? `Vencida há ${Math.abs(diff)} dias` : `Em ${diff} dia${diff !== 1 ? 's' : ''}`}
                      {' — '}{formatCurrency(s.cost)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* List */}
        {subs.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-600 font-semibold mb-1">Nenhuma assinatura cadastrada</h3>
            <p className="text-sm text-gray-400 mb-4">Adicione seus serviços recorrentes para ver o custo total mensal.</p>
            <button onClick={() => setModal('new')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors mx-auto">
              <Plus className="w-4 h-4" /> Adicionar assinatura
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subs.map(s => (
              <SubCard
                key={s.id}
                sub={s}
                onEdit={() => setModal(s)}
                onDelete={() => handleDelete(s.id)}
                onToggle={() => handleToggle(s)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
