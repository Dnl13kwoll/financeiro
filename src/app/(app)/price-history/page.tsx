export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Histórico de Preços' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { NewPriceRecordButton, DeletePriceRecord } from '@/components/features/price-history/price-history-actions'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function PriceHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const histRes = coupleId
    ? await supabase.from('price_history')
        .select('*')
        .eq('couple_id', coupleId)
        .order('recorded_at', { ascending: false })
        .order('created_at', { ascending: false })
    : null

  const records: any[] = histRes?.data ?? []

  // Group by item_name for trend analysis
  const byItem: Record<string, any[]> = {}
  for (const r of records) {
    if (!byItem[r.item_name]) byItem[r.item_name] = []
    byItem[r.item_name].push(r)
  }

  // Unique item names for autocomplete
  const itemSuggestions = Object.keys(byItem)

  // Build summary cards: latest price vs previous
  const summaries = Object.entries(byItem).map(([name, recs]) => {
    const sorted = [...recs].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    const latest = sorted[0]
    const previous = sorted[1]
    const pricePerUnit = (r: any) => r.price / (r.quantity || 1)
    const latestPPU = pricePerUnit(latest)
    const prevPPU = previous ? pricePerUnit(previous) : null
    const change = prevPPU ? ((latestPPU - prevPPU) / prevPPU) * 100 : null
    return { name, latest, previous, latestPPU, prevPPU, change, count: sorted.length }
  }).sort((a, b) => b.latest.recorded_at.localeCompare(a.latest.recorded_at))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Histórico de Preços" />

      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {itemSuggestions.length} {itemSuggestions.length === 1 ? 'produto monitorado' : 'produtos monitorados'}
          </p>
          {coupleId && (
            <NewPriceRecordButton
              coupleId={coupleId}
              userId={user!.id}
              itemSuggestions={itemSuggestions}
            />
          )}
        </div>

        {/* Summary cards */}
        {summaries.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Últimos preços</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summaries.map(({ name, latest, latestPPU, change, count }) => (
                <div key={name} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{name}</p>
                      {latest.store && (
                        <p className="text-xs text-gray-400 truncate">{latest.store}</p>
                      )}
                    </div>
                    {change !== null && (
                      <span className={`flex items-center gap-0.5 text-xs font-medium shrink-0 ${change > 0 ? 'text-red-500' : change < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {change > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : change < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xl font-bold text-gray-900 financial-value">
                      {formatCurrency(latest.price)}
                    </span>
                    {latest.quantity !== 1 && (
                      <span className="text-xs text-gray-400 ml-1">
                        / {latest.quantity}{latest.unit ? ` ${latest.unit}` : 'x'}
                        {' '}({formatCurrency(latestPPU)}/{latest.unit || 'un'})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{formatDate(latest.recorded_at)}</p>
                    <p className="text-xs text-gray-300">{count} {count === 1 ? 'registro' : 'registros'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full history */}
        {records.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico completo</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {records.map((r: any) => {
                const pricePerUnit = r.price / (r.quantity || 1)
                return (
                  <div key={r.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{r.item_name}</span>
                        {r.category && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{r.category}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {r.store && <span className="text-xs text-gray-400">{r.store}</span>}
                        {r.quantity !== 1 && (
                          <span className="text-xs text-gray-400">
                            {r.quantity}{r.unit ? ` ${r.unit}` : 'x'} · {formatCurrency(pricePerUnit)}/{r.unit || 'un'}
                          </span>
                        )}
                        <span className="text-xs text-gray-300">{formatDate(r.recorded_at)}</span>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm financial-value shrink-0">
                      {formatCurrency(r.price)}
                    </span>
                    <DeletePriceRecord id={r.id} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {records.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId
              ? 'Nenhum preço registrado. Comece registrando o preço do combustível ou do mercado!'
              : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
