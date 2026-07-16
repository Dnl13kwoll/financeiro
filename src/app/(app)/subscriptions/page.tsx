export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { SubscriptionsClient } from '@/components/features/subscriptions/subscriptions-client'

export const metadata: Metadata = { title: 'Assinaturas' }

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members').select('couple_id').eq('user_id', user!.id).maybeSingle()
  const coupleId = (member as any)?.couple_id ?? null

  const { data, error } = coupleId
    ? await (supabase as any)
        .from('subscriptions')
        .select('*')
        .eq('couple_id', coupleId)
        .order('active', { ascending: false })
        .order('cost', { ascending: false })
    : { data: [], error: null }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Pagamentos Fixos" />
      <PageTabs tabs={[
        { href: '/recurring', label: 'Recorrentes' },
        { href: '/subscriptions', label: 'Assinaturas' },
        { href: '/commitments', label: 'Compromissos' },
      ]} />
      {error && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Alguns dados não puderam ser carregados. Tente recarregar a página.
        </div>
      )}
      <SubscriptionsClient coupleId={coupleId} initialSubscriptions={data ?? []} />
    </div>
  )
}
