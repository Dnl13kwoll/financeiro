import { NextResponse } from 'next/server'
import { fetchMarketRates } from '@/lib/market-rates'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rates = await fetchMarketRates()
  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  })
}
