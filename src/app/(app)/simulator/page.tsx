import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Simulador de Investimentos' }
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { SimulatorClient } from '@/components/features/simulator/simulator-client'
import { createClient } from '@/lib/supabase/server'

async function fetchRates() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/market-rates`, { next: { revalidate: 86400 } })
    if (res.ok) return await res.json()
  } catch {}
  return { selic: 13.75, cdi: 13.65, ipca_12m: 4.83 }
}

export default async function SimulatorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .maybeSingle()
  const coupleId = (memberRes.data as any)?.couple_id ?? null

  const [rates, goalsRes] = await Promise.all([
    fetchRates(),
    coupleId
      ? supabase.from('goals').select('id, name, target_amount, current_amount').eq('couple_id', coupleId).order('created_at')
      : Promise.resolve(null),
  ])

  const goals = (goalsRes?.data ?? []).filter((g: any) => g.current_amount < g.target_amount)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Investimentos" />
      <PageTabs tabs={[
        { href: '/investments', label: 'Carteira' },
        { href: '/simulator', label: 'Simulador' },
      ]} />
      <div className="p-4 md:p-6">
        <SimulatorClient
          selicRate={rates.selic}
          cdiRate={rates.cdi}
          ipcaRate={rates.ipca_12m}
          goals={goals}
        />
      </div>
    </div>
  )
}
