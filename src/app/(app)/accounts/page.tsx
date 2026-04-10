'use server'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Banknote, Building2 } from 'lucide-react'
import type { Account } from '@/types/database'

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
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const accountsRes = coupleId
    ? await supabase
        .from('accounts')
        .select('*')
        .eq('couple_id', coupleId)
        .is('deleted_at', null)
        .order('created_at')
    : null

  const balancesRes = coupleId
    ? await supabase.from('account_balances').select('*')
    : null

  const accounts: Account[] = (accountsRes?.data ?? []) as Account[]
  const balances: any[] = balancesRes?.data ?? []

  const balanceMap = new Map(
    balances.map((b) => [b.id, b.balance])
  )

  return (
    <div className="flex flex-col flex-1">
      <Header title="Contas" />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-gray-500">
                  {typeIcon[account.type]}
                  <span className="text-xs">{typeLabel[account.type]}</span>
                </div>
                {account.type === 'credit_card' && account.limit_amount && (
                  <span className="text-xs text-gray-400">
                    Limite: {formatCurrency(account.limit_amount)}
                  </span>
                )}
              </div>
              <p className="font-semibold text-gray-900">{account.name}</p>
              <p className="text-2xl font-bold mt-2 text-primary-600">
                {formatCurrency(balanceMap.get(account.id) ?? 0)}
              </p>
              {account.type === 'credit_card' && (
                <p className="text-xs text-gray-400 mt-1">
                  Fechamento dia {account.closing_day} · Vence dia {account.due_day}
                </p>
              )}
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              Nenhuma conta cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
