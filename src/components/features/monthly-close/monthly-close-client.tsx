'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Target, Wallet, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

type Goal = { id: string; name: string; current_amount: number; target_amount: number; deadline: string | null }

type Props = {
  txCount: number
  balance: number
  savingsRate: number
  budgetsExceeded: number
  budgetTotal: number
  unpaidCount: number
  goalsCount: number
  goals: Goal[]
  coupleId: string
  userId: string
  monthStart: string
}

type CheckItem = { id: string; label: string; ok: boolean; warn?: boolean; detail?: string; href?: string }

export function MonthlyCloseClient(props: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [goalsOpen, setGoalsOpen] = useState(false)
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null)
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const checks: CheckItem[] = [
    {
      id: 'transactions',
      label: 'Transações registradas',
      ok: props.txCount > 0,
      warn: props.txCount === 0,
      detail: props.txCount > 0
        ? `${props.txCount} transação(ões) no período`
        : 'Nenhuma transação encontrada — verifique se tudo foi lançado',
      href: '/transactions',
    },
    {
      id: 'balance',
      label: 'Saldo positivo',
      ok: props.balance >= 0,
      warn: props.balance < 0,
      detail: props.balance >= 0
        ? `Saldo de ${formatCurrency(props.balance)} — ótimo!`
        : `Saldo negativo de ${formatCurrency(Math.abs(props.balance))} — revise suas despesas`,
    },
    {
      id: 'savings',
      label: 'Taxa de poupança saudável (≥ 10%)',
      ok: props.savingsRate >= 10,
      warn: props.savingsRate < 10,
      detail: `Taxa atual: ${props.savingsRate.toFixed(1)}%${props.savingsRate < 10 ? ' — tente economizar mais no próximo mês' : ''}`,
    },
    {
      id: 'budgets',
      label: 'Orçamentos respeitados',
      ok: props.budgetsExceeded === 0,
      warn: props.budgetsExceeded > 0,
      detail: props.budgetTotal === 0
        ? 'Nenhum orçamento definido — configure em Orçamentos'
        : props.budgetsExceeded === 0
          ? `Todos os ${props.budgetTotal} orçamentos dentro do limite`
          : `${props.budgetsExceeded} orçamento(s) excedido(s) — revise os gastos`,
      href: '/budgets',
    },
    {
      id: 'installments',
      label: 'Parcelas do mês pagas',
      ok: props.unpaidCount === 0,
      warn: props.unpaidCount > 0,
      detail: props.unpaidCount === 0
        ? 'Todas as parcelas do período estão pagas'
        : `${props.unpaidCount} parcela(s) não pagas — verifique Parcelamentos`,
      href: '/installments',
    },
  ]

  const allOk = checks.every(c => c.ok)

  async function handleGoalContribution(goalId: string) {
    const val = parseFloat(amounts[goalId] ?? '0')
    if (!val || val <= 0) { showToast('Digite um valor válido.', 'error'); return }
    setSavingGoalId(goalId)
    const supabase = createClient()
    const { error: histErr } = await supabase.from('goal_history').insert({
      goal_id: goalId,
      amount: val,
      note: `Aporte fechamento ${props.monthStart.slice(0, 7)}`,
    })
    if (histErr) {
      setSavingGoalId(null)
      showToast('Erro: ' + histErr.message, 'error')
      return
    }
    // Atomic server-side increment — avoids read-modify-write race between partners
    const { error: updErr } = await supabase.rpc('increment_goal_amount', { goal_id: goalId, delta: val })
    setSavingGoalId(null)
    if (updErr) {
      showToast('Erro ao atualizar meta: ' + updErr.message, 'error')
      return
    }
    setAmounts(prev => ({ ...prev, [goalId]: '' }))
    showToast(`Aporte de ${formatCurrency(val)} adicionado à meta!`)
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="space-y-4">

      {/* ── Checklist ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Checklist de fechamento</h3>
        <div className="space-y-3">
          {checks.map(item => (
            <div key={item.id} className="flex items-start gap-3">
              {item.ok
                ? <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                : <Circle className={`w-5 h-5 shrink-0 mt-0.5 ${item.warn ? 'text-amber-400' : 'text-gray-300'}`} />
              }
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.ok ? 'text-gray-700' : item.warn ? 'text-amber-700' : 'text-gray-400'}`}>
                  {item.label}
                </p>
                {item.detail && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                )}
              </div>
              {item.href && !item.ok && (
                <Link href={item.href} className="text-xs text-primary-600 hover:underline shrink-0 flex items-center gap-0.5 mt-0.5">
                  Ver <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>

        {allOk && (
          <div className="mt-4 bg-green-50 border border-green-100 rounded-lg px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-sm font-medium text-green-700">Mês fechado com sucesso! Ótima gestão financeira.</p>
          </div>
        )}
      </div>

      {/* ── Aportes em metas ───────────────────────────────────────────────── */}
      {props.goals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setGoalsOpen(v => !v)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-semibold text-gray-700">
                Registrar aportes nas metas ({props.goals.length})
              </span>
            </div>
            {goalsOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {goalsOpen && (
            <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-4">
              {props.goals.map(goal => {
                const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0
                const remaining = goal.target_amount - goal.current_amount
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-800">{goal.name}</p>
                      <p className="text-xs text-gray-400 financial-value">{formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 financial-value">Faltam {formatCurrency(remaining)}</p>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Valor do aporte"
                          value={amounts[goal.id] ?? ''}
                          onChange={e => setAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <button
                        onClick={() => handleGoalContribution(goal.id)}
                        disabled={savingGoalId === goal.id}
                        className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 shrink-0"
                      >
                        {savingGoalId === goal.id ? '...' : 'Aportar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
