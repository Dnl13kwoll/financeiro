export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Metas' }

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { NewGoalButton, GoalActions } from '@/components/features/goals/goal-actions'
import { GoalContributions } from '@/components/features/goals/goal-contributions'
import { AlertTriangle, Target, Settings } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { sort = 'created' } = await searchParams

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const [goalsRes, accountsRes] = await Promise.all([
    coupleId
      ? supabase.from('goals')
          .select('*, goal_history(*), accounts(name), goal_contributions(*)')
          .eq('couple_id', coupleId)
          .order('created_at', { ascending: false })
      : null,
    coupleId
      ? supabase.from('accounts').select('id, name').eq('couple_id', coupleId).is('deleted_at', null)
      : Promise.resolve(null),
  ])

  const pageErrors = [goalsRes?.error, accountsRes?.error].filter(Boolean)

  let goals: any[] = goalsRes?.data ?? []
  const accounts: { id: string; name: string }[] = (accountsRes?.data ?? []) as any[]

  const today = new Date()

  // Sort goals
  if (sort === 'deadline') {
    goals = [...goals].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
  } else if (sort === 'progress') {
    goals = [...goals].sort((a, b) => {
      const pA = a.current_amount / a.target_amount
      const pB = b.current_amount / b.target_amount
      return pB - pA
    })
  } else if (sort === 'progress_asc') {
    goals = [...goals].sort((a, b) => {
      const pA = a.current_amount / a.target_amount
      const pB = b.current_amount / b.target_amount
      return pA - pB
    })
  }

  // Goals with deadline within 30 days that aren't done
  const urgentGoals = goals.filter(g => {
    if (!g.deadline || g.current_amount >= g.target_amount) return false
    const daysLeft = Math.ceil((new Date(g.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft >= 0 && daysLeft <= 30
  })

  return (
    <div className="flex flex-col flex-1">
      <Header title="Metas" />

      <div className="p-6 space-y-4 max-w-2xl">
        {pageErrors.length > 0 && (
          <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Erro ao carregar dados:</strong> {pageErrors.map((e: any) => e.message).join(' | ')}
          </div>
        )}
        {urgentGoals.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              Prazo se aproximando
            </div>
            {urgentGoals.map(g => {
              const daysLeft = Math.ceil((new Date(g.deadline).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const progress = Math.round((g.current_amount / g.target_amount) * 100)
              return (
                <div key={g.id} className="flex justify-between items-center text-sm">
                  <span className="text-amber-800 font-medium">{g.name}</span>
                  <span className="text-amber-600">
                    {daysLeft === 0 ? 'Hoje!' : `${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`} · {progress}%
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {([
              { value: 'created', label: 'Recentes' },
              { value: 'deadline', label: 'Prazo' },
              { value: 'progress', label: '% ↓' },
              { value: 'progress_asc', label: '% ↑' },
            ] as const).map(opt => (
              <a
                key={opt.value}
                href={`/goals?sort=${opt.value}`}
                className={`px-2.5 py-1.5 transition-colors border-l border-gray-200 first:border-l-0 ${sort === opt.value ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {opt.label}
              </a>
            ))}
          </div>
          {coupleId && <NewGoalButton coupleId={coupleId} accounts={accounts} />}
        </div>

        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
          const remaining = goal.target_amount - goal.current_amount
          const done = goal.current_amount >= goal.target_amount

          // Monthly savings calculation
          let monthlySavingsNeeded: number | null = null
          let daysUntilDeadline: number | null = null
          if (!done && goal.deadline) {
            const deadline = new Date(goal.deadline)
            const months = (deadline.getFullYear() - today.getFullYear()) * 12 + (deadline.getMonth() - today.getMonth())
            if (months > 0) monthlySavingsNeeded = remaining / months
            daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          }

          // Projected completion based on average contribution pace
          let projectedCompletion: string | null = null
          const contributions: any[] = goal.goal_contributions ?? []
          if (!done && contributions.length >= 2) {
            const sorted = [...contributions].sort((a, b) => new Date(a.contributed_at).getTime() - new Date(b.contributed_at).getTime())
            const first = new Date(sorted[0].contributed_at)
            const last = new Date(sorted[sorted.length - 1].contributed_at)
            const monthsElapsed = Math.max(1, (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth()))
            const totalContributed = sorted.reduce((s: number, c: any) => s + c.amount, 0)
            const avgPerMonth = totalContributed / monthsElapsed
            if (avgPerMonth > 0) {
              const monthsNeeded = Math.ceil(remaining / avgPerMonth)
              const projected = new Date(today.getFullYear(), today.getMonth() + monthsNeeded, 1)
              projectedCompletion = projected.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            }
          }

          const linkedAccount = (goal.accounts as any)?.name

          const nearComplete = !done && progress >= 90

          return (
            <div key={goal.id} className={`bg-white rounded-xl p-5 shadow-sm ${nearComplete ? 'border-2 border-green-300' : 'border border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">{goal.name}</p>
                    {nearComplete && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Quase lá! {progress}%</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {goal.deadline && (
                      <p className={`text-xs ${daysUntilDeadline !== null && daysUntilDeadline <= 30 && !done ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
                        Prazo: {formatDate(goal.deadline)}
                        {daysUntilDeadline !== null && daysUntilDeadline <= 30 && !done && (
                          <span className="ml-1">({daysUntilDeadline}d)</span>
                        )}
                      </p>
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

              {/* Projected completion */}
              {projectedCompletion && (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                  No ritmo atual, a meta será concluída em <strong>{projectedCompletion}</strong>.
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
          coupleId
            ? <EmptyState icon={Target} title="Nenhuma meta ainda" description="Defina objetivos financeiros e acompanhe o progresso juntos." />
            : <EmptyState icon={Settings} title="Configure o app" description="Crie um casal em Configurações para começar a usar as metas." />
        )}
      </div>
    </div>
  )
}
