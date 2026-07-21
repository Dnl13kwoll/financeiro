import { NextResponse } from 'next/server'
import { fetchMarketRates } from '@/lib/market-rates'

export async function GET() {
  const rates = await fetchMarketRates()
  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  })
}
