export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { NewGoalButton, GoalActions } from '@/components/features/goals/goal-actions'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .single()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const goalsRes = coupleId
    ? await (supabase.from('goals') as any)
        .select('*, goal_history(*)')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
    : null

  const goals: any[] = goalsRes?.data ?? []

  return (
    <div className="flex flex-col flex-1">
      <Header title="Metas" />

      <div className="p-6 space-y-4 max-w-2xl">
        <div className="flex justify-end">
          {coupleId && <NewGoalButton coupleId={coupleId} />}
        </div>

        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
          const remaining = goal.target_amount - goal.current_amount
          const done = goal.current_amount >= goal.target_amount

          return (
            <div key={goal.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{goal.name}</p>
                  {goal.deadline && (
                    <p className="text-xs text-gray-400 mt-0.5">Prazo: {formatDate(goal.deadline)}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {done && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Concluída!
                    </span>
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
