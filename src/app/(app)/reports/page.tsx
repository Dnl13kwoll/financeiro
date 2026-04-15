export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { ExportButtons } from '@/components/features/reports/export-buttons'
import { MonthFilter } from '@/components/features/reports/month-filter'
import { ReportViewToggle } from '@/components/features/reports/report-view-toggle'
import { YearFilter } from '@/components/features/reports/year-filter'
import { AnnualExportButtons } from '@/components/features/reports/annual-export-buttons'
import { SvgPieChart } from '@/components/features/reports/svg-pie-chart'
import { CompareMonthsPicker } from '@/components/features/reports/compare-months-picker'
import { PrintReportButton } from '@/components/features/reports/print-report-button'
import { Suspense } from 'react'

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTH_LABELS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; year?: string; monthA?: string; monthB?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const view = params.view === 'annual' ? 'annual' : params.view === 'compare' ? 'compare' : 'monthly'
  const now = new Date()

  // ── ANNUAL VIEW ──────────────────────────────────────────────────────────────
  if (view === 'annual') {
    const year = parseInt(params.year ?? String(now.getFullYear()))
    const yearStart = `${year}-01-01`
    const yearEnd = `${year}-12-31`

    const annualRes = coupleId
      ? await supabase
          .from('transactions')
          .select('type, amount, competence_date, categories(name)')
          .eq('couple_id', coupleId)
          .gte('competence_date', yearStart)
          .lte('competence_date', yearEnd)
          .is('deleted_at', null)
      : null
    const annualTx: any[] = annualRes?.data ?? []

    // Per-month totals
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      label: MONTH_NAMES[i],
      income: 0,
      expense: 0,
    }))
    annualTx.forEach(t => {
      const m = parseInt(t.competence_date.slice(5, 7)) - 1
      if (t.type === 'income') monthlyData[m].income += t.amount
      else if (t.type === 'expense') monthlyData[m].expense += t.amount
    })

    const totalAnnualIncome = annualTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalAnnualExpense = annualTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // Per-category totals
    const catMap = new Map<string, number>()
    annualTx.filter(t => t.type === 'expense').forEach(t => {
      const name = (t.categories as any)?.name ?? 'Sem categoria'
      catMap.set(name, (catMap.get(name) ?? 0) + t.amount)
    })
    const catSummary = Array.from(catMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)

    const maxBar = Math.max(...monthlyData.map(m => Math.max(m.income, m.expense)), 1)

    return (
      <div className="flex flex-col flex-1">
        <Header title="Relatórios" />
        <div className="p-4 md:p-6 space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Suspense><ReportViewToggle view={view} /></Suspense>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Ano:</label>
                <Suspense><YearFilter value={year} /></Suspense>
              </div>
            </div>
            {coupleId && (
              <div className="flex gap-2">
                <AnnualExportButtons
                  year={year}
                  monthlyData={monthlyData}
                  categorySummary={catSummary}
                  totalIncome={totalAnnualIncome}
                  totalExpense={totalAnnualExpense}
                />
                <PrintReportButton label={`Anual ${year}`} />
              </div>
            )}
          </div>

          {/* Resumo anual */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500">Receitas {year}</p>
              <p className="text-xl font-bold text-green-600 mt-1 financial-value">{formatCurrency(totalAnnualIncome)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500">Despesas {year}</p>
              <p className="text-xl font-bold text-red-600 mt-1 financial-value">{formatCurrency(totalAnnualExpense)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-500">Saldo {year}</p>
              <p className={`text-xl font-bold mt-1 financial-value ${totalAnnualIncome - totalAnnualExpense >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                {formatCurrency(totalAnnualIncome - totalAnnualExpense)}
              </p>
            </div>
          </div>

          {/* Gráfico 12 meses */}
          {coupleId && (
            <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-5">Receitas × Despesas — {year}</h3>
              <div className="flex items-end gap-1 md:gap-2" style={{ height: '120px' }}>
                {monthlyData.map((m, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '96px' }}>
                      <div
                        className="flex-1 bg-green-400 rounded-t-sm"
                        style={{ height: `${(m.income / maxBar) * 100}%`, minHeight: m.income > 0 ? '3px' : '0' }}
                        title={`Receita: ${formatCurrency(m.income)}`}
                      />
                      <div
                        className="flex-1 bg-red-400 rounded-t-sm"
                        style={{ height: `${(m.expense / maxBar) * 100}%`, minHeight: m.expense > 0 ? '3px' : '0' }}
                        title={`Despesa: ${formatCurrency(m.expense)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{m.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-green-400 inline-block" />Receitas</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />Despesas</span>
              </div>
            </section>
          )}

          {/* Por mês detalhe */}
          {coupleId && (
            <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Detalhe por mês</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-left">
                      <th className="pb-2 font-medium">Mês</th>
                      <th className="pb-2 font-medium text-right">Receitas</th>
                      <th className="pb-2 font-medium text-right">Despesas</th>
                      <th className="pb-2 font-medium text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((m, i) => {
                      const balance = m.income - m.expense
                      return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-gray-700">{MONTH_LABELS[i]}</td>
                          <td className="py-2 text-right text-green-600 financial-value">{m.income > 0 ? formatCurrency(m.income) : '—'}</td>
                          <td className="py-2 text-right text-red-600 financial-value">{m.expense > 0 ? formatCurrency(m.expense) : '—'}</td>
                          <td className={`py-2 text-right font-medium financial-value ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {m.income === 0 && m.expense === 0 ? '—' : formatCurrency(balance)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Por categoria no ano */}
          {catSummary.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Despesas por categoria — {year}</h3>
              <div className="space-y-3">
                {catSummary.map(c => (
                  <div key={c.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{c.name}</span>
                      <span className="font-medium text-gray-900 financial-value">{formatCurrency(c.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-primary-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (c.total / totalAnnualExpense) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!coupleId && (
            <div className="text-center py-16 text-gray-400">Crie um casal em Configurações para começar.</div>
          )}
        </div>
      </div>
    )
  }

  // ── COMPARE VIEW ─────────────────────────────────────────────────────────────
  if (view === 'compare') {
    const defaultMonthA = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const defaultMonthB = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

    const monthA = (params as any).monthA ?? defaultMonthA
    const monthB = (params as any).monthB ?? defaultMonthB

    const [yearA, mA] = monthA.split('-').map(Number)
    const [yearB, mB] = monthB.split('-').map(Number)
    const startA = new Date(yearA, mA - 1, 1).toISOString().slice(0, 10)
    const endA = new Date(yearA, mA, 0).toISOString().slice(0, 10)
    const startB = new Date(yearB, mB - 1, 1).toISOString().slice(0, 10)
    const endB = new Date(yearB, mB, 0).toISOString().slice(0, 10)

    const [resA, resB] = await Promise.all([
      coupleId
        ? supabase.from('transactions').select('type, amount, categories(name)').eq('couple_id', coupleId).gte('competence_date', startA).lte('competence_date', endA).is('deleted_at', null)
        : Promise.resolve(null),
      coupleId
        ? supabase.from('transactions').select('type, amount, categories(name)').eq('couple_id', coupleId).gte('competence_date', startB).lte('competence_date', endB).is('deleted_at', null)
        : Promise.resolve(null),
    ])
    const txA: any[] = resA?.data ?? []
    const txB: any[] = resB?.data ?? []

    const incomeA = txA.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenseA = txA.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const incomeB = txB.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenseB = txB.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // Category breakdown for both months
    const catA = new Map<string, number>()
    txA.filter(t => t.type === 'expense').forEach(t => {
      const n = (t.categories as any)?.name ?? 'Sem categoria'
      catA.set(n, (catA.get(n) ?? 0) + t.amount)
    })
    const catB = new Map<string, number>()
    txB.filter(t => t.type === 'expense').forEach(t => {
      const n = (t.categories as any)?.name ?? 'Sem categoria'
      catB.set(n, (catB.get(n) ?? 0) + t.amount)
    })

    // All category names from both months
    const allCats = Array.from(new Set([...catA.keys(), ...catB.keys()])).sort()

    const labelA = `${MONTH_LABELS[mA - 1]} ${yearA}`
    const labelB = `${MONTH_LABELS[mB - 1]} ${yearB}`

    return (
      <div className="flex flex-col flex-1">
        <Header title="Relatórios" />
        <div className="p-4 md:p-6 space-y-6 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3">
            <Suspense><ReportViewToggle view={view} /></Suspense>
            <Suspense><CompareMonthsPicker monthA={monthA} monthB={monthB} /></Suspense>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: labelA, income: incomeA, expense: expenseA },
              { label: labelB, income: incomeB, expense: expenseB },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3">
                <p className="text-sm font-semibold text-gray-700">{m.label}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Receitas</span>
                  <span className="font-medium text-green-600 financial-value">{formatCurrency(m.income)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Despesas</span>
                  <span className="font-medium text-red-600 financial-value">{formatCurrency(m.expense)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-50 pt-2">
                  <span className="text-gray-700 font-medium">Saldo</span>
                  <span className={`font-bold financial-value ${m.income - m.expense >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                    {formatCurrency(m.income - m.expense)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Category comparison table */}
          {allCats.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Despesas por categoria</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-left">
                      <th className="pb-2 font-medium">Categoria</th>
                      <th className="pb-2 font-medium text-right">{labelA}</th>
                      <th className="pb-2 font-medium text-right">{labelB}</th>
                      <th className="pb-2 font-medium text-right">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCats.map(cat => {
                      const a = catA.get(cat) ?? 0
                      const b = catB.get(cat) ?? 0
                      const diff = a - b
                      const pct = b > 0 ? Math.round(((a - b) / b) * 100) : null
                      return (
                        <tr key={cat} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2 text-gray-700">{cat}</td>
                          <td className="py-2 text-right financial-value">{a > 0 ? formatCurrency(a) : '—'}</td>
                          <td className="py-2 text-right financial-value">{b > 0 ? formatCurrency(b) : '—'}</td>
                          <td className={`py-2 text-right font-medium ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {diff !== 0 ? (
                              <>
                                {diff > 0 ? '+' : ''}{formatCurrency(diff)}
                                {pct !== null && <span className="text-xs ml-1">({pct > 0 ? '+' : ''}{pct}%)</span>}
                              </>
                            ) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!coupleId && (
            <div className="text-center py-16 text-gray-400">Crie um casal em Configurações para começar.</div>
          )}
        </div>
      </div>
    )
  }

  // ── MONTHLY VIEW ─────────────────────────────────────────────────────────────
  const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = monthParam.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)

  // Previous month dates for comparison
  const prevDate = new Date(year, month - 2, 1)
  const prevMonthStart = prevDate.toISOString().slice(0, 10)
  const prevMonthEnd = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).toISOString().slice(0, 10)

  // 6-month trend range (current month + 5 before)
  const trendStart = new Date(year, month - 6, 1).toISOString().slice(0, 10)

  const [transactionsRes, prevTransactionsRes, membersRes, trendRes] = await Promise.all([
    coupleId
      ? supabase.from('transactions').select('*, categories(name), accounts(name)').eq('couple_id', coupleId).gte('competence_date', monthStart).lte('competence_date', monthEnd).is('deleted_at', null).order('date', { ascending: false })
      : Promise.resolve(null),
    coupleId
      ? supabase.from('transactions').select('type, amount').eq('couple_id', coupleId).gte('competence_date', prevMonthStart).lte('competence_date', prevMonthEnd).is('deleted_at', null)
      : Promise.resolve(null),
    coupleId
      ? supabase.from('couple_members').select('user_id, profiles(name, email)').eq('couple_id', coupleId)
      : Promise.resolve(null),
    coupleId
      ? supabase.from('transactions').select('type, amount, competence_date, categories(name)').eq('couple_id', coupleId).gte('competence_date', trendStart).lte('competence_date', monthEnd).is('deleted_at', null)
      : Promise.resolve(null),
  ])
  const transactions: any[] = transactionsRes?.data ?? []
  const prevTransactions: any[] = prevTransactionsRes?.data ?? []
  const members: any[] = membersRes?.data ?? []
  const trendTx: any[] = trendRes?.data ?? []

  // Build 6-month trend labels (oldest → current)
  const trendMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 6 + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MONTH_NAMES[d.getMonth()],
    }
  })

  // Top categories in current month for trend
  const catTotalsMap = new Map<string, number>()
  transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
    const n: string = (t.categories as any)?.name ?? 'Sem categoria'
    catTotalsMap.set(n, (catTotalsMap.get(n) ?? 0) + t.amount)
  })
  const topCats: string[] = Array.from(catTotalsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([n]) => n)

  // Per-category per-month totals (for trend chart)
  const trendData = topCats.map(cat => ({
    cat,
    values: trendMonths.map(({ key }) => {
      return trendTx
        .filter(t => t.type === 'expense' && t.competence_date?.slice(0, 7) === key && ((t.categories as any)?.name ?? 'Sem categoria') === cat)
        .reduce((s, t) => s + t.amount, 0)
    }),
  }))

  // Per-person breakdown
  const perPerson = members.map((m: any) => {
    const name = (m.profiles as any)?.name ?? (m.profiles as any)?.email ?? 'Membro'
    const myTx = transactions.filter((t: any) => t.user_id === m.user_id)
    return {
      name,
      income: myTx.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0),
      expense: myTx.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0),
    }
  })

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
  const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
  const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)

  function pctChange(curr: number, prev: number) {
    if (prev === 0) return null
    return Math.round(((curr - prev) / prev) * 100)
  }
  const incomePct = pctChange(totalIncome, prevIncome)
  const expensePct = pctChange(totalExpense, prevExpense)
  const balancePct = pctChange(totalIncome - totalExpense, prevIncome - prevExpense)

  const categoryMap = new Map<string, { name: string; total: number }>()
  transactions.filter(t => t.type === 'expense').forEach((t: any) => {
    const name = (t.categories as { name?: string } | null)?.name ?? 'Sem categoria'
    const existing = categoryMap.get(name) ?? { name, total: 0 }
    categoryMap.set(name, { ...existing, total: existing.total + t.amount })
  })
  const categorySummary = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total)

  // Tag summary
  const tagMap = new Map<string, number>()
  transactions.filter(t => t.type === 'expense').forEach((t: any) => {
    ;(t.tags ?? []).forEach((tag: string) => {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + t.amount)
    })
  })
  const tagSummary = Array.from(tagMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)

  const exportRows = transactions.map((t: any) => ({
    date: t.date,
    type: t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saída' : 'Transferência',
    description: t.description ?? '',
    category: (t.categories as { name?: string } | null)?.name ?? '',
    account: (t.accounts as { name?: string } | null)?.name ?? '',
    amount: t.amount,
  }))

  const monthLabel = `${MONTH_LABELS[month - 1]} ${year}`

  return (
    <div className="flex flex-col flex-1">
      <Header title="Relatórios" />
      <div className="p-4 md:p-6 space-y-6 max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Suspense><ReportViewToggle view={view} /></Suspense>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Mês:</label>
              <Suspense><MonthFilter value={monthParam} /></Suspense>
            </div>
          </div>
          {coupleId && (
            <div className="flex gap-2">
              <ExportButtons
                transactions={exportRows}
                categorySummary={categorySummary}
                month={monthLabel}
              />
              <PrintReportButton label={monthLabel} />
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">Receitas</p>
            <p className="text-xl font-bold text-green-600 mt-1 financial-value">{formatCurrency(totalIncome)}</p>
            {incomePct !== null && (
              <p className={`text-xs mt-1 ${incomePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {incomePct >= 0 ? '↑' : '↓'} {Math.abs(incomePct)}% vs mês anterior
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">Despesas</p>
            <p className="text-xl font-bold text-red-600 mt-1 financial-value">{formatCurrency(totalExpense)}</p>
            {expensePct !== null && (
              <p className={`text-xs mt-1 ${expensePct <= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {expensePct >= 0 ? '↑' : '↓'} {Math.abs(expensePct)}% vs mês anterior
              </p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs text-gray-500">Saldo</p>
            <p className={`text-xl font-bold mt-1 financial-value ${totalIncome - totalExpense >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
            {balancePct !== null && (
              <p className={`text-xs mt-1 ${balancePct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {balancePct >= 0 ? '↑' : '↓'} {Math.abs(balancePct)}% vs mês anterior
              </p>
            )}
          </div>
        </div>

        {/* Por categoria */}
        {categorySummary.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Despesas por categoria</h3>
            <div className="mb-5">
              <SvgPieChart data={categorySummary} total={totalExpense} />
            </div>
            <div className="space-y-3">
              {categorySummary.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{c.name}</span>
                    <span className="font-medium text-gray-900 financial-value">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (c.total / totalExpense) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Por pessoa */}
        {perPerson.length > 1 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Breakdown por membro</h3>
            <div className="grid grid-cols-2 gap-4">
              {perPerson.map((p) => (
                <div key={p.name} className="border border-gray-100 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-800 mb-3 truncate">{p.name}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Receitas</span>
                      <span className="font-medium text-green-600">{formatCurrency(p.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Despesas</span>
                      <span className="font-medium text-red-500">{formatCurrency(p.expense)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-50 pt-1.5">
                      <span className="text-gray-700 font-medium">Saldo</span>
                      <span className={`font-bold ${p.income - p.expense >= 0 ? 'text-primary-600' : 'text-red-600'}`}>
                        {formatCurrency(p.income - p.expense)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tendência por categoria (6 meses) */}
        {trendData.length > 0 && trendMonths.length > 1 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-5">Tendência de despesas — últimos 6 meses</h3>
            <div className="space-y-4">
              {trendData.map((row, ri) => {
                const maxVal = Math.max(...row.values, 1)
                const COLORS = ['bg-primary-500', 'bg-red-400', 'bg-amber-400', 'bg-blue-400']
                return (
                  <div key={row.cat}>
                    <p className="text-xs font-medium text-gray-600 mb-2">{row.cat}</p>
                    <div className="flex items-end gap-1" style={{ height: '56px' }}>
                      {row.values.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex items-end justify-center" style={{ height: '44px' }}>
                            <div
                              className={`w-full rounded-t-sm ${COLORS[ri % COLORS.length]}`}
                              style={{ height: `${(v / maxVal) * 100}%`, minHeight: v > 0 ? '3px' : '0' }}
                              title={`${row.cat}: ${formatCurrency(v)}`}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{trendMonths[i].label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Por tag */}
        {tagSummary.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4">Despesas por tag</h3>
            <div className="space-y-3">
              {tagSummary.map((t) => (
                <div key={t.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full">{t.name}</span>
                    </span>
                    <span className="font-medium text-gray-900 financial-value">{formatCurrency(t.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary-400 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (t.total / totalExpense) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!coupleId && (
          <div className="text-center py-16 text-gray-400">Crie um casal em Configurações para começar.</div>
        )}
        {coupleId && transactions.length === 0 && (
          <div className="text-center py-16 text-gray-400">Nenhuma transação neste mês.</div>
        )}
      </div>
    </div>
  )
}
