'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plane, Plus, Search, ArrowUp, ArrowDown, Archive } from 'lucide-react'
import {
  TripCard, statusLabel,
  type Trip, type Expense, type Place, type ChecklistItem,
  type Companion, type Quote, type Goal, type ItineraryItem,
  type DiaryEntry, type Attachment,
} from './trip-card'
import { TripStats } from './trip-stats'

const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'planning', label: 'Planejando' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'completed', label: 'Concluídas' },
  { value: 'cancelled', label: 'Canceladas' },
]

export function TripManager({
  coupleId, initialTrips, initialExpenses, initialPlaces, initialChecklists,
  initialCompanions, initialQuotes, initialItinerary, initialDiary, initialAttachments, goals,
}: {
  coupleId: string
  initialTrips: Trip[]
  initialExpenses: Record<string, Expense[]>
  initialPlaces: Record<string, Place[]>
  initialChecklists: Record<string, ChecklistItem[]>
  initialCompanions: Record<string, Companion[]>
  initialQuotes: Record<string, Quote[]>
  initialItinerary: Record<string, ItineraryItem[]>
  initialDiary: Record<string, DiaryEntry[]>
  initialAttachments: Record<string, Attachment[]>
  goals: Goal[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const supabase = createClient()

  // Filters
  const [filter, setFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [destFilter, setDestFilter] = useState<string | null>(null)

  // Create form
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [status, setStatus] = useState('planning')
  const [goalId, setGoalId] = useState('')
  const [newTags, setNewTags] = useState('')

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"

  // Sort trips by sort_order
  const sortedTrips = [...initialTrips].sort((a, b) => a.sort_order - b.sort_order)

  // Apply filters
  const filteredTrips = sortedTrips.filter(t => {
    if (!showArchived && t.archived) return false
    if (filter !== 'all' && t.status !== filter) return false
    if (destFilter && t.destination !== destFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (!t.name.toLowerCase().includes(q) && !t.destination.toLowerCase().includes(q)) return false
    }
    return true
  })

  const archivedCount = initialTrips.filter(t => t.archived).length
  const hasActiveFilter = filter !== 'all' || destFilter !== null || searchQuery.trim().length > 0

  async function createTrip() {
    if (!name || !destination) return
    const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)
    await (supabase.from('trips') as any).insert({
      couple_id: coupleId,
      name, destination,
      start_date: startDate || null,
      end_date: endDate || null,
      budget: parseFloat(budget) || 0,
      status,
      goal_id: goalId || null,
      tags,
      sort_order: initialTrips.length,
    })
    setName(''); setDestination(''); setStartDate(''); setEndDate('')
    setBudget(''); setGoalId(''); setNewTags('')
    setShowForm(false)
    startTransition(() => { router.refresh() })
  }

  async function moveTripOrder(trip: Trip, dir: 'up' | 'down') {
    const visible = sortedTrips.filter(t => !t.archived)
    const idx = visible.findIndex(t => t.id === trip.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= visible.length) return
    const other = visible[swapIdx]
    await Promise.all([
      (supabase.from('trips') as any).update({ sort_order: other.sort_order }).eq('id', trip.id),
      (supabase.from('trips') as any).update({ sort_order: trip.sort_order }).eq('id', other.id),
    ])
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="space-y-4">
      {/* Stats panel */}
      <TripStats
        trips={initialTrips}
        expenses={initialExpenses}
        onFilterByDestination={dest => {
          setDestFilter(dest)
          if (dest) setFilter('all')
        }}
      />

      {/* Search + archive toggle */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou destino..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors shrink-0 ${showArchived ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
          >
            <Archive className="w-3.5 h-3.5" />
            Arquivadas ({archivedCount})
          </button>
        )}
      </div>

      {/* Filter tabs */}
      {initialTrips.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                filter === f.value ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {f.label}
              {f.value !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({initialTrips.filter(t => !t.archived && t.status === f.value).length})
                </span>
              )}
            </button>
          ))}
          {hasActiveFilter && (
            <button
              onClick={() => { setFilter('all'); setDestFilter(null); setSearchQuery('') }}
              className="px-3 py-1.5 text-xs rounded-full font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Destination filter indicator */}
      {destFilter && (
        <div className="flex items-center gap-2 text-xs text-primary-700 bg-primary-50 px-3 py-2 rounded-lg">
          <span>Filtrando por destino: <strong>{destFilter}</strong></span>
          <button onClick={() => setDestFilter(null)} className="underline hover:no-underline ml-1">Limpar</button>
        </div>
      )}

      {/* Trip list with sort buttons */}
      {filteredTrips.map((trip, idx) => {
        const nonArchivedFiltered = filteredTrips.filter(t => !t.archived)
        const nonArchivedIdx = nonArchivedFiltered.findIndex(t => t.id === trip.id)
        return (
          <div key={trip.id} className="flex gap-2">
            {!trip.archived && (
              <div className="flex flex-col gap-0.5 pt-3">
                <button
                  onClick={() => moveTripOrder(trip, 'up')}
                  disabled={nonArchivedIdx === 0}
                  title="Mover para cima"
                  className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 rounded"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveTripOrder(trip, 'down')}
                  disabled={nonArchivedIdx === nonArchivedFiltered.length - 1}
                  title="Mover para baixo"
                  className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 rounded"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <TripCard
                trip={trip}
                expenses={initialExpenses[trip.id] ?? []}
                places={initialPlaces[trip.id] ?? []}
                checklists={initialChecklists[trip.id] ?? []}
                companions={initialCompanions[trip.id] ?? []}
                quotes={initialQuotes[trip.id] ?? []}
                itinerary={initialItinerary[trip.id] ?? []}
                diary={initialDiary[trip.id] ?? []}
                attachments={initialAttachments[trip.id] ?? []}
                goals={goals}
              />
            </div>
          </div>
        )
      })}

      {filteredTrips.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {searchQuery ? `Nenhuma viagem encontrada para "${searchQuery}".` :
             filter === 'all' ? 'Nenhuma viagem planejada ainda.' :
             `Nenhuma viagem com status "${statusLabel[filter]}".`}
          </p>
          {filter === 'all' && !searchQuery && <p className="text-xs mt-1">Clique em &quot;Nova viagem&quot; para começar.</p>}
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Nova viagem</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome da viagem *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Lua de mel em Paris" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Destino *</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex: Paris, França" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data de ida</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data de volta</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Orçamento total (R$)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                <option value="planning">Planejando</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Tags (separadas por vírgula)</label>
              <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Ex: romântica, praia, internacional" className={inputCls} />
            </div>
            {goals.length > 0 && (
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Vincular a uma meta (opcional)</label>
                <select value={goalId} onChange={e => setGoalId(e.target.value)} className={inputCls}>
                  <option value="">Nenhuma</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name} — {Math.round((g.current_amount / g.target_amount) * 100)}% concluída</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button onClick={createTrip} disabled={!name || !destination}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              Criar viagem
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <Plus className="w-4 h-4" /> Nova viagem
        </button>
      )}
    </div>
  )
}
