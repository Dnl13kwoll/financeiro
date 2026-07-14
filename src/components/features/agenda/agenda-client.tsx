'use client'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, RefreshCw, ExternalLink, X, Loader2, Calendar, LogOut, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { confirmDialog } from '@/components/ui/confirm-dialog'
import { cn } from '@/lib/utils'

type CalEvent = {
  id: string
  summary?: string
  description?: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
  htmlLink?: string
  colorId?: string
}

// Google Calendar color IDs → Tailwind classes
const GCal_COLOR: Record<string, string> = {
  '1':  'bg-blue-400',
  '2':  'bg-teal-500',
  '3':  'bg-purple-400',
  '4':  'bg-red-400',
  '5':  'bg-yellow-400',
  '6':  'bg-orange-400',
  '7':  'bg-cyan-400',
  '8':  'bg-gray-500',
  '9':  'bg-indigo-500',
  '10': 'bg-green-500',
  '11': 'bg-rose-400',
  default: 'bg-primary-500',
}

function eventStartDate(ev: CalEvent): string {
  return (ev.start.date ?? ev.start.dateTime ?? '').slice(0, 10)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function eventColor(ev: CalEvent): string {
  return GCal_COLOR[ev.colorId ?? ''] ?? GCal_COLOR.default
}

// ── Connect screen ────────────────────────────────────────────────────────────
function ConnectScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center px-6">
      <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <Calendar className="w-10 h-10 text-blue-500" />
      </div>
      <div>
        <p className="font-bold text-gray-900 text-xl">Google Calendar</p>
        <p className="text-sm text-gray-500 mt-2 max-w-sm">
          Conecte sua conta Google para visualizar e criar eventos diretamente no app, sincronizados em tempo real.
        </p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 text-left text-sm text-gray-600 max-w-sm w-full space-y-2">
        <p className="font-medium text-gray-700 mb-2">O que você poderá fazer:</p>
        <p>• Visualizar todos os eventos do seu calendário</p>
        <p>• Criar novos eventos sem sair do app</p>
        <p>• Navegar mês a mês com calendário visual</p>
      </div>
      <a
        href="/api/auth/google"
        className="flex items-center gap-2.5 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Conectar com Google
      </a>
      <p className="text-xs text-gray-400">Apenas leitura e criação de eventos. Nunca deletamos dados.</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function AgendaClient({
  isConnected: initialConnected,
  googleEmail,
}: {
  isConnected: boolean
  googleEmail: string | null
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [connected, setConnected] = useState(initialConnected)
  const [curDate, setCurDate] = useState(new Date())
  const year = curDate.getFullYear()
  const month = curDate.getMonth()

  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newDate, setNewDate] = useState(today)
  const [allDay, setAllDay] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    if (!connected) return
    setLoading(true)
    setError(null)
    const timeMin = new Date(year, month, 1).toISOString()
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    try {
      const res = await fetch(`/api/calendar/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`)
      const data = await res.json()
      if (res.ok) {
        setEvents(data.events ?? [])
      } else if (data.error === 'not_connected') {
        setConnected(false)
      } else {
        setError(data.error ?? 'Erro ao carregar eventos')
      }
    } catch {
      setError('Erro de rede')
    }
    setLoading(false)
  }, [connected, year, month])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Handle ?google=connected / ?google=error on first load
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    if (p.get('google') === 'connected') {
      showToast('Google Calendar conectado com sucesso!')
      window.history.replaceState({}, '', '/agenda')
    } else if (p.get('google') === 'error') {
      showToast('Erro ao conectar o Google Calendar.', 'error')
      window.history.replaceState({}, '', '/agenda')
    }
  }, [])

  // Calendar grid helpers
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7

  // Events indexed by date
  const byDate = new Map<string, CalEvent[]>()
  events.forEach(ev => {
    const d = eventStartDate(ev)
    if (d) {
      if (!byDate.has(d)) byDate.set(d, [])
      byDate.get(d)!.push(ev)
    }
  })

  function prevMonth() { setCurDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); setSelectedDate(null) }
  function nextMonth() { setCurDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); setSelectedDate(null) }
  function goToday() { setCurDate(new Date()); setSelectedDate(today) }

  function handleDayClick(day: number) {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(prev => prev === d ? null : d)
  }

  function openNew(date?: string) {
    setNewDate(date ?? today)
    setAllDay(true)
    setNewOpen(true)
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const summary = fd.get('summary') as string
    const description = (fd.get('description') as string) || undefined
    const date = fd.get('date') as string
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    const body: any = { summary, description }
    if (allDay) {
      // For all-day events, end date must be the NEXT day per Google Calendar spec
      const endDate = new Date(date + 'T00:00:00')
      endDate.setDate(endDate.getDate() + 1)
      body.start = { date }
      body.end = { date: endDate.toISOString().slice(0, 10) }
    } else {
      body.start = { dateTime: `${date}T${fd.get('start_time')}:00`, timeZone: tz }
      body.end = { dateTime: `${date}T${fd.get('end_time')}:00`, timeZone: tz }
    }

    const res = await fetch('/api/calendar/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)

    if (res.ok) {
      const ev = await res.json()
      setEvents(prev => [...prev, ev])
      setNewOpen(false)
      ;(e.target as HTMLFormElement).reset()
      const statusMsg: Record<string, string> = {
        synced: 'Evento criado para os dois!',
        no_couple: 'Evento criado! (sem casal configurado)',
        no_partner: 'Evento criado! (parceiro não encontrado no casal)',
        no_service_key: 'Evento criado! (SUPABASE_SERVICE_ROLE_KEY ausente)',
        no_token: 'Evento criado! (parceiro não conectou o Google Calendar)',
        gcal_error: 'Evento criado! (erro ao criar no calendário do parceiro)',
        exception: 'Evento criado! (erro interno ao sincronizar parceiro)',
      }
      showToast(statusMsg[ev.partnerStatus] ?? 'Evento criado!')
    } else {
      const err = await res.json()
      showToast('Erro: ' + (err.error?.message ?? 'tente novamente'), 'error')
    }
  }

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/calendar/sync-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: month + 1, year }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.created === 0) {
          showToast(`Calendário já atualizado (${data.skipped} vencimentos já existentes)`)
        } else {
          showToast(`${data.created} vencimento${data.created !== 1 ? 's' : ''} adicionado${data.created !== 1 ? 's' : ''} ao calendário!`)
        }
        await fetchEvents()
      } else {
        showToast(data.error ?? 'Erro ao sincronizar', 'error')
      }
    } catch {
      showToast('Erro de rede', 'error')
    }
    setSyncing(false)
  }

  async function handleDelete(ev: CalEvent) {
    if (!await confirmDialog(`Excluir "${ev.summary ?? 'evento'}"?`, { destructive: true, confirmLabel: 'Excluir' })) return
    setDeletingId(ev.id)
    try {
      const res = await fetch(`/api/calendar/events/${ev.id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setEvents((prev: CalEvent[]) => prev.filter((e: CalEvent) => e.id !== ev.id))
        showToast('Evento excluído.')
      } else {
        showToast('Erro ao excluir evento.', 'error')
      }
    } catch {
      showToast('Erro de rede.', 'error')
    }
    setDeletingId(null)
  }

  async function handleDisconnect() {
    if (!await confirmDialog('Desconectar o Google Calendar?', { destructive: true, confirmLabel: 'Desconectar' })) return
    await fetch('/api/auth/google/disconnect', { method: 'POST' })
    setConnected(false)
    setEvents([])
    showToast('Google Calendar desconectado.')
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const selectedEvents = selectedDate ? (byDate.get(selectedDate) ?? []) : []

  if (!connected) return <ConnectScreen />

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-semibold text-gray-900 capitalize min-w-[170px] text-center hover:bg-gray-50 rounded-lg transition-colors"
          >
            {monthLabel}
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin ml-1" />}
        </div>

        <div className="flex items-center gap-2">
          {googleEmail && (
            <span className="hidden sm:inline text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{googleEmail}</span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            title={`Sincronizar vencimentos de ${monthLabel} com o Google Calendar`}
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
          <button onClick={() => openNew(selectedDate ?? today)} className="flex items-center gap-1.5 bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            <Plus className="w-4 h-4" />
            Novo evento
          </button>
          <button onClick={handleDisconnect} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Desconectar Google">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchEvents} className="text-red-600 hover:text-red-800 font-medium text-xs">Tentar novamente</button>
        </div>
      )}

      {/* ── Calendar grid ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, i) => {
            const day = i - firstDayOfWeek + 1
            const isValid = day >= 1 && day <= daysInMonth
            if (!isValid) return (
              <div key={i} className={cn('min-h-[80px] bg-gray-50/40', i % 7 < 6 ? 'border-r border-gray-50' : '', i < totalCells - 7 ? 'border-b border-gray-50' : '')} />
            )

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayEvents = byDate.get(dateStr) ?? []
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate
            const col = i % 7

            return (
              <div
                key={i}
                onClick={() => handleDayClick(day)}
                className={cn(
                  'min-h-[80px] p-1.5 cursor-pointer transition-colors select-none',
                  col < 6 ? 'border-r border-gray-100' : '',
                  i < totalCells - 7 ? 'border-b border-gray-100' : '',
                  isSelected ? 'bg-primary-50' : 'hover:bg-gray-50/80',
                )}
              >
                <div className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1 mx-auto',
                  isToday ? 'bg-primary-600 text-white' : isSelected ? 'text-primary-700' : 'text-gray-600'
                )}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      className={cn('text-xs px-1.5 py-0.5 rounded-sm text-white truncate leading-tight', eventColor(ev))}
                      title={ev.summary}
                    >
                      {ev.start.dateTime && <span className="opacity-80">{formatTime(ev.start.dateTime)} </span>}
                      {ev.summary ?? '(sem título)'}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Selected day panel ── */}
      {selectedDate && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openNew(selectedDate)}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
              <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum evento. <button onClick={() => openNew(selectedDate)} className="text-primary-600 hover:underline">Criar evento</button></p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className={cn('w-2.5 h-2.5 rounded-full mt-1.5 shrink-0', eventColor(ev))} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{ev.summary ?? '(sem título)'}</p>
                    {ev.start.dateTime ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTime(ev.start.dateTime)}
                        {ev.end.dateTime && ` – ${formatTime(ev.end.dateTime)}`}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">Dia inteiro</p>
                    )}
                    {ev.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ev.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {ev.htmlLink && (
                      <a href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors" title="Abrir no Google Calendar">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(ev)}
                      disabled={deletingId === ev.id}
                      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Excluir evento"
                    >
                      {deletingId === ev.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── New event modal ── */}
      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Novo Evento">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              name="summary"
              required
              autoFocus
              placeholder="Ex: Reunião, Aniversário, Vencimento..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Detalhes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              name="date"
              type="date"
              required
              defaultValue={newDate}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)} className="rounded" />
            Dia inteiro
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                <input name="start_time" type="time" required defaultValue="09:00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
                <input name="end_time" type="time" required defaultValue="10:00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setNewOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
              {saving ? 'Criando...' : 'Criar no Google Calendar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
