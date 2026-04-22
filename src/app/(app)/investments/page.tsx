import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Investimentos' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import {
  NewInvestmentButton,
  EditInvestmentButton,
  UpdateValueButton,
  InvestmentMenuButton,
} from '@/components/features/investments/investment-actions'
import {
  TYPE_LABELS, TYPE_COLORS, REFERENCE_RATES,
  getTypeGroup, calcEstimatedYield,
  type InvestmentType,
} from '@/components/features/investments/investment-constants'
import { InvestmentExportButton } from '@/components/features/investments/investment-export-button'
import { TrendingUp, AlertCircle, CalendarClock, Archive } from 'lucide-react'

function pct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }
function days(d: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(d + 'T12:00:00').getTime()) / 86400000))
}
function formatDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function daysUntil(d: string) {
  return Math.ceil((new Date(d + 'T12:00:00').getTime() - Date.now()) / 86400000)
}

async function fetchMarketRates() {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/market-rates`, { next: { revalidate: 86400 } })
    if (res.ok) return await res.json()
  } catch {}
  return REFERENCE_RATES
}

export default async function InvestmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members').select('couple_id')
    .eq('user_id', user!.id).limit(1).maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const [invRes, goalsRes, rates] = await Promise.all([
    coupleId
      ? (supabase.from('investments') as any)
          .select('*, goals(name)')
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: false })
      : null,
    coupleId
      ? supabase.from('goals').select('id, name').eq('couple_id', coupleId)
      : null,
    fetchMarketRates(),
  ])

  const liveRates = { selic: rates?.selic ?? REFERENCE_RATES.selic, cdi: rates?.cdi ?? REFERENCE_RATES.cdi, ipca_12m: rates?.ipca_12m ?? REFERENCE_RATES.ipca_12m }
  const ratesSource: string = rates?.source ?? 'fallback'

  const all: any[] = invRes?.data ?? []
  const goals: { id: string; name: string }[] = (goalsRes?.data ?? []) as any[]
  const active = all.filter((i: any) => i.active)
  const archived = all.filter((i: any) => !i.active)

  function calcYieldLive(invested: number, rateType: string | null, rateValue: number | null, startDate: string) {
    if (!rateType || rateValue === null) return null
    const d = Math.max(1, Math.floor((Date.now() - new Date(startDate + 'T12:00:00').getTime()) / 86400000))
    let annualRate = 0
    if (rateType === 'pct_cdi') annualRate = (rateValue / 100) * (liveRates.cdi / 100)
    else if (rateType === 'selic') annualRate = (rateValue / 100) * (liveRates.selic / 100)
    else if (rateType === 'fixed') annualRate = rateValue / 100
    else if (rateType === 'ipca_plus') annualRate = (liveRates.ipca_12m + rateValue) / 100
    else return null
    return Math.max(0, invested * (Math.pow(1 + annualRate, d / 365) - 1))
  }

  // ── Totais ────────────────────────────────────────────────────────────────
  const totalInvested = active.reduce((s: number, i: any) => s + Number(i.invested_amount), 0)

  const totalCurrent = active.reduce((s: number, i: any) => {
    if (i.current_value != null) return s + Number(i.current_value)
    const est = calcYieldLive(Number(i.invested_amount), i.rate_type, i.rate_value, i.start_date)
    return s + Number(i.invested_amount) + (est ?? 0)
  }, 0)

  const totalYield = totalCurrent - totalInvested
  const totalYieldPct = totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0

  // rendimento mensal estimado (renda fixa)
  const monthlyEst = active.reduce((s: number, i: any) => {
    if (!i.rate_type || i.rate_type === 'other') return s
    let annualRate = 0
    const rv = Number(i.rate_value ?? 0)
    if (i.rate_type === 'pct_cdi') annualRate = (rv / 100) * (liveRates.cdi / 100)
    else if (i.rate_type === 'selic') annualRate = (rv / 100) * (liveRates.selic / 100)
    else if (i.rate_type === 'fixed') annualRate = rv / 100
    else if (i.rate_type === 'ipca_plus') annualRate = (liveRates.ipca_12m + rv) / 100
    const monthly = Number(i.invested_amount) * (Math.pow(1 + annualRate, 1 / 12) - 1)
    return s + monthly
  }, 0)

  // ── Alocação por grupo ────────────────────────────────────────────────────
  const groupTotals: Record<string, number> = {}
  for (const inv of active) {
    const g = getTypeGroup(inv.type as InvestmentType)
    groupTotals[g] = (groupTotals[g] ?? 0) + Number(inv.invested_amount)
  }

  // ── Vencimentos próximos (≤ 60 dias) ─────────────────────────────────────
  const upcoming = active
    .filter((i: any) => i.maturity_date && daysUntil(i.maturity_date) <= 60 && daysUntil(i.maturity_date) >= 0)
    .sort((a: any, b: any) => a.maturity_date.localeCompare(b.maturity_date))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Investimentos" />

      <div className="p-4 md:p-6 space-y-6">

        {/* Header action */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-gray-500">
            {active.length} {active.length === 1 ? 'investimento ativo' : 'investimentos ativos'}
          </div>
          <div className="flex items-center gap-2">
            {active.length > 0 && (
              <InvestmentExportButton investments={active} typeLabels={TYPE_LABELS} />
            )}
            {coupleId && <NewInvestmentButton coupleId={coupleId} userId={user!.id} goals={goals} />}
          </div>
        </div>

        {/* ── Summary cards ───────────────────────────────────────────────── */}
        {active.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Total investido</p>
              <p className="text-xl font-bold text-gray-900 mt-1 financial-value">{formatCurrency(totalInvested)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Valor atual (est.)</p>
              <p className="text-xl font-bold text-gray-900 mt-1 financial-value">{formatCurrency(totalCurrent)}</p>
            </div>
            <div className={`rounded-xl border shadow-sm p-4 ${totalYield >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-xs text-gray-400 font-medium">Rendimento total</p>
              <p className={`text-xl font-bold mt-1 financial-value ${totalYield >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {totalYield >= 0 ? '+' : ''}{formatCurrency(totalYield)}
              </p>
              <p className={`text-xs font-medium ${totalYield >= 0 ? 'text-green-600' : 'text-red-500'}`}>{pct(totalYieldPct)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl shadow-sm p-4">
              <p className="text-xs text-gray-400 font-medium">Rendimento/mês (est.)</p>
              <p className="text-xl font-bold text-blue-700 mt-1 financial-value">{formatCurrency(monthlyEst)}</p>
              <p className="text-xs text-blue-400">renda fixa</p>
            </div>
          </div>
        )}

        {/* ── Taxas de referência ─────────────────────────────────────────── */}
        {active.length > 0 && (
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
            <span className="font-medium text-gray-600">Taxas {ratesSource === 'bcb' ? '(Banco Central)' : '(referência)'}:</span>
            <span><strong className="text-gray-700">SELIC</strong> {liveRates.selic.toFixed(2)}% a.a.</span>
            <span><strong className="text-gray-700">CDI</strong> {liveRates.cdi.toFixed(2)}% a.a.</span>
            <span><strong className="text-gray-700">IPCA 12m</strong> {liveRates.ipca_12m.toFixed(2)}%</span>
            {ratesSource === 'bcb' && <span className="text-green-600 ml-auto">● Dados em tempo real</span>}
          </div>
        )}

        {/* ── Alocação ────────────────────────────────────────────────────── */}
        {Object.keys(groupTotals).length > 1 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Alocação por categoria</h2>
            <div className="space-y-2.5">
              {Object.entries(groupTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([group, amount]) => {
                  const pctVal = totalInvested > 0 ? (amount / totalInvested) * 100 : 0
                  const color = TYPE_COLORS[group] ?? '#6b7280'
                  return (
                    <div key={group}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-sm text-gray-700">{group}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">{pctVal.toFixed(1)}%</span>
                          <span className="text-sm font-semibold text-gray-900 financial-value">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pctVal}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* ── Vencimentos próximos ─────────────────────────────────────────── */}
        {upcoming.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-800">Vencimentos nos próximos 60 dias</h2>
            </div>
            <div className="space-y-2">
              {upcoming.map((inv: any) => {
                const du = daysUntil(inv.maturity_date)
                return (
                  <div key={inv.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                      <p className="text-xs text-gray-400">{TYPE_LABELS[inv.type as InvestmentType]} · {inv.institution}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 financial-value">{formatCurrency(inv.invested_amount)}</p>
                      <p className={`text-xs font-medium ${du <= 15 ? 'text-red-600' : 'text-amber-600'}`}>
                        {du === 0 ? 'Vence hoje' : `${du} dias (${formatDate(inv.maturity_date)})`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Lista de investimentos ───────────────────────────────────────── */}
        {active.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Carteira</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {active.map((inv: any) => {
                const group = getTypeGroup(inv.type as InvestmentType)
                const color = TYPE_COLORS[group] ?? '#6b7280'
                const invested = Number(inv.invested_amount)

                const estYield = calcYieldLive(invested, inv.rate_type, inv.rate_value, inv.start_date)
                const currentVal = inv.current_value != null
                  ? Number(inv.current_value)
                  : invested + (estYield ?? 0)
                const yieldAmt = currentVal - invested
                const yieldPct = invested > 0 ? (yieldAmt / invested) * 100 : 0
                const isEstimated = inv.current_value == null
                const daysOld = days(inv.start_date)
                const du = inv.maturity_date ? daysUntil(inv.maturity_date) : null

                return (
                  <div key={inv.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Color dot */}
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 text-sm">{inv.name}</span>
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                {TYPE_LABELS[inv.type as InvestmentType]}
                              </span>
                              {isEstimated && (
                                <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">est.</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-gray-400">
                              {inv.institution && <span>{inv.institution}</span>}
                              {inv.rate_type && inv.rate_value != null && (
                                <span>
                                  {inv.rate_type === 'pct_cdi' && `${inv.rate_value}% CDI`}
                                  {inv.rate_type === 'selic' && `${inv.rate_value}% SELIC`}
                                  {inv.rate_type === 'fixed' && `${inv.rate_value}% a.a.`}
                                  {inv.rate_type === 'ipca_plus' && `IPCA+${inv.rate_value}%`}
                                </span>
                              )}
                              {inv.liquidity && <span>· {inv.liquidity}</span>}
                              {daysOld > 0 && <span>· {daysOld} dias</span>}
                              {inv.goals?.name && <span>· Meta: {inv.goals.name}</span>}
                            </div>
                          </div>

                          {/* Valores */}
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-gray-900 financial-value">{formatCurrency(currentVal)}</p>
                            <p className="text-xs text-gray-400 financial-value">invest. {formatCurrency(invested)}</p>
                            <p className={`text-xs font-semibold ${yieldAmt >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {yieldAmt >= 0 ? '+' : ''}{formatCurrency(yieldAmt)} ({pct(yieldPct)})
                            </p>
                          </div>
                        </div>

                        {/* Vencimento e barra */}
                        {inv.maturity_date && (
                          <div className="mt-1.5">
                            {du !== null && du >= 0 && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary-400"
                                    style={{ width: `${Math.min(100, (daysOld / (daysOld + du)) * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-400 shrink-0">
                                  vence em {formatDate(inv.maturity_date)}
                                </span>
                              </div>
                            )}
                            {du !== null && du < 0 && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Vencido em {formatDate(inv.maturity_date)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Notas */}
                        {inv.notes && (
                          <p className="text-xs text-gray-400 mt-1 truncate">{inv.notes}</p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <UpdateValueButton id={inv.id} currentValue={inv.current_value} />
                        <EditInvestmentButton investment={inv} goals={goals} />
                        <InvestmentMenuButton id={inv.id} active={true} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Arquivados ───────────────────────────────────────────────────── */}
        {archived.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5" /> Arquivados ({archived.length})
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
              {archived.map((inv: any) => (
                <div key={inv.id} className="flex items-center gap-3 px-4 py-3 opacity-60">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-500">{inv.name}</span>
                    <span className="text-xs text-gray-400 ml-2">{TYPE_LABELS[inv.type as InvestmentType]}</span>
                    {inv.institution && <span className="text-xs text-gray-300 ml-2">{inv.institution}</span>}
                    <span className="text-xs text-gray-400 ml-2 financial-value">{formatCurrency(inv.invested_amount)}</span>
                  </div>
                  <InvestmentMenuButton id={inv.id} active={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────────────────────── */}
        {all.length === 0 && (
          <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
            <TrendingUp className="w-10 h-10 text-gray-200" />
            {coupleId
              ? <>
                  <p>Nenhum investimento cadastrado ainda.</p>
                  <p className="text-xs">Registre seus CDBs, Tesouro Direto, ações e muito mais.</p>
                </>
              : 'Crie um casal em Configurações para começar.'}
          </div>
        )}

      </div>
    </div>
  )
}
