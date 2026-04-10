import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react'

const typeConfig: Record<
  Transaction['type'],
  { label: string; color: string; icon: React.ReactNode }
> = {
  income: {
    label: 'Entrada',
    color: 'text-green-600',
    icon: <ArrowUpCircle className="w-4 h-4 text-green-500" />,
  },
  expense: {
    label: 'Saída',
    color: 'text-red-600',
    icon: <ArrowDownCircle className="w-4 h-4 text-red-500" />,
  },
  transfer: {
    label: 'Transferência',
    color: 'text-blue-600',
    icon: <ArrowLeftRight className="w-4 h-4 text-blue-500" />,
  },
}

export default async function TransactionsPage({
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
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()
  const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = monthParam.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)

  const transactionsRes = coupleId
    ? await supabase
        .from('transactions')
        .select('*, categories(name), accounts(name)')
        .eq('couple_id', coupleId)
        .gte('competence_date', monthStart)
        .lte('competence_date', monthEnd)
        .is('deleted_at', null)
        .order('date', { ascending: false })
    : null

  const transactions: any[] = transactionsRes?.data ?? []

  return (
    <div className="flex flex-col flex-1">
      <Header title="Transações" />

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Conta</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const config = typeConfig[t.type as Transaction['type']]
                return (
                  <tr
                    key={t.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {config.icon}
                        <span className="text-xs text-gray-500">{config.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {t.description ?? '—'}
                      {t.is_private && (
                        <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                          privado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {(t.categories as { name?: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {(t.accounts as { name?: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.date)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${config.color}`}>
                      {t.type === 'expense' ? '-' : ''}
                      {formatCurrency(t.amount)}
                    </td>
                  </tr>
                )
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-gray-400">
                    Nenhuma transação neste mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
