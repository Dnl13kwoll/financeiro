'use client'
import { useState, useEffect } from 'react'
import { Settings2, X, Eye, EyeOff } from 'lucide-react'

export type WidgetKey =
  | 'score'
  | 'savings_rate'
  | 'user_breakdown'
  | 'budget_alerts'
  | 'low_balance'
  | 'goals'
  | 'calendar'
  | 'history'
  | 'balance_evolution'
  | 'recent_tx'
  | 'category_pie'
  | 'due_soon'
  | 'forecast'

const WIDGET_LABELS: Record<WidgetKey, string> = {
  score: 'Score financeiro',
  savings_rate: 'Taxa de poupança',
  user_breakdown: 'Gastos por pessoa',
  budget_alerts: 'Alertas de orçamento',
  low_balance: 'Alertas de saldo baixo',
  goals: 'Metas em andamento',
  calendar: 'Calendário de compromissos',
  history: 'Histórico 6 meses',
  balance_evolution: 'Evolução do saldo',
  recent_tx: 'Últimas transações',
  category_pie: 'Gastos por categoria',
  due_soon: 'Vencimentos próximos',
  forecast: 'Previsão de saldo',
}

export const STORAGE_KEY = 'dashboard_hidden_widgets'
const ALL_KEYS = Object.keys(WIDGET_LABELS) as WidgetKey[]

export function DashboardCustomizeButton() {
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState<Set<WidgetKey>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setHidden(new Set(JSON.parse(stored) as WidgetKey[]))
    } catch {}
  }, [])

  function toggle(key: WidgetKey) {
    setHidden(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
        window.dispatchEvent(new Event('dashboard-widgets-changed'))
      } catch {}
      return next
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-gray-300 transition-colors"
        title="Personalizar dashboard"
      >
        <Settings2 className="w-3.5 h-3.5" />
        Personalizar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Widgets do Dashboard</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">Clique para mostrar ou ocultar cada seção</p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {ALL_KEYS.map(key => {
                const visible = !hidden.has(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors
                      ${visible ? 'bg-primary-50 text-primary-800 hover:bg-primary-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                  >
                    <span>{WIDGET_LABELS[key]}</span>
                    {visible
                      ? <Eye className="w-4 h-4 text-primary-500" />
                      : <EyeOff className="w-4 h-4 text-gray-300" />
                    }
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => {
                try { localStorage.removeItem(STORAGE_KEY) } catch {}
                window.location.reload()
              }}
              className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 underline text-center block"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      )}
    </>
  )
}
