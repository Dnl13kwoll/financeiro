export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { VehiclesClient } from '@/components/features/vehicles/vehicles-client'

export const metadata: Metadata = { title: 'Veículos & Manutenções' }

export default async function VehiclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const coupleId = (member as any)?.couple_id ?? null

  const [vehiclesRes, maintenancesRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('*')
      .eq('couple_id', coupleId)
      .eq('active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('vehicle_maintenances')
      .select('*')
      .eq('couple_id', coupleId)
      .order('date', { ascending: false }),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Veículos & Manutenções" />
      <VehiclesClient
        coupleId={coupleId}
        initialVehicles={(vehiclesRes.data ?? []) as any[]}
        initialMaintenances={(maintenancesRes.data ?? []) as any[]}
      />
    </div>
  )
}
