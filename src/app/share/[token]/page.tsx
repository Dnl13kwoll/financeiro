import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { MapPin, Calendar, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'

const statusLabel: Record<string, string> = {
  planning: 'Planejando', confirmed: 'Confirmada',
  completed: 'Concluída', cancelled: 'Cancelada',
}

const placeTypeLabel: Record<string, string> = {
  tourist: 'Turístico', restaurant: 'Restaurante',
  hotel: 'Hotel', transport: 'Transporte', other: 'Outro',
}

function formatCurrencyBR(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: tokenRow } = await (supabase as any)
    .from('trip_share_tokens')
    .select('trip_id')
    .eq('token', token)
    .maybeSingle()

  if (!tokenRow) notFound()

  const [tripRes, placesRes, itineraryRes] = await Promise.all([
    (supabase as any).from('trips').select('*').eq('id', tokenRow.trip_id).single(),
    (supabase as any).from('trip_places').select('*').eq('trip_id', tokenRow.trip_id).order('sort_order'),
    (supabase as any).from('trip_itinerary').select('*').eq('trip_id', tokenRow.trip_id).order('day_date').order('sort_order'),
  ])

  const trip = tripRes.data
  if (!trip) notFound()

  const places = placesRes.data ?? []
  const itinerary = itineraryRes.data ?? []

  // Group itinerary by day
  const byDay: Record<string, any[]> = itinerary.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.day_date]) acc[item.day_date] = []
    acc[item.day_date].push(item)
    return acc
  }, {})

  const sortedDays = Object.keys(byDay).sort()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-2xl">✈️</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{trip.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />{trip.destination}
                </span>
                {trip.start_date && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {new Date(trip.start_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    {trip.end_date && ` → ${new Date(trip.end_date + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                  </span>
                )}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  trip.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                  trip.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                  trip.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                  'bg-red-100 text-red-700'
                }`}>
                  {statusLabel[trip.status] ?? trip.status}
                </span>
              </div>
              {trip.budget > 0 && (
                <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <DollarSign className="w-4 h-4" />
                  Orçamento: <strong className="text-gray-700 ml-1">{formatCurrencyBR(trip.budget)}</strong>
                </div>
              )}
              {trip.tags && trip.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {trip.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Notes */}
        {trip.notes && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Notas</h2>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{trip.notes}</p>
          </section>
        )}

        {/* Places */}
        {places.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Roteiro — {places.length} local{places.length > 1 ? 'is' : ''}
            </h2>
            <div className="space-y-2">
              {places.map((place: any, idx: number) => (
                <div key={place.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{place.name}</span>
                      <span className="text-xs text-gray-400">{placeTypeLabel[place.type] ?? place.type}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        place.status === 'visited' ? 'bg-green-100 text-green-700' :
                        place.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {place.status === 'visited' ? 'Visitado' : place.status === 'confirmed' ? 'Confirmado' : 'Quero ir'}
                      </span>
                    </div>
                    {place.address && <p className="text-xs text-gray-400 mt-0.5">{place.address}</p>}
                    {place.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{place.notes}</p>}
                    {place.maps_url && (
                      <a href={place.maps_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-0.5 block">
                        Ver no Maps
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Itinerary */}
        {sortedDays.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Itinerário</h2>
            <div className="space-y-4">
              {sortedDays.map(day => {
                const items = (byDay[day] ?? []).sort((a: any, b: any) => (a.time_slot ?? '').localeCompare(b.time_slot ?? ''))
                const dayLabel = new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                return (
                  <div key={day}>
                    <div className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg mb-2 capitalize">
                      {dayLabel}
                    </div>
                    <div className="space-y-1.5 ml-2">
                      {items.map((item: any) => (
                        <div key={item.id} className="flex items-start gap-2 rounded-lg border border-gray-100 px-3 py-2">
                          {item.time_slot && (
                            <span className="text-xs font-mono text-primary-600 shrink-0 mt-0.5 w-10">{item.time_slot}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{item.title}</p>
                            {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-4">
          Roteiro compartilhado via FinanceiroCasais
        </div>
      </div>
    </div>
  )
}
