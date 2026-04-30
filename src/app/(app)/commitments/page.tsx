export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { CommitmentsClient } from '@/components/features/commitments/commitments-client'

export const metadata: Metadata = { title: 'Compromissos Fixos' }

export default async function CommitmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members').select('couple_id').eq('user_id', user!.id).maybeSingle()
  const coupleId = (member as any)?.couple_id ?? null

  const [recurringRes, subscriptionsRes] = await Promise.all([
    coupleId
      ? supabase.from('recurring_accounts').select('id, name, amount, day_due, active, categories(name)').eq('couple_id', coupleId).order('day_due')
      : Promise.resolve(null),
    coupleId
      ? (supabase as any).from('subscriptions').select('id, name, cost, billing_cycle, category, renewal_date, active, color').eq('couple_id', coupleId).order('active', { ascending: false }).order('cost', { ascending: false })
      : Promise.resolve(null),
  ])

  const recurring = recurringRes?.data ?? []
  const subscriptions = subscriptionsRes?.data ?? []

  return (
    <div className="flex flex-col flex-1">
      <Header title="Pagamentos Fixos" />
      <PageTabs tabs={[
        { href: '/recurring', label: 'Recorrentes' },
        { href: '/subscriptions', label: 'Assinaturas' },
        { href: '/commitments', label: 'Compromissos' },
      ]} />
      {coupleId ? (
        <CommitmentsClient recurring={recurring} subscriptions={subscriptions} />
      ) : (
        <div className="p-6 text-center py-16 text-gray-400">
          Crie um casal em Configurações para começar.
        </div>
      )}
    </div>
  )
}
