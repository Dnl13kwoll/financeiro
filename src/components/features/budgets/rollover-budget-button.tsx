'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/components/ui/toast'
import { RefreshCw, X } from 'lucide-react'

type RolloverItem = {
  category_id: string
  category_name: string
  surplus: number
  curr_amount: number
}

function formatCurrencyLocal(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function RolloverBudgetButton({
  coupleId,
  currentMonth,
  prevMonth,
}: {
  coupleId: string
  currentMonth: string
  prevMonth: string
}) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<RolloverItem[] | null>(null)
  const [applying, setApplying] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handlePreview() {
    setLoading(true)
    try {
      const supabase = createClient()
      const prevMonthEnd = new Date(
        parseInt(prevMonth.slice(0, 4)),
        parseInt(prevMonth.slice(5, 7)),
        0
      ).toISOString().slice(0, 10)

      const { data: prevBudgets } = await supabase.from('budgets')
        .select('id, category_id, amount, categories(name)')
        .eq('couple_id', coupleId)
        .eq('month', prevMonth)

      if (!prevBudgets || prevBudgets.length === 0) {
        showToast('Nenhum orçamento no mês anterior.', 'error')
        return
      }

      const { data: prevExpenses } = await supabase.from('transactions')
        .select('category_id, amount')
        .eq('couple_id', coupleId)
        .eq('type', 'expense')
        .gte('competence_date', prevMonth)
        .lte('competence_date', prevMonthEnd)
        .is('deleted_at', null)

      const spentMap = new Map<string, number>()
      for (const e of (prevExpenses ?? []) as any[]) {
        if (e.category_id) spentMap.set(e.category_id, (spentMap.get(e.category_id) ?? 0) + e.amount)
      }

      const { data: currBudgets } = await supabase.from('budgets')
        .select('id, category_id, amount')
        .eq('couple_id', coupleId)
        .eq('month', currentMonth)

      const currMap = new Map<string, number>(
        (currBudgets ?? []).map((b: any) => [b.category_id, b.amount])
      )

      const items: RolloverItem[] = []
      for (const prev of prevBudgets) {
        const spent = spentMap.get(prev.category_id) ?? 0
        const surplus = prev.amount - spent
        if (surplus <= 0) continue
        items.push({
          category_id: prev.category_id,
          category_name: prev.categories?.name ?? 'Sem categoria',
          surplus,
          curr_amount: currMap.get(prev.category_id) ?? 0,
        })
      }

      if (items.length === 0) {
        showToast('Nenhum saldo disponível para transferir.', 'error')
      } else {
        setPreview(items)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    if (!preview) return
    setApplying(true)
    try {
      const supabase = createClient()

      const { data: currBudgets } = await supabase.from('budgets')
        .select('id, category_id, amount, alert_threshold')
        .eq('couple_id', coupleId)
        .eq('month', currentMonth)

      const currMap = new Map<string, { id: string; amount: number; alert_threshold: number }>(
        (currBudgets ?? []).map((b: any) => [b.category_id, { id: b.id, amount: b.amount, alert_threshold: b.alert_threshold ?? 80 }])
      )

      for (const item of preview) {
        const curr = currMap.get(item.category_id)
        if (curr) {
          await supabase.from('budgets')
            .update({ amount: curr.amount + item.surplus })
            .eq('id', curr.id)
        } else {
          await supabase.from('budgets').insert({
            couple_id: coupleId,
            category_id: item.category_id,
            month: currentMonth,
            amount: item.surplus,
            alert_threshold: 80,
          })
        }
      }

      showToast(`Saldo de ${preview.length} categoria(s) transferido!`)
      setPreview(null)
      startTransition(() => { router.refresh() })
    } catch {
      showToast('Erro ao fazer rollover.', 'error')
    } finally {
      setApplying(false)
    }
  }

  return (
    <>
      <button
        onClick={handlePreview}
        disabled={loading}
        title="Transferir saldo não usado do mês anterior"
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Carregando...' : 'Rollover'}
      </button>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Saldo a transferir</h3>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              O saldo não utilizado de cada categoria será adicionado ao orçamento deste mês.
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {preview.map(item => (
                <div key={item.category_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.category_name}</span>
                  <div className="text-right">
                    <span className="text-green-600 font-medium">+{formatCurrencyLocal(item.surplus)}</span>
                    {item.curr_amount > 0 && (
                      <p className="text-xs text-gray-400">
                        {formatCurrencyLocal(item.curr_amount)} → {formatCurrencyLocal(item.curr_amount + item.surplus)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {applying ? 'Aplicando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
