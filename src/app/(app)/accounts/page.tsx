export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Contas' }
import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import type { Account } from '@/types/database'
import { NewAccountButton } from '@/components/features/accounts/new-account-button'
import { TransferButton } from '@/components/features/accounts/transfer-button'
import { AccountsDragGrid } from '@/components/features/accounts/accounts-drag-grid'
import { PageTabs } from '@/components/ui/page-tabs'


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
  const balances: { id: string; balance: number | null }[] = (balancesRes?.data ?? []) as any[]

  // Previsão de saldo por conta (descontando parcelas pendentes 30d)
  const forecastDeductMap = new Map<string, number>()
  ;((forecastInstRes as any)?.data ?? []).forEach((item: any) => {
    const accountId = (item.installments as any)?.account_id
    if (accountId) {
      forecastDeductMap.set(accountId, (forecastDeductMap.get(accountId) ?? 0) + item.amount)
    }
  })
  const forecastDeducts = Array.from(forecastDeductMap.entries()).map(([id, amount]) => ({ id, amount }))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Contas" />

      <PageTabs tabs={[
        { href: '/accounts', label: 'Contas' },
        { href: '/cards', label: 'Faturas' },
      ]} />
      <div className="p-6">
        {pageErrors.length > 0 && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Erro ao carregar dados:</strong> {pageErrors.map((e: any) => e?.message ?? 'Erro desconhecido').join(' | ')}
          </div>
        )}
        <div className="flex justify-end gap-2 mb-5">
          {coupleId && <TransferButton coupleId={coupleId} userId={user!.id} accounts={accounts} />}
          {coupleId && <NewAccountButton coupleId={coupleId} userId={user!.id} />}
        </div>

        {!coupleId ? (
          <div className="text-center py-16 text-gray-400">Crie um casal em Configurações para começar.</div>
        ) : (
          <AccountsDragGrid
            initialAccounts={accounts as any[]}
            balances={balances}
            forecastDeducts={forecastDeducts}
          />
        )}
      </div>
    </div>
  )
}
