export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Insights' }
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Award, AlertTriangle, ThumbsUp, Lightbulb, Star } from 'lucide-react'

function monthLabel(offset: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function monthRange(offset: number): [string, string] {
  const d = new Date()
  d.setMonth(d.getMonth() + offset)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, d.getMonth() + 1, 0).getDate()
  return [`${y}-${m}-01`, `${y}-${m}-${last}`]
}

interface Insight {
  type: 'good' | 'warning' | 'info' | 'record'
  icon: 'trending-up' | 'trending-down' | 'award' | 'alert' | 'thumbs-up' | 'lightbulb' | 'star'
  title: string
  detail: string
}

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null
  if (!coupleId) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Análise" />
        <PageTabs tabs={[
          { href: '/reports', label: 'Relatórios' },
          { href: '/insights', label: 'Insights' },
          { href: '/projection', label: 'Projeção' },
          { href: '/planning', label: 'Planejamento' },
          { href: '/networth', label: 'Patrimônio' },
          { href: '/timeline', label: 'Linha do Tempo' },
        ]} />
        <div className="p-6 text-center text-gray-400 py-16">Crie um casal em Configurações para ver insights.</div>
      </div>
    )
  }

  // Fetch last 6 months of transactions
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const { data: txRaw, error: txError } = await supabase.from('transactions')
    .select('amount, type, category_id, date, description, categories(name)')
    .eq('couple_id', coupleId)
    .gte('date', sixMonthsAgo.toISOString().slice(0, 10))
    .order('date')

  const transactions: any[] = txRaw ?? []

  // ── Helper: group by month ────────────────────────────────────────────────
  function byMonth(txs: any[], type: string) {
    const map: Record<string, number> = {}
    for (const t of txs) {
      if (t.type !== type) continue
      const key = t.date.slice(0, 7)
      map[key] = (map[key] ?? 0) + Number(t.amount)
    }
    return map
  }

  const incomeByMonth = byMonth(transactions, 'income')
  const expenseByMonth = byMonth(transactions, 'expense')
  const months = Array.from(new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])).sort()

  const currentMonth = new Date().toISOString().slice(0, 7)
  const prevMonth = (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7) })()

  const curIncome = incomeByMonth[currentMonth] ?? 0
  const curExpense = expenseByMonth[currentMonth] ?? 0
  const prevIncome = incomeByMonth[prevMonth] ?? 0
  const prevExpense = expenseByMonth[prevMonth] ?? 0

  // Savings rate
  const curSavings = curIncome - curExpense
  const curRate = curIncome > 0 ? (curSavings / curIncome) * 100 : 0
  const prevRate = prevIncome > 0 ? ((prevIncome - prevExpense) / prevIncome) * 100 : 0

  // Category breakdown this month vs last
  const catThisMonth: Record<string, number> = {}
  const catLastMonth: Record<string, number> = {}
  const catNames: Record<string, string> = {}
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    const catId = t.category_id ?? 'sem_categoria'
    const catName = (t.categories as any)?.name ?? 'Sem categoria'
    catNames[catId] = catName
    if (t.date.startsWith(currentMonth)) catThisMonth[catId] = (catThisMonth[catId] ?? 0) + Number(t.amount)
    if (t.date.startsWith(prevMonth)) catLastMonth[catId] = (catLastMonth[catId] ?? 0) + Number(t.amount)
  }

  // Top expense category this month
  const topCatEntry = Object.entries(catThisMonth).sort((a, b) => b[1] - a[1])[0]
  const topCatName = topCatEntry ? catNames[topCatEntry[0]] : null
  const topCatAmount = topCatEntry ? topCatEntry[1] : 0

  // Biggest month-over-month category increase
  let biggestIncrease = { cat: '', pct: 0, prev: 0, cur: 0 }
  for (const [catId, curAmt] of Object.entries(catThisMonth)) {
    const prevAmt = catLastMonth[catId] ?? 0
    if (prevAmt > 0) {
      const pct = ((curAmt - prevAmt) / prevAmt) * 100
      if (pct > biggestIncrease.pct) biggestIncrease = { cat: catNames[catId], pct, prev: prevAmt, cur: curAmt }
    }
  }

  // Best month (highest savings) in last 6 months
  let bestMonth = { key: '', savings: -Infinity }
  for (const m of months) {
    const s = (incomeByMonth[m] ?? 0) - (expenseByMonth[m] ?? 0)
    if (s > bestMonth.savings) bestMonth = { key: m, savings: s }
  }

  // Average monthly expense over last 3 months (excluding current)
  const last3 = months.filter(m => m < currentMonth).slice(-3)
  const avgExpense = last3.length > 0
    ? last3.reduce((s, m) => s + (expenseByMonth[m] ?? 0), 0) / last3.length
    : 0

  // Most frequent description (potential subscription)
  const descCount: Record<string, number> = {}
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    const key = t.description?.trim().toLowerCase()
    if (key && key.length > 3) descCount[key] = (descCount[key] ?? 0) + 1
  }
  const topDesc = Object.entries(descCount).sort((a, b) => b[1] - a[1])[0]

  // Spending streak: how many consecutive months expenses < income
  let streak = 0
  for (const m of [...months].reverse()) {
    const inc = incomeByMonth[m] ?? 0
    const exp = expenseByMonth[m] ?? 0
    if (inc > 0 && exp < inc) streak++
    else break
  }

  // ── Build insights array ──────────────────────────────────────────────────
  const insights: Insight[] = []

  // Expense vs last month
  if (prevExpense > 0 && curExpense > 0) {
    const diff = ((curExpense - prevExpense) / prevExpense) * 100
    if (diff > 10) {
      insights.push({
        type: 'warning',
        icon: 'trending-up',
        title: `Gastos ${diff.toFixed(0)}% acima do mês anterior`,
        detail: `${monthLabel(0)}: ${formatCurrency(curExpense)} vs ${formatCurrency(prevExpense)} em ${monthLabel(-1)}.`,
      })
    } else if (diff < -5) {
      insights.push({
        type: 'good',
        icon: 'trending-down',
        title: `Gastos ${Math.abs(diff).toFixed(0)}% menores que o mês anterior`,
        detail: `Você gastou ${formatCurrency(prevExpense - curExpense)} a menos em ${monthLabel(0)}.`,
      })
    }
  }

  // Savings rate comparison
  if (prevRate > 0) {
    if (curRate >= prevRate) {
      insights.push({
        type: 'good',
        icon: 'thumbs-up',
        title: `Taxa de poupança melhorou: ${curRate.toFixed(1)}%`,
        detail: `Mês passado era ${prevRate.toFixed(1)}%. Você economizou ${formatCurrency(curSavings)} este mês.`,
      })
    } else if (curRate < prevRate - 10) {
      insights.push({
        type: 'warning',
        icon: 'alert',
        title: `Taxa de poupança caiu para ${curRate.toFixed(1)}%`,
        detail: `Mês passado era ${prevRate.toFixed(1)}%. Revise os gastos variáveis.`,
      })
    }
  }

  // Top category
  if (topCatName && topCatAmount > 0) {
    const pct = curIncome > 0 ? (topCatAmount / curIncome) * 100 : 0
    insights.push({
      type: pct > 40 ? 'warning' : 'info',
      icon: 'lightbulb',
      title: `Maior gasto este mês: ${topCatName}`,
      detail: `${formatCurrency(topCatAmount)}${pct > 0 ? ` (${pct.toFixed(0)}% da receita)` : ''} em ${monthLabel(0)}.`,
    })
  }

  // Biggest category increase
  if (biggestIncrease.cat && biggestIncrease.pct > 20) {
    insights.push({
      type: 'warning',
      icon: 'trending-up',
      title: `${biggestIncrease.cat} subiu ${biggestIncrease.pct.toFixed(0)}% vs mês anterior`,
      detail: `${formatCurrency(biggestIncrease.prev)} → ${formatCurrency(biggestIncrease.cur)}.`,
    })
  }

  // Best month record
  if (bestMonth.key && bestMonth.savings > 0) {
    const label = new Date(bestMonth.key + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    insights.push({
      type: 'record',
      icon: 'award',
      title: `Melhor mês: ${label}`,
      detail: `Poupança de ${formatCurrency(bestMonth.savings)} — o maior resultado dos últimos 6 meses.`,
    })
  }

  // Above average expense warning
  if (avgExpense > 0 && curExpense > avgExpense * 1.15) {
    insights.push({
      type: 'warning',
      icon: 'alert',
      title: `Gastos ${((curExpense / avgExpense - 1) * 100).toFixed(0)}% acima da média dos últimos 3 meses`,
      detail: `Média: ${formatCurrency(avgExpense)} · Atual: ${formatCurrency(curExpense)}.`,
    })
  }

  // Positive streak
  if (streak >= 2) {
    insights.push({
      type: 'good',
      icon: 'star',
      title: `${streak} meses consecutivos no positivo!`,
      detail: `Parabéns — receita superior às despesas por ${streak} meses seguidos.`,
    })
  }

  // Frequent description (possible forgotten subscription)
  if (topDesc && topDesc[1] >= 3) {
    insights.push({
      type: 'info',
      icon: 'lightbulb',
      title: `"${topDesc[0]}" aparece ${topDesc[1]}x nos últimos 6 meses`,
      detail: 'Pode ser uma assinatura ou despesa recorrente ainda não cadastrada como recorrente.',
    })
  }

  // Monthly breakdown table (last 6 months)
  const monthSummaries = months.slice(-6).map(m => ({
    label: new Date(m + '-15').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    income: incomeByMonth[m] ?? 0,
    expense: expenseByMonth[m] ?? 0,
    savings: (incomeByMonth[m] ?? 0) - (expenseByMonth[m] ?? 0),
  }))

  const iconMap: Record<string, React.ReactNode> = {
    'trending-up': <TrendingUp className="w-4 h-4" />,
    'trending-down': <TrendingDown className="w-4 h-4" />,
    'award': <Award className="w-4 h-4" />,
    'alert': <AlertTriangle className="w-4 h-4" />,
    'thumbs-up': <ThumbsUp className="w-4 h-4" />,
    'lightbulb': <Lightbulb className="w-4 h-4" />,
    'star': <Star className="w-4 h-4" />,
  }

  const typeStyles: Record<string, { bg: string; text: string; border: string }> = {
    good:    { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-100' },
    warning: { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100' },
    info:    { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100'  },
    record:  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100' },
  }

  const maxExpense = Math.max(...monthSummaries.map(m => m.expense), 1)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Insights" />

      <div className="p-4 md:p-6 space-y-6">
        {txError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            Alguns dados não puderam ser carregados. Tente recarregar a página.
          </div>
        )}

        {/* Insights cards */}
        {insights.length > 0 ? (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Análises automáticas · {monthLabel(0)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights.map((ins, i) => {
                const s = typeStyles[ins.type]
                return (
                  <div key={i} className={`rounded-xl border p-4 ${s.bg} ${s.border}`}>
                    <div className={`flex items-start gap-3 ${s.text}`}>
                      <div className="mt-0.5 shrink-0">{iconMap[ins.icon]}</div>
                      <div>
                        <p className="font-semibold text-sm">{ins.title}</p>
                        <p className="text-xs mt-0.5 opacity-80">{ins.detail}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 text-sm">
            Ainda sem dados suficientes para gerar insights. Registre transações por pelo menos 2 meses.
          </div>
        )}

        {/* Monthly overview table */}
        {monthSummaries.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Visão mensal (6 meses)</h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 font-medium">Mês</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">Receita</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">Despesa</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-400 font-medium">Saldo</th>
                      <th className="px-4 py-2.5 w-28"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {monthSummaries.map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-700 font-medium capitalize">{m.label}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium financial-value">{formatCurrency(m.income)}</td>
                        <td className="px-4 py-3 text-right text-red-500 financial-value">{formatCurrency(m.expense)}</td>
                        <td className={`px-4 py-3 text-right font-semibold financial-value ${m.savings >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                          {m.savings >= 0 ? '+' : ''}{formatCurrency(m.savings)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${m.savings >= 0 ? 'bg-green-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min((m.expense / maxExpense) * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Category breakdown this month */}
        {Object.keys(catThisMonth).length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Gastos por categoria · {monthLabel(0)}
            </h2>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {Object.entries(catThisMonth)
                .sort((a, b) => b[1] - a[1])
                .map(([catId, amount]) => {
                  const prev = catLastMonth[catId] ?? 0
                  const diff = prev > 0 ? ((amount - prev) / prev) * 100 : null
                  const barPct = topCatAmount > 0 ? (amount / topCatAmount) * 100 : 0
                  return (
                    <div key={catId} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{catNames[catId]}</span>
                        <div className="flex items-center gap-3">
                          {diff !== null && (
                            <span className={`text-xs ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                            </span>
                          )}
                          <span className="text-sm font-semibold text-gray-900 financial-value">{formatCurrency(amount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-400 rounded-full" style={{ width: `${barPct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
