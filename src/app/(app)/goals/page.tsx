export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { NewGoalButton, GoalActions } from '@/components/features/goals/goal-actions'
import { GoalContributions } from '@/components/features/goals/goal-contributions'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const [goalsRes, accountsRes] = await Promise.all([
    coupleId
      ? await (supabase.from('goals') as any)
          .select('*, goal_history(*), accounts(name), goal_contributions(*)')
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: false })
      : null,
    coupleId
      ? supabase.from('accounts').select('id, name').eq('couple_id', coupleId).is('deleted_at', null)
      : Promise.resolve(null),
  ])

  const goals: any[] = goalsRes?.data ?? []
  const accounts: { id: string; name: string }[] = (accountsRes?.data ?? []) as any[]

  const today = new Date()

  return (
    <div className="flex flex-col flex-1">
      <Header title="Metas" />

      <div className="p-6 space-y-4 max-w-2xl">
        <div className="flex justify-end">
          {coupleId && <NewGoalButton coupleId={coupleId} accounts={accounts} />}
        </div>

        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
          const remaining = goal.target_amount - goal.current_amount
          const done = goal.current_amount >= goal.target_amount

          // Monthly savings calculation
          let monthlySavingsNeeded: number | null = null
          if (!done && goal.deadline) {
            const deadline = new Date(goal.deadline)
            const months = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth())
            if (months > 0) monthlySavingsNeeded = remaining / months
          }

          const linkedAccount = (goal.accounts as any)?.name

          return (
            <div key={goal.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{goal.name}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {goal.deadline && (
                      <p className="text-xs text-gray-400">Prazo: {formatDate(goal.deadline)}</p>
                    )}
                    {linkedAccount && (
                      <p className="text-xs text-blue-500">Conta: {linkedAccount}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {done && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Concluída! 🎉
                    </span>
                  )}
                  {coupleId && !done && (
                    <GoalContributions
                      goalId={goal.id}
                      coupleId={coupleId}
                      userId={user!.id}
                      currentAmount={goal.current_amount}
                      targetAmount={goal.target_amount}
                      contributions={goal.goal_contributions ?? []}
                    />
                  )}
                  <GoalActions goal={goal} />
                </div>
              </div>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary-600 font-semibold">{formatCurrency(goal.current_amount)}</span>
                <span className="text-gray-400">de {formatCurrency(goal.target_amount)}</span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all ${done ? 'bg-green-500' : 'bg-primary-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>{progress}% concluído</span>
                {!done && <span>Faltam {formatCurrency(remaining)}</span>}
              </div>

              {/* Monthly savings needed */}
              {monthlySavingsNeeded !== null && (
                <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  Poupando {formatCurrency(monthlySavingsNeeded)}/mês você atinge a meta no prazo.
                </div>
              )}

              {/* Histórico de aportes */}
              {(goal.goal_history ?? []).length > 0 && (
                <div className="mt-4 border-t border-gray-50 pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Histórico de aportes</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {[...(goal.goal_history as any[])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((h: any) => (
                      <div key={h.id} className="flex justify-between text-xs">
                        <span className="text-gray-500">{new Date(h.created_at).toLocaleDateString('pt-BR')}{h.note ? ` · ${h.note}` : ''}</span>
                        <span className="font-medium text-green-600">+{formatCurrency(h.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {goals.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? 'Nenhuma meta cadastrada ainda.' : 'Crie um casal em Configurações para começar.'}
          </div>
        )}
      </div>
    </div>
  )
}
