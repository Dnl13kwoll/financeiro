export const dynamic = 'force-dynamic'
import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { createClient } from '@/lib/supabase/server'
import { TasksClient } from '@/components/features/tasks/tasks-client'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const [tasksRes, membersRes] = await Promise.all([
    coupleId
      ? supabase
          .from('tasks')
          .select('*')
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: false })
      : Promise.resolve(null),
    coupleId
      ? supabase
          .from('couple_members')
          .select('user_id, profiles(id, name, email)')
          .eq('couple_id', coupleId)
      : Promise.resolve(null),
  ])

  const pageErrors = [tasksRes?.error, membersRes?.error].filter(Boolean)

  const tasks = (tasksRes?.data ?? []) as any[]

  const members = ((membersRes?.data ?? []) as any[]).map((m: any) => ({
    id: m.profiles?.id ?? m.user_id,
    name: m.profiles?.name ?? m.profiles?.email ?? 'Usuário',
    email: m.profiles?.email ?? '',
  }))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Atividades" />
      <PageTabs tabs={[
        { href: '/today', label: 'Hoje' },
        { href: '/tasks', label: 'Tarefas' },
        { href: '/reminders', label: 'Lembretes' },
      ]} />
      {pageErrors.length > 0 && (
        <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Alguns dados não puderam ser carregados. Tente recarregar a página.
        </div>
      )}
      <TasksClient
        tasks={tasks}
        members={members}
        coupleId={coupleId}
        userId={user!.id}
      />
    </div>
  )
}
