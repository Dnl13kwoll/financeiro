'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, AlertTriangle, Clock, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ItemType = 'installment' | 'reminder' | 'task'

type TodayItem = {
  id: string
  type: ItemType
  title: string
  due_date: string
  amount?: number | null
}

type RecurringItem = {
  id: string
  name: string
  amount: number
  day_due: number
}

const TYPE_CONFIG: Record<ItemType, { label: string; color: string; bg: string }> = {
  installment: { label: 'Parcela',  color: 'text-red-600',   bg: 'bg-red-50'   },
  reminder:    { label: 'Lembrete', color: 'text-amber-600', bg: 'bg-amber-50' },
  task:        { label: 'Tarefa',   color: 'text-blue-600',  bg: 'bg-blue-50'  },
}

async function markItemDone(supabase: ReturnType<typeof createClient>, item: TodayItem) {
  if (item.type === 'installment') {
    await supabase.from('installment_items').update({ paid: true }).eq('id', item.id)
  } else if (item.type === 'reminder') {
    await supabase.from('financial_reminders').update({ done: true }).eq('id', item.id)
  } else {
    await supabase.from('tasks').update({ status: 'done' }).eq('id', item.id)
  }
}

function ItemCard({ item, loading, onDone }: { item: TodayItem; loading: boolean; onDone: () => void }) {
  const config = TYPE_CONFIG[item.type]
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded shrink-0 ${config.color} ${config.bg}`}>
            {config.label}
          </span>
          {item.amount != null && item.amount > 0 && (
            <span className="text-sm font-semibold text-gray-800 financial-value">{formatCurrency(item.amount)}</span>
          )}
        </div>
        <p className="text-sm text-gray-800 truncate">{item.title}</p>
      </div>
      <button
        onClick={onDone}
        disabled={loading}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
        title="Marcar como concluído"
      >
        {loading
          ? <RefreshCw className="w-4 h-4 animate-spin" />
          : <CheckCircle2 className="w-4 h-4" />
        }
      </button>
    </div>
  )
}

export function TodayClient({
  today,
  overdueItems,
  todayItems,
  recurringToday,
}: {
  today: string
  overdueItems: TodayItem[]
  todayItems: TodayItem[]
  recurringToday: RecurringItem[]
  coupleId: string
}) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  const visible = (items: TodayItem[]) => items.filter(i => !dismissed.has(i.id))

  async function handleDone(item: TodayItem) {
    setLoadingIds(prev => new Set(prev).add(item.id))
    try {
      await markItemDone(supabase, item)
      setDismissed(prev => new Set(prev).add(item.id))
    } finally {
      setLoadingIds(prev => { const n = new Set(prev); n.delete(item.id); return n })
    }
  }

  const overdue  = visible(overdueItems)
  const todayList = visible(todayItems)
  const remaining = overdue.length + todayList.length
  const hadItems  = overdueItems.length + todayItems.length > 0

  const dateLabel = new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto w-full">

      {/* Status banner */}
      <div className={`rounded-xl p-4 border ${remaining === 0 ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
        <div className="flex items-center gap-3">
          {remaining === 0
            ? <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            : <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
          }
          <div>
            <p className={`font-semibold capitalize ${remaining === 0 ? 'text-green-800' : 'text-amber-800'}`}>
              {remaining === 0 ? 'Tudo em dia!' : `${remaining} item${remaining !== 1 ? 'ns' : ''} pendente${remaining !== 1 ? 's' : ''}`}
            </p>
            <p className={`text-xs capitalize ${remaining === 0 ? 'text-green-600' : 'text-amber-600'}`}>
              {dateLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Atrasados ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                loading={loadingIds.has(item.id)}
                onDone={() => handleDone(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Due today */}
      {todayList.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" /> Vence hoje ({todayList.length})
          </h3>
          <div className="space-y-2">
            {todayList.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                loading={loadingIds.has(item.id)}
                onDone={() => handleDone(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All resolved message */}
      {remaining === 0 && hadItems && (
        <div className="text-center py-2">
          <p className="text-green-600 text-sm font-medium">Todos os itens foram resolvidos!</p>
          <button
            onClick={() => router.refresh()}
            className="text-xs text-gray-400 hover:text-gray-700 mt-1 flex items-center gap-1 mx-auto transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Atualizar página
          </button>
        </div>
      )}

      {/* Recurring due today (informational) */}
      {recurringToday.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-400" /> Pagamentos fixos hoje ({recurringToday.length})
          </h3>
          <div className="space-y-2">
            {recurringToday.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-800">{r.name}</span>
                {r.amount > 0 && (
                  <span className="text-sm font-semibold text-gray-700 financial-value">{formatCurrency(r.amount)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {overdueItems.length + todayItems.length + recurringToday.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Nenhum item pendente para hoje.
        </div>
      )}
    </div>
  )
}
