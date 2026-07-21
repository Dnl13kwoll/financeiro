const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs'

async function fetchSeries(series: number): Promise<number | null> {
  try {
    const res = await fetch(`${BCB_BASE}.${series}/dados/ultimos/1?formato=json`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return parseFloat((data[0].valor as string).replace(',', '.'))
  } catch {
    return null
  }
}

export async function fetchMarketRates() {
  const [selic, cdi, ipca] = await Promise.all([
    fetchSeries(432),   // SELIC anualizada
    fetchSeries(4391),  // CDI anualizado
    fetchSeries(13522), // IPCA 12 meses
  ])
  return {
    selic: selic ?? 13.75,
    cdi: cdi ?? 13.65,
    ipca_12m: ipca ?? 4.83,
    source: selic !== null ? 'bcb' : 'fallback',
    updated_at: new Date().toISOString(),
  }
}
