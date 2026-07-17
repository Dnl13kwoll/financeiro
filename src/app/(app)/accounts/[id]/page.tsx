export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Extrato da Conta' }

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AccountReconcile } from '@/components/features/accounts/account-reconcile'
import { AccountBalanceHistory } from '@/components/features/accounts/account-balance-history'
import { MonthFilter } from '@/components/features/accounts/month-filter'

export default async function AccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params
  const sp = await searchParams

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const accountRes = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  const account: any = accountRes.data

  if (!account) {
    return <div className="p-6 text-gray-500">Conta não encontrada.</div>
  }

  const now = new Date()
  const monthParam = sp.month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = monthParam.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10)

  const balanceRes = await supabase
    .from('account_balances')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  const balance: number = (balanceRes.data as any)?.balance ?? 0

  const txRes = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('account_id', id)
    .gte('competence_date', monthStart)
    .lte('competence_date', monthEnd)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  const transactions: any[] = txRes.data ?? []
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Last 6 months balance history (income - expense per month from current balance)
  const historyMonths: { label: string; balance: number }[] = []
  let runningBalance = balance
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mStart = d.toISOString().slice(0, 10)
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    if (i > 0) {
      // Find transactions in this month range to walk backwards
      const mTxRes = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('account_id', id)
        .gte('competence_date', mStart)
        .lte('competence_date', mEnd)
        .is('deleted_at', null)
      const mTxs: any[] = mTxRes.data ?? []
      const mIncome = mTxs.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0)
      const mExpense = mTxs.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0)
      runningBalance = runningBalance - mIncome + mExpense
    }
    const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`
    historyMonths.unshift({ label, balance: runningBalance })
    if (i === 0) runningBalance = balance
  }

  const userId = user!.id

  return (
    <div className="flex flex-col flex-1">
      <Header title={account.name} />

      <div className="p-4 md:p-6 space-y-4 max-w-2xl">
        <div className="flex items-center gap-2">
          <Link href="/accounts" className="text-gray-400 hover:text-gray-700 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Contas
          </Link>
        </div>

        {/* Account summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                {account.color && (
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: account.color }} />
                )}
                <p className="text-sm text-gray-500">{account.type === 'credit_card' ? 'Cartão de Crédito' : account.type === 'bank' ? 'Banco' : 'Dinheiro'}</p>
              </div>
              <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(balance)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Saldo atual</p>
              {account.notes && (
                <p className="text-xs text-gray-500 mt-2 italic">{account.notes}</p>
              )}
            </div>
            <AccountReconcile
              accountId={id}
              coupleId={coupleId!}
              userId={userId}
              currentBalance={balance}
            />
          </div>
        </div>

        {/* Balance history chart */}
        <AccountBalanceHistory points={historyMonths} />

        {/* Month filter */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Mês:</label>
          <MonthFilter accountId={id} defaultValue={monthParam} />
        </div>

        {/* Month summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600">Entradas</p>
            <p className="font-bold text-green-700 mt-1">{formatCurrency(income)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs text-red-600">Saídas</p>
            <p className="font-bold text-red-700 mt-1">{formatCurrency(expense)}</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-500">Transações</p>
            <p className="font-bold text-gray-700 mt-1">{transactions.length}</p>
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Nenhuma transação neste período.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {t.type === 'income'
                      ? <ArrowUpCircle className="w-4 h-4 text-green-500 shrink-0" />
                      : t.type === 'expense'
                      ? <ArrowDownCircle className="w-4 h-4 text-red-500 shrink-0" />
                      : <ArrowLeftRight className="w-4 h-4 text-blue-500 shrink-0" />
                    }
                    <div>
                      <p className="text-sm text-gray-900">{t.description ?? '—'}</p>
                      <p className="text-xs text-gray-400">
                        {formatDate(t.date)}
                        {(t.categories as any)?.name ? ` · ${(t.categories as any).name}` : ''}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : t.type === 'expense' ? 'text-red-600' : 'text-blue-600'}`}>
                    {t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
