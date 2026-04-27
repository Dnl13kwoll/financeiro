export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Contas' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Banknote, Building2 } from 'lucide-react'
import type { Account } from '@/types/database'
import { NewAccountButton } from '@/components/features/accounts/new-account-button'
import { AccountActions } from '@/components/features/accounts/account-actions'
import Link from 'next/link'
import { TransferButton } from '@/components/features/accounts/transfer-button'
import { AccountSortButtons } from '@/components/features/accounts/account-sort-buttons'

const typeLabel: Record<Account['type'], string> = {
  cash: 'Dinheiro',
  bank: 'Banco',
  credit_card: 'Cartão de Crédito',
}

const typeIcon: Record<Account['type'], React.ReactNode> = {
  cash: <Banknote className="w-5 h-5" />,
  bank: <Building2 className="w-5 h-5" />,
  credit_card: <CreditCard className="w-5 h-5" />,
}

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const accountsRes = coupleId
    ? await supabase
        .from('accounts')
        .select('*')
        .eq('couple_id', coupleId)
        .is('deleted_at', null)
        .order('sort_order')
        .order('created_at')
    : null

  const now30 = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const todayDate = new Date().toISOString().slice(0, 10)

  const [balancesRes, forecastInstRes] = await Promise.all([
    coupleId ? supabase.from('account_balances').select('*') : Promise.resolve(null),
    coupleId
      ? await supabase.from('installment_items')
          .select('amount, installments(account_id)')
          .eq('paid', false)
          .eq('canceled', false)
          .gte('due_date', todayDate)
          .lte('due_date', now30)
      : Promise.resolve(null),
  ])

  const pageErrors = [accountsRes?.error, balancesRes?.error].filter(Boolean)

  const accounts: Account[] = (accountsRes?.data ?? []) as Account[]
  const balances: any[] = balancesRes?.data ?? []

  const balanceMap = new Map(balances.map((b) => [b.id, b.balance]))

  // Previsão de saldo por conta (descontando parcelas pendentes 30d)
  const forecastDeductMap = new Map<string, number>()
  ;((forecastInstRes as any)?.data ?? []).forEach((item: any) => {
    const accountId = (item.installments as any)?.account_id
    if (accountId) {
      forecastDeductMap.set(accountId, (forecastDeductMap.get(accountId) ?? 0) + item.amount)
    }
  })

  return (
    <div className="flex flex-col flex-1">
      <Header title="Contas" />

      <div className="p-6">
        {pageErrors.length > 0 && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Erro ao carregar dados:</strong> {pageErrors.map((e: any) => e.message).join(' | ')}
          </div>
        )}
        <div className="flex justify-end gap-2 mb-5">
          {coupleId && <TransferButton coupleId={coupleId} userId={user!.id} accounts={accounts} />}
          {coupleId && <NewAccountButton coupleId={coupleId} userId={user!.id} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account, idx) => (
            <div
              key={account.id}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm relative"
            >
              <Link href={`/accounts/${account.id}`} className="absolute inset-0 rounded-xl" aria-label={`Ver extrato de ${account.name}`} />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-500">
                  {(account as any).color && (
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: (account as any).color }} />
                  )}
                  {typeIcon[account.type]}
                  <span className="text-xs">{typeLabel[account.type]}</span>
                </div>
                <div className="flex items-center gap-2 relative z-10">
                  <AccountSortButtons
                    id={account.id}
                    sortOrder={(account as any).sort_order ?? idx * 10}
                    isFirst={idx === 0}
                    isLast={idx === accounts.length - 1}
                  />
                  {account.type === 'credit_card' && account.limit_amount && (
                    <span className="text-xs text-gray-400">
                      Limite: {formatCurrency(account.limit_amount)}
                    </span>
                  )}
                  <AccountActions account={account} />
                </div>
              </div>
              <p className="font-semibold text-gray-900">{account.name}</p>
              {account.type === 'credit_card' ? (() => {
                const used = Math.max(0, -(balanceMap.get(account.id) ?? 0))
                const limit = account.limit_amount ?? 0
                const available = limit - used
                const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0
                return (
                  <>
                    <div className="mt-2 space-y-0.5">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Usado</span>
                        <span className="font-semibold text-red-600">{formatCurrency(used)}</span>
                      </div>
                      {limit > 0 && (
                        <>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct > 80 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Disponível: <span className="text-green-600 font-medium">{formatCurrency(available)}</span></span>
                            <span>Limite: {formatCurrency(limit)}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        Fecha dia {account.closing_day} · Vence dia {account.due_day}
                      </p>
                      <a
                        href={`/cards/${account.id}`}
                        className="text-xs text-primary-600 hover:underline relative z-10"
                        onClick={e => e.stopPropagation()}
                      >
                        Ver fatura →
                      </a>
                    </div>
                  </>
                )
              })() : (() => {
                const bal = balanceMap.get(account.id) ?? 0
                const minAlert = (account as any).min_balance_alert
                const belowAlert = minAlert !== null && minAlert !== undefined && bal < minAlert
                return (
                  <>
                    <p className={`text-2xl font-bold mt-2 ${belowAlert ? 'text-red-600' : 'text-primary-600'}`}>
                      {formatCurrency(bal)}
                    </p>
                    {belowAlert && (
                      <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                        ⚠ Saldo abaixo de {formatCurrency(minAlert)}
                      </p>
                    )}
                    {forecastDeductMap.has(account.id) && (
                      <p className="text-xs text-orange-500 mt-0.5">
                        Previsão 30d: {formatCurrency(bal - (forecastDeductMap.get(account.id) ?? 0))}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              {coupleId ? 'Nenhuma conta cadastrada ainda.' : 'Crie um casal em Configurações para começar.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
