'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Trash2, Check, MapPin, Plane, Hotel, Car, Utensils,
  ShoppingBag, FileText, Star, ChevronDown, ChevronUp, Edit2, X
} from 'lucide-react'

type Trip = {
  id: string
  name: string
  destination: string
  start_date: string | null
  end_date: string | null
  budget: number
  status: string
  notes: string | null
}

type Expense = {
  id: string
  category: string
  description: string
  estimated: number
  actual: number | null
  paid: boolean
  notes: string | null
}

type Place = {
  id: string
  name: string
  type: string
  address: string | null
  notes: string | null
  status: string
}

const categoryLabel: Record<string, string> = {
  hospedagem: 'Hospedagem',
  transporte: 'Transporte',
  passeios: 'Passeios',
  alimentacao: 'Alimentação',
  compras: 'Compras',
  documentos: 'Documentos',
  outros: 'Outros',
}

const categoryIcon: Record<string, React.ReactNode> = {
  hospedagem: <Hotel className="w-4 h-4" />,
  transporte: <Car className="w-4 h-4" />,
  passeios: <Star className="w-4 h-4" />,
  alimentacao: <Utensils className="w-4 h-4" />,
  compras: <ShoppingBag className="w-4 h-4" />,
  documentos: <FileText className="w-4 h-4" />,
  outros: <MapPin className="w-4 h-4" />,
}

const placeTypeLabel: Record<string, string> = {
  tourist: 'Turístico',
  restaurant: 'Restaurante',
  hotel: 'Hotel',
  transport: 'Transporte',
  other: 'Outro',
}

const statusLabel: Record<string, { label: string; color: string }> = {
  planning: { label: 'Planejando', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Concluída', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
}

const placeStatusLabel: Record<string, { label: string; color: string }> = {
  wishlist: { label: 'Quero ir', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  visited: { label: 'Visitado', color: 'bg-green-100 text-green-700' },
}

function TripCard({
  trip, expenses, places, coupleId
}: {
  trip: Trip
  expenses: Expense[]
  places: Place[]
  coupleId: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [expanded, setExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'budget' | 'places'>('budget')

  // Expense form
  const [showExpForm, setShowExpForm] = useState(false)
  const [expCategory, setExpCategory] = useState('hospedagem')
  const [expDesc, setExpDesc] = useState('')
  const [expEstimated, setExpEstimated] = useState('')
  const [expActual, setExpActual] = useState('')
  const [expNotes, setExpNotes] = useState('')

  // Place form
  const [showPlaceForm, setShowPlaceForm] = useState(false)
  const [placeName, setPlaceName] = useState('')
  const [placeType, setPlaceType] = useState('tourist')
  const [placeAddress, setPlaceAddress] = useState('')
  const [placeNotes, setPlaceNotes] = useState('')

  const totalEstimated = expenses.reduce((s, e) => s + e.estimated, 0)
  const totalActual = expenses.reduce((s, e) => s + (e.actual ?? e.estimated), 0)
  const totalPaid = expenses.filter(e => e.paid).reduce((s, e) => s + (e.actual ?? e.estimated), 0)
  const budgetPct = trip.budget > 0 ? Math.min(100, (totalEstimated / trip.budget) * 100) : 0
  const overBudget = totalEstimated > trip.budget && trip.budget > 0

  async function addExpense() {
    if (!expDesc || !expEstimated) return
    await (supabase.from('trip_expenses') as any).insert({
      trip_id: trip.id,
      category: expCategory,
      description: expDesc,
      estimated: parseFloat(expEstimated),
      actual: expActual ? parseFloat(expActual) : null,
      notes: expNotes || null,
    })
    setExpDesc(''); setExpEstimated(''); setExpActual(''); setExpNotes('')
    setShowExpForm(false)
    router.refresh()
  }

  async function togglePaid(exp: Expense) {
    await (supabase.from('trip_expenses') as any).update({ paid: !exp.paid }).eq('id', exp.id)
    router.refresh()
  }

  async function deleteExpense(id: string) {
    await (supabase.from('trip_expenses') as any).delete().eq('id', id)
    router.refresh()
  }

  async function addPlace() {
    if (!placeName) return
    await (supabase.from('trip_places') as any).insert({
      trip_id: trip.id,
      name: placeName,
      type: placeType,
      address: placeAddress || null,
      notes: placeNotes || null,
    })
    setPlaceName(''); setPlaceAddress(''); setPlaceNotes('')
    setShowPlaceForm(false)
    router.refresh()
  }

  async function cycleStatus(place: Place) {
    const cycle = ['wishlist', 'confirmed', 'visited']
    const next = cycle[(cycle.indexOf(place.status) + 1) % cycle.length]
    await (supabase.from('trip_places') as any).update({ status: next }).eq('id', place.id)
    router.refresh()
  }

  async function deletePlace(id: string) {
    await (supabase.from('trip_places') as any).delete().eq('id', id)
    router.refresh()
  }

  async function deleteTrip() {
    if (!confirm('Excluir esta viagem e todos os dados?')) return
    await (supabase.from('trips') as any).delete().eq('id', trip.id)
    router.refresh()
  }

  const st = statusLabel[trip.status] ?? statusLabel.planning
  const groupedExpenses = Object.keys(categoryLabel).reduce((acc, cat) => {
    const items = expenses.filter(e => e.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, Expense[]>)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-lg">{trip.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{trip.destination}</span>
              {trip.start_date && (
                <span className="text-gray-400 ml-2">
                  {new Date(trip.start_date).toLocaleDateString('pt-BR')}
                  {trip.end_date && ` → ${new Date(trip.end_date).toLocaleDateString('pt-BR')}`}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={deleteTrip} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Budget summary */}
        {trip.budget > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Orçamento: <span className="font-semibold text-gray-700">{formatCurrency(trip.budget)}</span></span>
              <span className={overBudget ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                Estimado: {formatCurrency(totalEstimated)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all ${overBudget ? 'bg-red-500' : budgetPct > 80 ? 'bg-amber-500' : 'bg-primary-500'}`}
                style={{ width: `${budgetPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Pago: <span className="text-green-600 font-medium">{formatCurrency(totalPaid)}</span></span>
              <span>Real: <span className="font-medium text-gray-600">{formatCurrency(totalActual)}</span></span>
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['budget', 'places'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === tab ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab === 'budget' ? `Orçamento (${expenses.length})` : `Locais (${places.length})`}
              </button>
            ))}
          </div>

          {activeTab === 'budget' && (
            <div className="p-4 space-y-3">
              {Object.entries(groupedExpenses).map(([cat, items]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {categoryIcon[cat]}
                    <span>{categoryLabel[cat]}</span>
                    <span className="ml-auto font-normal normal-case text-gray-400">
                      {formatCurrency(items.reduce((s, e) => s + e.estimated, 0))}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map(exp => (
                      <div key={exp.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${exp.paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <button onClick={() => togglePaid(exp)} className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${exp.paid ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {exp.paid && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className={`flex-1 truncate ${exp.paid ? 'line-through text-gray-400' : 'text-gray-700'}`}>{exp.description}</span>
                        <div className="text-right shrink-0">
                          <span className="font-medium text-gray-700">{formatCurrency(exp.estimated)}</span>
                          {exp.actual !== null && exp.actual !== exp.estimated && (
                            <span className="block text-xs text-gray-400">real: {formatCurrency(exp.actual)}</span>
                          )}
                        </div>
                        <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {expenses.length === 0 && !showExpForm && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum item no orçamento ainda.</p>
              )}

              {showExpForm ? (
                <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={expCategory} onChange={e => setExpCategory(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {Object.entries(categoryLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Descrição (ex: Hotel X)"
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={expEstimated} onChange={e => setExpEstimated(e.target.value)} placeholder="Valor estimado"
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <input type="number" value={expActual} onChange={e => setExpActual(e.target.value)} placeholder="Valor real (opcional)"
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <input value={expNotes} onChange={e => setExpNotes(e.target.value)} placeholder="Notas (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowExpForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
                    <button onClick={addExpense} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Adicionar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowExpForm(true)}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-1">
                  <Plus className="w-4 h-4" /> Adicionar item
                </button>
              )}
            </div>
          )}

          {activeTab === 'places' && (
            <div className="p-4 space-y-2">
              {places.map(place => {
                const ps = placeStatusLabel[place.status] ?? placeStatusLabel.wishlist
                return (
                  <div key={place.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3 hover:border-primary-200 transition-colors">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-800 text-sm">{place.name}</span>
                        <span className="text-xs text-gray-400">{placeTypeLabel[place.type]}</span>
                      </div>
                      {place.address && <p className="text-xs text-gray-400 mt-0.5">{place.address}</p>}
                      {place.notes && <p className="text-xs text-gray-500 mt-0.5">{place.notes}</p>}
                    </div>
                    <button onClick={() => cycleStatus(place)}
                      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${ps.color} hover:opacity-80 transition-opacity`}>
                      {ps.label}
                    </button>
                    <button onClick={() => deletePlace(place.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}

              {places.length === 0 && !showPlaceForm && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum local adicionado ainda.</p>
              )}

              {showPlaceForm ? (
                <div className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={placeName} onChange={e => setPlaceName(e.target.value)} placeholder="Nome do local"
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    <select value={placeType} onChange={e => setPlaceType(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {Object.entries(placeTypeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <input value={placeAddress} onChange={e => setPlaceAddress(e.target.value)} placeholder="Endereço (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <input value={placeNotes} onChange={e => setPlaceNotes(e.target.value)} placeholder="Notas (opcional)"
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setShowPlaceForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
                    <button onClick={addPlace} className="px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">Adicionar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowPlaceForm(true)}
                  className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium mt-1">
                  <Plus className="w-4 h-4" /> Adicionar local
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function TripManager({ coupleId, initialTrips, initialExpenses, initialPlaces }: {
  coupleId: string
  initialTrips: Trip[]
  initialExpenses: Record<string, Expense[]>
  initialPlaces: Record<string, Place[]>
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

  async function createTrip() {
    if (!name || !destination) return
    await (supabase.from('trips') as any).insert({
      couple_id: coupleId,
      name,
      destination,
      start_date: startDate || null,
      end_date: endDate || null,
      budget: parseFloat(budget) || 0,
      status,
    })
    setName(''); setDestination(''); setStartDate(''); setEndDate(''); setBudget('')
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
          coupleId={coupleId}
        />
      ))}

      {initialTrips.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <Plane className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma viagem planejada ainda.</p>
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">Nova viagem</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome da viagem</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Lua de mel em Paris"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Destino</label>
              <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex: Paris, França"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data de ida</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data de volta</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Orçamento total (R$)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0,00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="planning">Planejando</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Concluída</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancelar</button>
            <button onClick={createTrip} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
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
