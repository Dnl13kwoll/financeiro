'use client'
import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Target, ChevronDown, ChevronUp } from 'lucide-react'

type Goal = {
  id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
}

type Props = {
  avgIncome: number
  avgExpense: number
  recurringFixed: number
  recurringVariableCount: number
  goals: Goal[]
  monthlySavingsFromHistory: number // avg monthly net from last 3 months
}

function monthLabel(offset: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() + offset)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function ProjectionClient({
  avgIncome,
  avgExpense,
  recurringFixed,
  recurringVariableCount,
  goals,
  monthlySavingsFromHistory,
}: Props) {
  const [horizon, setHorizon] = useState<3 | 6 | 12>(3)
  const [incomeAdj, setIncomeAdj] = useState(0)   // % adjustment
  const [expenseAdj, setExpenseAdj] = useState(0)  // % adjustment
  const [showScenario, setShowScenario] = useState(false)
  const [showGoals, setShowGoals] = useState(true)

  const adjIncome = useMemo(() => avgIncome * (1 + incomeAdj / 100), [avgIncome, incomeAdj])
  const adjExpense = useMemo(() => {
    const base = recurringFixed + (avgExpense > recurringFixed ? avgExpense - recurringFixed : 0)
    return base * (1 + expenseAdj / 100)
  }, [avgExpense, recurringFixed, expenseAdj])

  const projections = useMemo(() => {
    return Array.from({ length: horizon }, (_, i) => {
      const income = adjIncome
      const expense = adjExpense
      const balance = income - expense
      return {
        label: monthLabel(i + 1),
        income,
        expense,
        balance,
      }
    })
  }, [horizon, adjIncome, adjExpense])

  const maxBar = Math.max(...projections.flatMap(p => [p.income, p.expense]), 1)
  const avgMonthlySavings = adjIncome - adjExpense

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
        {/* Horizon */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Horizonte de projeção</p>
            <p className="text-xs text-gray-400">Quantos meses à frente projetar</p>
          </div>
          <div className="flex gap-2">
            {([3, 6, 12] as const).map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                  horizon === h
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {h}m
              </button>
            ))}
          </div>
        </div>

        {/* Scenario toggle */}
        <button
          onClick={() => setShowScenario(!showScenario)}
          className="flex items-center gap-2 text-sm text-primary-600 font-medium"
        >
          {showScenario ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Simulador de cenários
        </button>

        {showScenario && (
          <div className="space-y-4 pt-2 border-t border-gray-50">
            <p className="text-xs text-gray-400">Ajuste os valores para simular cenários alternativos</p>

            {/* Income slider */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Receita</label>
                <span className={`text-sm font-semibold ${incomeAdj >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {incomeAdj >= 0 ? '+' : ''}{incomeAdj}%
                  {' '}
                  <span className="text-gray-500 font-normal">({formatCurrency(adjIncome)}/mês)</span>
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={5}
                value={incomeAdj}
                onChange={e => setIncomeAdj(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>−50%</span>
                <span>Base</span>
                <span>+50%</span>
              </div>
            </div>

            {/* Expense slider */}
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm text-gray-700">Despesas</label>
                <span className={`text-sm font-semibold ${expenseAdj <= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {expenseAdj >= 0 ? '+' : ''}{expenseAdj}%
                  {' '}
                  <span className="text-gray-500 font-normal">({formatCurrency(adjExpense)}/mês)</span>
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={50}
                step={5}
                value={expenseAdj}
                onChange={e => setExpenseAdj(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>−50%</span>
                <span>Base</span>
                <span>+50%</span>
              </div>
            </div>

            {(incomeAdj !== 0 || expenseAdj !== 0) && (
              <button
                onClick={() => { setIncomeAdj(0); setExpenseAdj(0) }}
                className="text-xs text-gray-400 underline"
              >
                Resetar para base
              </button>
            )}
          </div>
        )}
      </div>

      {/* Projected months grid */}
      <div className={`grid grid-cols-1 gap-4 ${horizon === 3 ? 'md:grid-cols-3' : horizon === 6 ? 'md:grid-cols-3 lg:grid-cols-6' : 'md:grid-cols-4 lg:grid-cols-6'}`}>
        {projections.map((p, i) => {
          const positive = p.balance >= 0
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-900 capitalize mb-3 truncate">{p.label}</p>
              {/* Bar chart */}
              <div className="flex items-end gap-2 h-14 mb-3">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full bg-green-400 rounded-t" style={{ height: `${(p.income / maxBar) * 50}px` }} />
                  <span className="text-xs text-gray-400">Rec.</span>
                </div>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full bg-red-400 rounded-t" style={{ height: `${(p.expense / maxBar) * 50}px` }} />
                  <span className="text-xs text-gray-400">Desp.</span>
                </div>
              </div>
              <div className="space-y-1 text-xs border-t border-gray-50 pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Receita</span>
                  <span className="font-medium text-green-600">{formatCurrency(p.income)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Despesa</span>
                  <span className="font-medium text-red-500">{formatCurrency(p.expense)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-50 pt-1">
                  <span className="text-gray-700 font-medium">Saldo</span>
                  <div className="flex items-center gap-0.5">
                    {positive
                      ? <TrendingUp className="w-3 h-3 text-green-500" />
                      : p.balance === 0
                      ? <Minus className="w-3 h-3 text-gray-400" />
                      : <TrendingDown className="w-3 h-3 text-red-500" />
                    }
                    <span className={`font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(p.balance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Accumulated balance summary */}
      {horizon > 3 && (
        <div className={`grid grid-cols-3 gap-4`}>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600">Total receitas ({horizon}m)</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(adjIncome * horizon)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs text-red-600">Total despesas ({horizon}m)</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(adjExpense * horizon)}</p>
          </div>
          <div className={`${avgMonthlySavings >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'} border rounded-xl p-4`}>
            <p className={`text-xs ${avgMonthlySavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo acumulado ({horizon}m)</p>
            <p className={`text-lg font-bold ${avgMonthlySavings >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(avgMonthlySavings * horizon)}</p>
          </div>
        </div>
      )}

      {/* Goals projection */}
      {goals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            onClick={() => setShowGoals(!showGoals)}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-600" />
              <span className="font-semibold text-gray-800 text-sm">Projeção por meta</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{goals.length}</span>
            </div>
            {showGoals ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showGoals && (
            <div className="border-t border-gray-50 divide-y divide-gray-50">
              {goals.map(goal => {
                const remaining = goal.target_amount - goal.current_amount
                const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))

                let monthsToGoal: number | null = null
                let projectedDate: string | null = null

                if (avgMonthlySavings > 0 && remaining > 0) {
                  monthsToGoal = Math.ceil(remaining / avgMonthlySavings)
                  const d = new Date()
                  d.setMonth(d.getMonth() + monthsToGoal)
                  projectedDate = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                }

                const deadlineWarn = goal.deadline && monthsToGoal !== null
                  ? (() => {
                      const dl = new Date(goal.deadline)
                      const projected = new Date()
                      projected.setMonth(projected.getMonth() + monthsToGoal!)
                      return projected > dl
                    })()
                  : false

                return (
                  <div key={goal.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{goal.name}</p>
                        <p className="text-xs text-gray-400">
                          {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
                          {goal.deadline && ` · prazo: ${new Date(goal.deadline).toLocaleDateString('pt-BR')}`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gray-700">{pct}%</span>
                    </div>

                    <div className="h-1.5 bg-gray-100 rounded-full mb-2">
                      <div
                        className="h-1.5 bg-primary-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {remaining <= 0 ? (
                      <p className="text-xs text-green-600 font-medium">Meta atingida!</p>
                    ) : avgMonthlySavings <= 0 ? (
                      <p className="text-xs text-red-500">Sem economia mensal no cenário atual — meta não atingível</p>
                    ) : monthsToGoal !== null ? (
                      <div className="flex items-center justify-between">
                        <p className={`text-xs ${deadlineWarn ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                          {deadlineWarn ? '⚠ ' : ''}Atingível em ~{monthsToGoal} {monthsToGoal === 1 ? 'mês' : 'meses'}
                          {projectedDate && ` (${projectedDate})`}
                        </p>
                        <p className="text-xs text-gray-400">
                          Economia: {formatCurrency(avgMonthlySavings)}/mês
                        </p>
                      </div>
                    ) : null}
                  </div>
                )
              })}
              {avgMonthlySavings <= 0 && (
                <div className="p-3 bg-orange-50">
                  <p className="text-xs text-orange-600">
                    No cenário atual as despesas superam as receitas. Ajuste os sliders para simular melhoras.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Projeção baseada na média dos últimos 3 meses + recorrentes fixas. Valores estimados.
        {(incomeAdj !== 0 || expenseAdj !== 0) && ' Cenário ajustado manualmente.'}
      </p>
    </div>
  )
}
