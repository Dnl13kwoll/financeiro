import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id, couples(currency)')
    .eq('user_id', user!.id)
    .single()

  const memberData = memberRes.data as any
  const coupleId: string | null = memberData?.couple_id ?? null
  const currency: string = memberData?.couples?.currency ?? 'BRL'

  const balancesRes = coupleId
    ? await supabase.from('account_balances').select('*')
    : null

  const balances: any[] = balancesRes?.data ?? []
  const totalBalance = balances.reduce((acc, b) => acc + b.balance, 0)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const expensesRes = coupleId
    ? await supabase
        .from('transactions')
        .select('amount')
        .eq('couple_id', coupleId)
        .eq('type', 'expense')
        .gte('competence_date', monthStart)
        .is('deleted_at', null)
    : null

  const monthlyExpenses: any[] = expensesRes?.data ?? []
  const totalExpenses = monthlyExpenses.reduce((acc, t) => acc + t.amount, 0)

  const budgetsRes = coupleId
    ? await supabase
        .from('budgets')
        .select('amount')
        .eq('couple_id', coupleId)
        .eq('month', monthStart)
    : null

  const monthlyBudgets: any[] = budgetsRes?.data ?? []
  const totalBudget = monthlyBudgets.reduce((acc, b) => acc + b.amount, 0)

  const available = totalBudget - totalExpenses

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Saldo Total"
            value={formatCurrency(totalBalance, currency)}
            description="Soma de todas as contas"
            color="green"
          />
          <SummaryCard
            title="Gastos do Mês"
            value={formatCurrency(totalExpenses, currency)}
            description="Mês atual"
            color="red"
          />
          <SummaryCard
            title="Orçamento"
            value={formatCurrency(totalBudget, currency)}
            description="Planejado para o mês"
            color="blue"
          />
          <SummaryCard
            title="Disponível"
            value={formatCurrency(available, currency)}
            description="Orçamento − Gastos"
            color={available >= 0 ? 'green' : 'red'}
          />
        </div>

        {!coupleId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800 font-medium">
              Você ainda não está vinculado a um casal.
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              Acesse Configurações para criar ou aceitar um convite.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  description,
  color,
}: {
  title: string
  value: string
  description: string
  color: 'green' | 'red' | 'blue'
}) {
  const colors = {
    green: 'text-green-700',
    red: 'text-red-700',
    blue: 'text-blue-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  )
}
