export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { RemindersClient } from '@/components/features/reminders/reminders-client'

export const metadata: Metadata = { title: 'Lembretes Financeiros' }

export default async function RemindersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: member } = await supabase
    .from('couple_members').select('couple_id').eq('user_id', user!.id).maybeSingle()
  const coupleId = (member as any)?.couple_id ?? null

  const { data } = await (supabase as any)
    .from('financial_reminders')
    .select('*')
    .eq('couple_id', coupleId)
    .order('due_date', { ascending: true })

  return (
    <div className="flex flex-col flex-1">
      <Header title="Atividades" />
      <PageTabs tabs={[
        { href: '/tasks', label: 'Tarefas' },
        { href: '/reminders', label: 'Lembretes' },
      ]} />
      <RemindersClient coupleId={coupleId} initialReminders={data ?? []} />
    </div>
  )
}
