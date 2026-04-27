export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Patrimônio Líquido' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { SaveNetworthSnapshot } from '@/components/features/accounts/save-networth-snapshot'

export default async function NetWorthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()
  const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = monthParam.split('-').map(Number)
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const prevDate = new Date(year, month - 2, 1)
  const nextDate = new Date(year, month, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)

  const [accountsRes, balancesRes, goalsRes, snapshotsRes, vehiclesRes, propertiesRes] = await Promise.all([
    coupleId
      ? supabase.from('accounts').select('id, name, type, limit_amount').eq('couple_id', coupleId).is('deleted_at', null).order('sort_order').order('created_at')
      : Promise.resolve(null),
    coupleId
      ? supabase.from('account_balances').select('*').eq('couple_id', coupleId)
      : Promise.resolve(null),
    coupleId
      ? supabase.from('goals').select('id, name, current_amount, target_amount').eq('couple_id', coupleId)
      : Promise.resolve(null),
    coupleId
      ? supabase.from('networth_snapshots').select('*').eq('couple_id', coupleId).order('month', { ascending: true }).limit(12)
      : Promise.resolve(null),
    coupleId
      ? (supabase as any).from('vehicles').select('id, name, make, model, year, current_value').eq('couple_id', coupleId).eq('active', true).not('current_value', 'is', null)
      : Promise.resolve(null),
    coupleId
      ? (supabase as any).from('properties').select('id, name, type, current_value').eq('couple_id', coupleId).eq('active', true).not('current_value', 'is', null)
      : Promise.resolve(null),
  ])

  const accounts: any[] = accountsRes?.data ?? []
  const balances: any[] = balancesRes?.data ?? []
  const goals: any[] = goalsRes?.data ?? []
  const snapshots: any[] = snapshotsRes?.data ?? []
  const vehiclesWithValue: any[] = vehiclesRes?.data ?? []
  const propertiesWithValue: any[] = propertiesRes?.data ?? []
  const balanceMap = new Map(balances.map((b) => [b.id, b.balance]))

  // Assets: positive-balance accounts
  const assets = accounts
    .filter((a) => a.type !== 'credit_card')
    .map((a) => ({ ...a, balance: balanceMap.get(a.id) ?? 0 }))
    .filter((a) => a.balance >= 0)

  // Liabilities: credit cards (negative balance = debt) + negative accounts
  const creditCards = accounts
    .filter((a) => a.type === 'credit_card')
    .map((a) => ({ ...a, balance: balanceMap.get(a.id) ?? 0 }))

  const negativeAccounts = accounts
    .filter((a) => a.type !== 'credit_card' && (balanceMap.get(a.id) ?? 0) < 0)
    .map((a) => ({ ...a, balance: balanceMap.get(a.id) ?? 0 }))

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
  const totalCCDebt = creditCards.reduce((s, a) => s + Math.max(0, -(a.balance)), 0)
  const totalNegative = negativeAccounts.reduce((s, a) => s + Math.abs(a.balance), 0)
  const totalLiabilities = totalCCDebt + totalNegative
  const totalVehiclesValue = vehiclesWithValue.reduce((s: number, v: any) => s + (v.current_value ?? 0), 0)
  const totalPropertiesValue = propertiesWithValue.reduce((s: number, p: any) => s + (p.current_value ?? 0), 0)
  const totalRealAssets = totalVehiclesValue + totalPropertiesValue
  const netWorth = totalAssets + totalRealAssets - totalLiabilities
  const totalGoalsSaved = goals.reduce((s: number, g: any) => s + g.current_amount, 0)

  // Last 6 months placeholder history (static view of current networth)
  const history: { label: string; value: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    history.push({
      label: d.toLocaleDateString('pt-BR', { month: 'short' }),
      value: i === 0 ? netWorth : 0, // only current month is accurate
    })
  }
  const maxAbs = Math.max(...history.map((h) => Math.abs(h.value)), 1)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Patrimônio Líquido" />

      <div className="p-4 md:p-6 space-y-4">
        {/* Month nav + snapshot */}
        <div className="flex items-center justify-between">
          <Link href={`/networth?month=${prevMonth}`} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-base font-semibold text-gray-900 capitalize">{monthLabel}</h2>
          <Link href={`/networth?month=${nextMonth}`} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Save snapshot button */}
        {coupleId && (
          <div className="flex justify-end">
            <SaveNetworthSnapshot
              coupleId={coupleId}
              assets={totalAssets}
              liabilities={totalLiabilities}
              netWorth={netWorth}
              month={monthStart}
            />
          </div>
        )}

        {/* Historical chart */}
        {snapshots.length > 1 && (() => {
          const maxAbs2 = Math.max(...snapshots.map((s: any) => Math.abs(s.net_worth)), 1)
          return (
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Evolução do patrimônio</h3>
              <div className="flex items-end gap-2 h-24">
                {snapshots.map((s: any) => {
                  const pct = (Math.abs(s.net_worth) / maxAbs2) * 100
                  const label = new Date(s.month + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                  return (
                    <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t-sm transition-all ${s.net_worth >= 0 ? 'bg-primary-500' : 'bg-red-400'}`}
                        style={{ height: `${pct}%`, minHeight: '3px' }}
                        title={formatCurrency(s.net_worth)}
                      />
                      <span className="text-xs text-gray-400 capitalize truncate w-full text-center">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Net Worth hero */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm text-center">
          <p className="text-sm text-gray-500 mb-1">Patrimônio Líquido</p>
          <p className={`text-4xl font-bold financial-value ${netWorth >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
            {formatCurrency(netWorth)}
          </p>
          <p className="text-xs text-gray-400 mt-2">Ativos − Passivos</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Ativos</p>
            <p className="text-lg font-bold text-green-600 mt-1 financial-value">{formatCurrency(totalAssets)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Passivos</p>
            <p className="text-lg font-bold text-red-600 mt-1 financial-value">{formatCurrency(totalLiabilities)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Metas (poupado)</p>
            <p className="text-lg font-bold text-blue-600 mt-1 financial-value">{formatCurrency(totalGoalsSaved)}</p>
          </div>
        </div>

        {/* Assets */}
        {assets.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Ativos</h3>
            <div className="space-y-2">
              {assets.map((a) => (
                <div key={a.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{a.name}</span>
                  <span className="text-sm font-semibold text-gray-900 financial-value">{formatCurrency(a.balance)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <span className="text-sm font-bold text-green-600 financial-value">{formatCurrency(totalAssets)}</span>
            </div>
          </div>
        )}

        {/* Real Assets (vehicles + properties) */}
        {totalRealAssets > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Ativos Reais</h3>
            <div className="space-y-2">
              {propertiesWithValue.map((p: any) => (
                <div key={p.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{p.name} <span className="text-xs text-gray-400">(imóvel)</span></span>
                  <span className="text-sm font-semibold text-gray-900 financial-value">{formatCurrency(p.current_value)}</span>
                </div>
              ))}
              {vehiclesWithValue.map((v: any) => (
                <div key={v.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    {v.name}
                    {(v.make || v.model) && <span className="text-xs text-gray-400 ml-1">({[v.make, v.model].filter(Boolean).join(' ')})</span>}
                    <span className="text-xs text-gray-400 ml-1">(veículo)</span>
                  </span>
                  <span className="text-sm font-semibold text-gray-900 financial-value">{formatCurrency(v.current_value)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <span className="text-sm font-bold text-green-600 financial-value">{formatCurrency(totalRealAssets)}</span>
            </div>
          </div>
        )}

        {/* Liabilities */}
        {(creditCards.length > 0 || negativeAccounts.length > 0) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Passivos</h3>
            <div className="space-y-2">
              {creditCards.map((a) => {
                const debt = Math.max(0, -(a.balance))
                return (
                  <div key={a.id} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{a.name} <span className="text-xs text-gray-400">(cartão)</span></span>
                    <span className="text-sm font-semibold text-red-600 financial-value">{formatCurrency(debt)}</span>
                  </div>
                )
              })}
              {negativeAccounts.map((a) => (
                <div key={a.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{a.name}</span>
                  <span className="text-sm font-semibold text-red-600 financial-value">{formatCurrency(Math.abs(a.balance))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
              <span className="text-sm font-semibold text-gray-600">Total</span>
              <span className="text-sm font-bold text-red-600 financial-value">{formatCurrency(totalLiabilities)}</span>
            </div>
          </div>
        )}

        {/* Goals progress */}
        {goals.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Metas de poupança</h3>
            <div className="space-y-3">
              {goals.map((g: any) => {
                const pct = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{g.name}</span>
                      <span className="text-gray-500 financial-value">
                        {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!coupleId && (
          <div className="text-center py-16 text-gray-400">
            Crie um casal em Configurações para começar.
          </div>
        )}
      </div>
    </div>
  )
}
