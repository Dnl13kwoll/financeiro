import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { ImovelClient } from '@/components/features/imoveis/imovel-client'

export const metadata: Metadata = { title: 'Imóveis & Manutenção' }

export default async function ImovelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const coupleId = (member as any)?.couple_id ?? null

  const [propertiesRes, maintenancesRes] = await Promise.all([
    supabase
      .from('properties' as any)
      .select('*')
      .eq('couple_id', coupleId)
      .eq('active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('property_maintenances' as any)
      .select('*')
      .eq('couple_id', coupleId)
      .order('date', { ascending: false }),
  ])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Imóveis & Manutenção" />
      <ImovelClient
        coupleId={coupleId}
        initialProperties={(propertiesRes.data ?? []) as any[]}
        initialMaintenances={(maintenancesRes.data ?? []) as any[]}
      />
    </div>
  )
}
