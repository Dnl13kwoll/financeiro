export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Hoje' }
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { createClient } from '@/lib/supabase/server'
import { TodayClient } from '@/components/features/today/today-client'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members').select('couple_id').eq('user_id', user!.id).maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  if (!coupleId) {
    return (
      <div className="flex flex-col flex-1">
        <Header title="Hoje" />
        <div className="p-6 text-center text-gray-400 py-16">
          Crie um casal em Configurações para usar essa funcionalidade.
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayDay = new Date().getDate()

  const [installmentsRes, remindersRes, tasksRes, recurringRes] = await Promise.all([
    supabase
      .from('installment_items')
      .select('id, due_date, amount, installments!inner(couple_id, description)')
      .eq('installments.couple_id', coupleId)
      .eq('paid', false)
      .eq('canceled', false)
      .lte('due_date', today)
      .order('due_date'),
    supabase
      .from('financial_reminders')
      .select('id, title, due_date, amount')
      .eq('couple_id', coupleId)
      .eq('done', false)
      .lte('due_date', today)
      .order('due_date'),
    supabase
      .from('tasks')
      .select('id, title, due_date')
      .eq('couple_id', coupleId)
      .neq('status', 'done')
      .not('due_date', 'is', null)
      .lte('due_date', today)
      .order('due_date'),
    supabase
      .from('recurring_accounts')
      .select('id, name, amount, day_due')
      .eq('couple_id', coupleId)
      .eq('active', true)
      .eq('day_due', todayDay),
  ])

  const installments = (installmentsRes.data ?? []).map((i: any) => ({
    id: i.id,
    type: 'installment' as const,
    title: (i.installments as any)?.description ?? 'Parcela',
    due_date: i.due_date,
    amount: i.amount as number,
  }))

  const reminders = (remindersRes.data ?? []).map((r: any) => ({
    id: r.id,
    type: 'reminder' as const,
    title: r.title as string,
    due_date: r.due_date as string,
    amount: r.amount as number | null,
  }))

  const tasks = (tasksRes.data ?? []).map((t: any) => ({
    id: t.id,
    type: 'task' as const,
    title: t.title as string,
    due_date: t.due_date as string,
  }))

  const allItems = [...installments, ...reminders, ...tasks]
  const overdueItems = allItems.filter(i => i.due_date < today)
  const todayItems   = allItems.filter(i => i.due_date === today)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Atividades" />
      <PageTabs tabs={[
        { href: '/today', label: 'Hoje' },
        { href: '/tasks', label: 'Tarefas' },
        { href: '/reminders', label: 'Lembretes' },
      ]} />
      <TodayClient
        today={today}
        overdueItems={overdueItems}
        todayItems={todayItems}
        recurringToday={recurringRes.data ?? []}
        coupleId={coupleId}
      />
    </div>
  )
}
