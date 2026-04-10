import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Busca o casal do usuário
  const { data: member } = await supabase
    .from('couple_members')
    .select('couple_id, couples(currency)')
    .eq('user_id', user!.id)
    .single()

  // Saldos das contas
  const { data: balances } = member
    ? await supabase
        .from('account_balances')
        .select('*')
    : { data: [] }

  const totalBalance = (balances ?? []).reduce((acc, b) => acc + b.balance, 0)

  // Gastos do mês atual
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const { data: monthlyExpenses } = member
    ? await supabase
        .from('transactions')
        .select('amount')
        .eq('couple_id', member.couple_id)
        .eq('type', 'expense')
        .gte('competence_date', monthStart)
        .is('deleted_at', null)
    : { data: [] }

  const totalExpenses = (monthlyExpenses ?? []).reduce(
    (acc, t) => acc + t.amount,
    0
  )

  // Orçamento do mês
  const { data: monthlyBudgets } = member
    ? await supabase
        .from('budgets')
        .select('amount')
        .eq('couple_id', member.couple_id)
        .eq('month', monthStart)
    : { data: [] }

  const totalBudget = (monthlyBudgets ?? []).reduce(
    (acc, b) => acc + b.amount,
    0
  )

  const available = totalBudget - totalExpenses
  const currency = (member?.couples as { currency?: string } | null)?.currency ?? 'BRL'

  return (
    <div className="flex flex-col flex-1">
      <Header title="Dashboard" />

      <div className="p-6 space-y-6">
        {/* Cards de resumo */}
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

        {member ? null : (
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
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color].split(' ')[1]}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
  )
}
