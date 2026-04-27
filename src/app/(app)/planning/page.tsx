import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Planejamento' }
import { Header } from '@/components/layout/header'
import { CopyPlanButton } from '@/components/features/planning/copy-plan-button'
import { AnnualPlanView } from '@/components/features/planning/annual-plan-view'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { PlanItemRow } from '@/components/features/planning/plan-item-row'
import { AddPlanItem } from '@/components/features/planning/add-plan-item'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EmergencyFundCalculator } from '@/components/features/planning/emergency-fund-calculator'
import { LoanSimulator } from '@/components/features/planning/loan-simulator'

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams
  const annualView = params.view === 'annual'

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
  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // Prev / next month
  const prevDate = new Date(year, month - 2, 1)
  const nextDate = new Date(year, month, 1)
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  const [plansRes, expensesRes, incomeRes, categoriesRes] = await Promise.all([
    coupleId
      ? supabase.from('monthly_plans').select('*').eq('couple_id', coupleId).eq('month', monthStart).order('label')
      : Promise.resolve(null),
    coupleId
      ? supabase.from('transactions').select('amount, category_id').eq('couple_id', coupleId).eq('type', 'expense').gte('competence_date', monthStart).lte('competence_date', monthEnd).is('deleted_at', null)
      : Promise.resolve(null),
    coupleId
      ? supabase.from('transactions').select('amount').eq('couple_id', coupleId).eq('type', 'income').gte('competence_date', monthStart).lte('competence_date', monthEnd).is('deleted_at', null)
      : Promise.resolve(null),
    supabase.from('categories').select('id, name').eq('type', 'expense').order('name'),
  ])

  const plans: any[] = plansRes?.data ?? []
  const expenses: any[] = expensesRes?.data ?? []
  const totalIncome = (incomeRes?.data ?? []).reduce((s: number, t: any) => s + t.amount, 0)
  const categories: { id: string; name: string }[] = (categoriesRes?.data ?? []) as any[]

  // Annual view: fetch all 12 months of the current year
  let annualMonths: { month: string; label: string; planned: number; spent: number; income: number }[] = []
  if (annualView && coupleId) {
    const yearMonths = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 1)
      return {
        month: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString('pt-BR', { month: 'short' }),
        monthEnd: new Date(year, i + 1, 0).toISOString().slice(0, 10),
      }
    })
    annualMonths = await Promise.all(yearMonths.map(async ({ month, label, monthEnd }) => {
      const [pRes, eRes, iRes] = await Promise.all([
        supabase.from('monthly_plans').select('planned_amount').eq('couple_id', coupleId).eq('month', month),
        supabase.from('transactions').select('amount').eq('couple_id', coupleId).eq('type', 'expense').gte('competence_date', month).lte('competence_date', monthEnd).is('deleted_at', null),
        supabase.from('transactions').select('amount').eq('couple_id', coupleId).eq('type', 'income').gte('competence_date', month).lte('competence_date', monthEnd).is('deleted_at', null),
      ])
      return {
        month,
        label,
        planned: (pRes.data ?? []).reduce((s: number, p: any) => s + p.planned_amount, 0),
        spent: (eRes.data ?? []).reduce((s: number, t: any) => s + t.amount, 0),
        income: (iRes.data ?? []).reduce((s: number, t: any) => s + t.amount, 0),
      }
    }))
  }

  // Map spent per category_id
  const spentByCat = new Map<string | null, number>()
  expenses.forEach((e: any) => {
    spentByCat.set(e.category_id, (spentByCat.get(e.category_id) ?? 0) + e.amount)
  })

  // Enrich plans with spent
  const enriched = plans.map((p: any) => ({
    ...p,
    spent: spentByCat.get(p.category_id) ?? 0,
  }))

  const totalPlanned = enriched.reduce((s, p) => s + p.planned_amount, 0)
  const totalSpent = enriched.reduce((s, p) => s + p.spent, 0)
  const unallocated = totalIncome - totalPlanned

  return (
    <div className="flex flex-col flex-1">
      <Header title="Planejamento Mensal" />

      <div className="p-4 md:p-6 space-y-4">
        {/* View toggle */}
        <div className="flex items-center justify-between">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <Link
              href={`/planning?month=${monthParam}`}
              className={`px-3 py-1.5 transition-colors ${!annualView ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Mensal
            </Link>
            <Link
              href={`/planning?view=annual&month=${monthParam}`}
              className={`px-3 py-1.5 transition-colors ${annualView ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Anual {year}
            </Link>
          </div>
        </div>

        {annualView ? (
          <AnnualPlanView year={year} months={annualMonths} />
        ) : (
        <>
        {/* Month nav */}
        <div className="flex items-center justify-between">
          <Link href={`/planning?month=${prevMonth}`} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-base font-semibold text-gray-900 capitalize">{monthLabel}</h2>
          <Link href={`/planning?month=${nextMonth}`} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Receita</p>
            <p className="text-lg font-bold text-green-600 mt-1 financial-value">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">Planejado</p>
            <p className="text-lg font-bold text-gray-900 mt-1 financial-value">{formatCurrency(totalPlanned)}</p>
          </div>
          <div className={`rounded-xl border p-4 shadow-sm ${unallocated < 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
            <p className="text-xs text-gray-500">Não alocado</p>
            <p className={`text-lg font-bold mt-1 financial-value ${unallocated < 0 ? 'text-red-600' : 'text-primary-600'}`}>
              {formatCurrency(unallocated)}
            </p>
          </div>
        </div>

        {/* Plans list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-sm">Categorias de gasto</h3>
            {coupleId && (
              <CopyPlanButton coupleId={coupleId} currentMonth={monthStart} prevMonth={new Date(year, month - 2, 1).toISOString().slice(0, 10)} />
            )}
            <span className="text-xs text-gray-400">
              Gasto total: <span className="font-medium text-gray-600 financial-value">{formatCurrency(totalSpent)}</span>
            </span>
          </div>

          {enriched.map((p) => (
            <PlanItemRow
              key={p.id}
              id={p.id}
              label={p.label}
              planned={p.planned_amount}
              spent={p.spent}
            />
          ))}

          {coupleId && (
            <div className="mt-2">
              <AddPlanItem coupleId={coupleId} month={monthStart} categories={categories} />
            </div>
          )}

          {enriched.length === 0 && coupleId && (
            <p className="text-sm text-gray-400 text-center py-6">
              Adicione categorias para planejar seus gastos deste mês.
            </p>
          )}
        </div>

        {!coupleId && (
          <div className="text-center py-16 text-gray-400">
            Crie um casal em Configurações para começar.
          </div>
        )}
        </>
        )}

        {/* Calculadoras financeiras */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Calculadoras</h2>
          <EmergencyFundCalculator
            avgMonthlyExpense={expenses.reduce((s: number, e: any) => s + e.amount, 0)}
            currentBalance={0}
          />
          <LoanSimulator />
        </div>
      </div>
    </div>
  )
}
