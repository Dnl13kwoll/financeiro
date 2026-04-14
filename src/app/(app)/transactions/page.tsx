import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react'
import { NewTransactionButton } from '@/components/features/transactions/new-transaction-button'
import { TransactionActions } from '@/components/features/transactions/transaction-actions'
import { TransactionFilters } from '@/components/features/transactions/transaction-filters'
import { CategoryManager } from '@/components/features/categories/category-manager'
import { ImportCSVButton } from '@/components/features/transactions/import-csv-button'
import { Suspense } from 'react'
import { SortHeader } from '@/components/features/transactions/sort-header'
import Link from 'next/link'

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
  searchParams: Promise<{ month?: string; date_from?: string; date_to?: string; type?: string; category_id?: string; account_id?: string; q?: string; tag?: string; sort?: string; dir?: string }>
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
  let monthStart: string
  let monthEnd: string
  if (params.date_from && params.date_to) {
    monthStart = params.date_from
    monthEnd = params.date_to
  } else {
    const monthParam = params.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const [year, month] = monthParam.split('-').map(Number)
    monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
    monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)
  }

  const sortCol = params.sort && ['date', 'amount', 'description'].includes(params.sort) ? params.sort : 'date'
  const sortAsc = params.dir === 'asc'

  let query = coupleId
    ? supabase
        .from('transactions')
        .select('*, categories(name), accounts(name)')
        .eq('couple_id', coupleId)
        .gte('competence_date', monthStart)
        .lte('competence_date', monthEnd)
        .is('deleted_at', null)
        .order(sortCol, { ascending: sortAsc })
    : null

  if (query && params.type) query = (query as any).eq('type', params.type)
  if (query && params.category_id) query = (query as any).eq('category_id', params.category_id)
  if (query && params.account_id) query = (query as any).eq('account_id', params.account_id)

  const transactionsRes = query ? await query : null

  const accountsRes = coupleId
    ? await supabase.from('accounts').select('id, name').eq('couple_id', coupleId).is('deleted_at', null)
    : null

  const categoriesRes = await supabase.from('categories').select('id, name, type, couple_id').order('name')

  let transactions: any[] = transactionsRes?.data ?? []
  const accounts: { id: string; name: string }[] = (accountsRes?.data ?? []) as any[]
  const categories: { id: string; name: string; type: 'income' | 'expense'; couple_id?: string }[] = (categoriesRes?.data ?? []) as any[]

  if (params.q) {
    const q = params.q.toLowerCase()
    transactions = transactions.filter(t =>
      (t.description ?? '').toLowerCase().includes(q) ||
      (t.categories?.name ?? '').toLowerCase().includes(q)
    )
  }
  if (params.tag) {
    const tag = params.tag.toLowerCase()
    transactions = transactions.filter(t =>
      (t.tags ?? []).some((tg: string) => tg.toLowerCase().includes(tag))
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Transações" />

      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap gap-2 justify-between">
          <Suspense>
            <TransactionFilters accounts={accounts} categories={categories} />
          </Suspense>
          <div className="flex gap-2 flex-wrap">
            {coupleId && <ImportCSVButton coupleId={coupleId} userId={user!.id} accounts={accounts} />}
            {coupleId && <CategoryManager categories={categories} coupleId={coupleId} />}
            {coupleId && (
              <NewTransactionButton
                coupleId={coupleId}
                userId={user!.id}
                accounts={accounts}
                categories={categories}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left text-xs">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">
                  <Suspense><SortHeader label="Descrição" column="description" /></Suspense>
                </th>
                <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 hidden md:table-cell">Conta</th>
                <th className="px-4 py-3 hidden sm:table-cell">
                  <Suspense><SortHeader label="Data" column="date" /></Suspense>
                </th>
                <th className="px-4 py-3 text-right">
                  <Suspense><SortHeader label="Valor" column="amount" className="ml-auto" /></Suspense>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const config = typeConfig[t.type as Transaction['type']]
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {config.icon}
                        <span className="text-xs text-gray-500 hidden sm:inline">{config.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      <div className="flex flex-col gap-0.5">
                        <span>
                          {t.description ?? '—'}
                          {t.is_private && (
                            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">privado</span>
                          )}
                        </span>
                        {t.comment && (
                          <span className="text-xs text-gray-400 italic">💬 {t.comment}</span>
                        )}
                        {(t.tags ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(t.tags as string[]).map((tag) => (
                              <Link
                                key={tag}
                                href={`/transactions?tag=${encodeURIComponent(tag)}`}
                                className="text-xs bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded-full hover:bg-primary-100 transition-colors"
                              >
                                {tag}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {(t.categories as { name?: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {(t.accounts as { name?: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{formatDate(t.date)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${config.color}`}>
                      {t.type === 'expense' ? '-' : ''}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <TransactionActions
                        transaction={{ id: t.id, type: t.type, amount: t.amount, description: t.description, category_id: t.category_id, account_id: t.account_id, date: t.date, is_private: t.is_private, tags: t.tags ?? [], comment: t.comment }}
                        accounts={accounts}
                        categories={categories}
                      />
                    </td>
                  </tr>
                )
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    {coupleId ? 'Nenhuma transação encontrada.' : 'Crie um casal em Configurações para começar.'}
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
