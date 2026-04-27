export const dynamic = 'force-dynamic'
import { Header } from '@/components/layout/header'
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

  const tasks = (tasksRes?.data ?? []) as any[]

  const members = ((membersRes?.data ?? []) as any[]).map((m: any) => ({
    id: m.profiles?.id ?? m.user_id,
    name: m.profiles?.name ?? m.profiles?.email ?? 'Usuário',
    email: m.profiles?.email ?? '',
  }))

  return (
    <div className="flex flex-col flex-1">
      <Header title="Tarefas" />
      <TasksClient
        tasks={tasks}
        members={members}
        coupleId={coupleId}
        userId={user!.id}
      />
    </div>
  )
}
