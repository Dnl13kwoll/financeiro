import { NextResponse } from 'next/server'

// BCB PTAX API series IDs
// 432 = Taxa SELIC acumulada no mês anualizada (% a.a.)
// 4391 = CDI acumulado no mês anualizado (% a.a.)
// 13522 = IPCA acumulado nos últimos 12 meses

const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'

async function fetchLastValue(series: number): Promise<number | null> {
  try {
    const url = `${BCB_BASE}.${series}/dados/ultimos/1?formato=json`
    const res = await fetch(url, { next: { revalidate: 86400 } }) // 24h cache
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    const raw = data[0].valor as string
    return parseFloat(raw.replace(',', '.'))
  } catch {
    return null
  }
}

export async function GET() {
  const [selic, cdi, ipca] = await Promise.all([
    fetchLastValue(432),
    fetchLastValue(4391),
    fetchLastValue(13522),
  ])

  // Fallback to hardcoded values if BCB is unavailable
  return NextResponse.json(
    {
      selic: selic ?? 13.75,
      cdi: cdi ?? 13.65,
      ipca_12m: ipca ?? 4.83,
      source: selic !== null ? 'bcb' : 'fallback',
      updated_at: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
      },
    }
  )
}
