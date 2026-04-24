'use client'
import { useState, useTransition} from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { showToast } from '@/components/ui/toast'
import { Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

type Suggestion = {
  category_id: string
  category_name: string
  avg: number
  months: number
}

export function SuggestBudgetsButton({
  coupleId,
  currentMonth,
}: {
  coupleId: string
  currentMonth: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function loadSuggestions() {
    setLoading(true)
    const supabase = createClient()

    // Last 3 months
    const now = new Date(currentMonth)
    const months: string[] = []
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(d.toISOString().slice(0, 10))
    }

    const monthEnds = months.map(m => {
      const d = new Date(m)
      return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
    })

    // Fetch expenses for last 3 months
    const results = await Promise.all(
      months.map((mStart, i) =>
        (supabase.from('transactions') as any)
          .select('category_id, amount, categories(name)')
          .eq('couple_id', coupleId)
          .eq('type', 'expense')
          .gte('competence_date', mStart)
          .lte('competence_date', monthEnds[i])
          .is('deleted_at', null)
      )
    )

    // Aggregate by category
    const catMap = new Map<string, { name: string; totals: number[] }>()
    results.forEach(({ data }) => {
      if (!data) return
      const monthTotals = new Map<string, number>()
      for (const tx of data as any[]) {
        if (!tx.category_id) continue
        monthTotals.set(tx.category_id, (monthTotals.get(tx.category_id) ?? 0) + tx.amount)
        if (!catMap.has(tx.category_id)) {
          catMap.set(tx.category_id, { name: tx.categories?.name ?? '?', totals: [] })
        }
      }
      for (const [catId, total] of monthTotals.entries()) {
        catMap.get(catId)!.totals.push(total)
      }
    })

    const suggs: Suggestion[] = Array.from(catMap.entries())
      .map(([category_id, { name, totals }]) => ({
        category_id,
        category_name: name,
        avg: Math.ceil(totals.reduce((s, v) => s + v, 0) / totals.length),
        months: totals.length,
      }))
      .filter(s => s.avg > 0)
      .sort((a, b) => b.avg - a.avg)

    setSuggestions(suggs)
    setSelected(new Set(suggs.map(s => s.category_id)))
    setLoading(false)
  }

  async function handleApply() {
    setLoading(true)
    const supabase = createClient()
    const toApply = suggestions.filter(s => selected.has(s.category_id))

    for (const s of toApply) {
      await (supabase.from('budgets') as any).upsert(
        { couple_id: coupleId, month: currentMonth, category_id: s.category_id, amount: s.avg },
        { onConflict: 'couple_id,month,category_id' }
      )
    }

    setLoading(false)
    setOpen(false)
    showToast(`${toApply.length} orçamentos criados/atualizados!`)
    startTransition(() => { router.refresh() })
  }

  function toggleAll() {
    if (selected.size === suggestions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(suggestions.map(s => s.category_id)))
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); loadSuggestions() }}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        title="Sugerir orçamentos com base no histórico"
      >
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Sugerir
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Sugestão de Orçamentos">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Baseado na média dos últimos 3 meses de gastos por categoria.
          </p>

          {loading && (
            <p className="text-sm text-gray-400 text-center py-6">Calculando...</p>
          )}

          {!loading && suggestions.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Sem histórico suficiente nos últimos 3 meses.</p>
          )}

          {!loading && suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{suggestions.length} categorias encontradas</span>
                <button onClick={toggleAll} className="text-xs text-primary-600 hover:underline">
                  {selected.size === suggestions.length ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {suggestions.map(s => (
                  <label key={s.category_id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(s.category_id)}
                      onChange={e => {
                        const next = new Set(selected)
                        if (e.target.checked) next.add(s.category_id)
                        else next.delete(s.category_id)
                        setSelected(next)
                      }}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{s.category_name}</p>
                      <p className="text-xs text-gray-400">média de {s.months} {s.months === 1 ? 'mês' : 'meses'}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(s.avg)}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancelar</button>
                <button
                  onClick={handleApply}
                  disabled={loading || selected.size === 0}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  Aplicar {selected.size} orçamentos
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
