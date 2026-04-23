import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { SubscriptionsClient } from '@/components/features/subscriptions/subscriptions-client'

export const metadata: Metadata = { title: 'Assinaturas' }

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members').select('couple_id').eq('user_id', user!.id).maybeSingle()
  const coupleId = (member as any)?.couple_id ?? null

  const { data } = await (supabase as any)
    .from('subscriptions')
    .select('*')
    .eq('couple_id', coupleId)
    .order('active', { ascending: false })
    .order('cost', { ascending: false })

  return (
    <div className="flex flex-col flex-1">
      <Header title="Assinaturas" />
      <SubscriptionsClient coupleId={coupleId} initialSubscriptions={data ?? []} />
    </div>
  )
}
