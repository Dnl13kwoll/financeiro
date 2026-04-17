import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Viagens' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { TripManager } from '@/components/features/travel/trip-manager'
import { Plane } from 'lucide-react'

export default async function TravelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await (supabase as any)
    .from('couple_members').select('couple_id').eq('user_id', user!.id).limit(1).maybeSingle()

  const coupleId: string | null = memberRes.data?.couple_id ?? null

  if (!coupleId) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Viagens" />
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Crie um casal em Configurações para começar.
        </div>
      </div>
    )
  }

  const tripsRes = await (supabase as any)
    .from('trips').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false })

  const trips = tripsRes.data ?? []
  const tripIds: string[] = trips.map((t: any) => t.id)

  const [expensesRes, placesRes, checklistsRes, companionsRes, quotesRes, goalsRes] = await Promise.all([
    tripIds.length > 0 ? (supabase as any).from('trip_expenses').select('*').in('trip_id', tripIds).order('created_at') : Promise.resolve({ data: [] }),
    tripIds.length > 0 ? (supabase as any).from('trip_places').select('*').in('trip_id', tripIds).order('sort_order') : Promise.resolve({ data: [] }),
    tripIds.length > 0 ? (supabase as any).from('trip_checklists').select('*').in('trip_id', tripIds).order('sort_order') : Promise.resolve({ data: [] }),
    tripIds.length > 0 ? (supabase as any).from('trip_companions').select('*').in('trip_id', tripIds) : Promise.resolve({ data: [] }),
    tripIds.length > 0 ? (supabase as any).from('trip_quotes').select('*').in('trip_id', tripIds).order('created_at') : Promise.resolve({ data: [] }),
    (supabase as any).from('goals').select('id, name, target_amount, current_amount').eq('couple_id', coupleId).eq('status', 'active'),
  ])

  function groupBy(arr: any[], key: string) {
    return arr.reduce((acc: Record<string, any[]>, item: any) => {
      const k = item[key]
      if (!acc[k]) acc[k] = []
      acc[k].push(item)
      return acc
    }, {})
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Viagens" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Planejamento de Viagens</h2>
            <p className="text-xs text-gray-400">Orçamento, roteiro, checklist e companheiros</p>
          </div>
        </div>

        <TripManager
          coupleId={coupleId}
          initialTrips={trips}
          initialExpenses={groupBy(expensesRes.data ?? [], 'trip_id')}
          initialPlaces={groupBy(placesRes.data ?? [], 'trip_id')}
          initialChecklists={groupBy(checklistsRes.data ?? [], 'trip_id')}
          initialCompanions={groupBy(companionsRes.data ?? [], 'trip_id')}
          initialQuotes={groupBy(quotesRes.data ?? [], 'trip_id')}
          goals={goalsRes.data ?? []}
        />
      </div>
    </div>
  )
}
