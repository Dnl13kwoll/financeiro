'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plane, Plus } from 'lucide-react'
import { TripCard, type Trip, type Expense, type Place, type ChecklistItem, type Companion, type Quote, type Goal } from './trip-card'

export function TripManager({ coupleId, initialTrips, initialExpenses, initialPlaces, initialChecklists, initialCompanions, initialQuotes, goals }: {
  coupleId: string
  initialTrips: Trip[]
  initialExpenses: Record<string, Expense[]>
  initialPlaces: Record<string, Place[]>
  initialChecklists: Record<string, ChecklistItem[]>
  initialCompanions: Record<string, Companion[]>
  initialQuotes: Record<string, Quote[]>
  goals: Goal[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [budget, setBudget] = useState('')
  const [status, setStatus] = useState('planning')
  const [goalId, setGoalId] = useState('')

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"

  async function createTrip() {
    if (!name || !destination) return
    await (supabase.from('trips') as any).insert({
      couple_id: coupleId,
      name, destination,
      start_date: startDate || null,
      end_date: endDate || null,
      budget: parseFloat(budget) || 0,
      status,
      goal_id: goalId || null,
    })
    setName(''); setDestination(''); setStartDate(''); setEndDate(''); setBudget(''); setGoalId('')
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {initialTrips.map(trip => (
        <TripCard
          key={trip.id}
          trip={trip}
          expenses={initialExpenses[trip.id] ?? []}
          places={initialPlaces[trip.id] ?? []}
          checklists={initialChecklists[trip.id] ?? []}
          companions={initialCompanions[trip.id] ?? []}
          quotes={initialQuotes[trip.id] ?? []}
          goals={goals}
        />
      ))}

      {initialTrips.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma viagem planejada ainda.</p>
          <p className="text-xs mt-1">Clique em "Nova viagem" para começar.</p>
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
