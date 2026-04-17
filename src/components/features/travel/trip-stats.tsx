'use client'
import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { ChevronDown, ChevronUp, Globe, BarChart3 } from 'lucide-react'
import { statusLabel, type Trip, type Expense } from './trip-card'

type Props = {
  trips: Trip[]
  expenses: Record<string, Expense[]>
  onFilterByDestination?: (dest: string | null) => void
}

export function TripStats({ trips, expenses, onFilterByDestination }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedDest, setSelectedDest] = useState<string | null>(null)

  const activeTrips = trips.filter(t => !t.archived)
  const now = new Date().toISOString().split('T')[0]
  const liveNow = activeTrips.filter(t => t.start_date && t.end_date && now >= t.start_date && now <= t.end_date).length

  const totalBudget = activeTrips.reduce((s, t) => s + t.budget, 0)
  const totalEstimated = activeTrips.reduce((s, t) => {
    const exps = expenses[t.id] ?? []
    return s + exps.reduce((ss, e) => ss + e.estimated * e.exchange_rate, 0)
  }, 0)

  // Status breakdown
  const statusCounts = (['planning', 'confirmed', 'completed', 'cancelled'] as const).map(st => ({
    key: st,
    label: statusLabel[st],
    count: activeTrips.filter(t => t.status === st).length,
    color: { planning: 'bg-blue-400', confirmed: 'bg-green-500', completed: 'bg-gray-400', cancelled: 'bg-red-400' }[st],
  }))

  // Top destinations
  const destCounts = activeTrips.reduce((acc: Record<string, number>, t) => {
    acc[t.destination] = (acc[t.destination] ?? 0) + 1
    return acc
  }, {})
  const topDestinations = Object.entries(destCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  // Countries: extract the last comma-delimited part
  const countries = Array.from(new Set(
    activeTrips.map(t => {
      const parts = t.destination.split(',')
      return parts[parts.length - 1].trim()
    }).filter(Boolean)
  )).sort()

  function handleDestClick(dest: string) {
    if (selectedDest === dest) {
      setSelectedDest(null)
      onFilterByDestination?.(null)
    } else {
      setSelectedDest(dest)
      onFilterByDestination?.(dest)
    }
  }

  if (activeTrips.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-semibold text-gray-700">Painel de estatísticas</span>
          <span className="text-xs text-gray-400">{activeTrips.length} viagens · {countries.length} países/destinos</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-50">
          {/* Summary numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <div className="bg-primary-50 rounded-xl p-3">
              <p className="text-xs text-primary-600 font-medium">Viagens</p>
              <p className="text-2xl font-bold text-primary-700">{activeTrips.length}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium">Orçamento total</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totalBudget)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-xs text-amber-600 font-medium">Estimado total</p>
              <p className="text-lg font-bold text-amber-700">{formatCurrency(totalEstimated)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-emerald-600 font-medium">Em viagem agora</p>
              <p className="text-2xl font-bold text-emerald-700">{liveNow}</p>
            </div>
          </div>

          {/* Status breakdown */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Por status</p>
            <div className="flex gap-2 flex-wrap">
              {statusCounts.map(s => (
                <div key={s.key} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-gray-600">{s.label}</span>
                  <span className="text-sm font-bold text-gray-700">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top destinations */}
          {topDestinations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Histórico por destino</p>
              <div className="space-y-1.5">
                {topDestinations.map(([dest, count]) => {
                  const maxCount = topDestinations[0][1]
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <button
                      key={dest}
                      onClick={() => handleDestClick(dest)}
                      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${selectedDest === dest ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50 hover:bg-gray-100'}`}
                      title={`Filtrar por ${dest}`}
                    >
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm font-medium truncate block ${selectedDest === dest ? 'text-primary-700' : 'text-gray-700'}`}>{dest}</span>
                        <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                          <div className="h-1 rounded-full bg-primary-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${selectedDest === dest ? 'text-primary-600' : 'text-gray-500'}`}>{count}x</span>
                    </button>
                  )
                })}
              </div>
              {selectedDest && (
                <button onClick={() => { setSelectedDest(null); onFilterByDestination?.(null) }} className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline">
                  Limpar filtro por destino
                </button>
              )}
            </div>
          )}

          {/* Countries / Mapa-múndi (text) */}
          {countries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Países / regiões visitados</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {countries.map(c => (
                  <span key={c} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
