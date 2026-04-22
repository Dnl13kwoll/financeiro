import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Simulador de Investimentos' }
import { Header } from '@/components/layout/header'
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
  const [rates] = await Promise.all([fetchRates()])

  return (
    <div className="flex flex-col flex-1">
      <Header title="Simulador de Investimentos" />
      <div className="p-4 md:p-6">
        <SimulatorClient
          selicRate={rates.selic}
          cdiRate={rates.cdi}
          ipcaRate={rates.ipca_12m}
        />
      </div>
    </div>
  )
}
