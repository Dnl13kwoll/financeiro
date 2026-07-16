export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TimelineFilters } from '@/components/features/timeline/timeline-filters'
import { CalendarClock, RefreshCw, Layers } from 'lucide-react'

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = await searchParams

  const memberRes = await supabase
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', user!.id)
    .limit(1)
    .maybeSingle()

  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const days = parseInt(params.days ?? '30')
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + days)
  const futureDateStr = futureDate.toISOString().slice(0, 10)

  const [installmentItemsRes, recurringRes] = await Promise.all([
    coupleId
      ? supabase
          .from('installment_items')
          .select('*, installments(description, account_id, accounts(name))')
          .eq('paid', false)
          .eq('canceled', false)
          .gte('due_date', todayStr)
          .lte('due_date', futureDateStr)
          .order('due_date')
      : Promise.resolve(null),
    coupleId
      ? supabase
          .from('recurring_accounts')
          .select('*')
          .eq('couple_id', coupleId)
          .eq('active', true)
      : Promise.resolve(null),
  ])

  const installmentItems: any[] = installmentItemsRes?.data ?? []
  const recurring: any[] = recurringRes?.data ?? []

  // Generate recurring occurrences within the window
  type TimelineEvent = {
    id: string
    date: string
    label: string
    amount: number
    source: 'installment' | 'recurring'
    detail: string
    daysFromNow: number
  }

  const events: TimelineEvent[] = []

  // Add installment items
  for (const item of installmentItems) {
    const inst = item.installments as any
    const account = inst?.accounts as any
    events.push({
      id: item.id,
      date: item.due_date,
      label: inst?.description ?? 'Parcela',
      amount: item.amount,
      source: 'installment',
      detail: account?.name ? `Conta: ${account.name}` : '',
      daysFromNow: Math.ceil((new Date(item.due_date).getTime() - today.getTime()) / 86400000),
    })
  }

  // Generate recurring dates
  for (const rec of recurring) {
    const dayDue: number = rec.day_due
    // Check this month and next months within window
    for (let mOffset = 0; mOffset <= 3; mOffset++) {
      const checkDate = new Date(today.getFullYear(), today.getMonth() + mOffset, dayDue)
      const checkStr = checkDate.toISOString().slice(0, 10)
      if (checkStr >= todayStr && checkStr <= futureDateStr) {
        events.push({
          id: `rec-${rec.id}-${checkStr}`,
          date: checkStr,
          label: rec.name,
          amount: rec.amount ?? 0,
          source: 'recurring',
          detail: rec.amount ? '' : 'Valor variável',
          daysFromNow: Math.ceil((checkDate.getTime() - today.getTime()) / 86400000),
        })
      }
    }
  }

  // Sort by date
  events.sort((a, b) => a.date.localeCompare(b.date))

  // Group by date
  const grouped = new Map<string, TimelineEvent[]>()
  for (const ev of events) {
    if (!grouped.has(ev.date)) grouped.set(ev.date, [])
    grouped.get(ev.date)!.push(ev)
  }

  const totalAmount = events.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Análise" />
      <PageTabs tabs={[
        { href: '/reports', label: 'Relatórios' },
        { href: '/insights', label: 'Insights' },
        { href: '/projection', label: 'Projeção' },
        { href: '/planning', label: 'Planejamento' },
        { href: '/networth', label: 'Patrimônio' },
        { href: '/timeline', label: 'Linha do Tempo' },
      ]} />

      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TimelineFilters currentDays={days} />
          {events.length > 0 && (
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{events.length}</span> vencimentos ·{' '}
              <span className="font-semibold text-red-600">{formatCurrency(totalAmount)}</span> total
            </div>
          )}
        </div>

        {events.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? `Nenhum vencimento nos próximos ${days} dias.` : 'Crie um casal em Configurações para começar.'}
          </div>
        )}

        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([date, dayEvents]) => {
            const dateObj = new Date(date + 'T12:00:00')
            const isToday = date === todayStr
            const isTomorrow = dayEvents[0].daysFromNow === 1
            let dateLabel = formatDate(date)
            if (isToday) dateLabel = 'Hoje'
            else if (isTomorrow) dateLabel = 'Amanhã'

            const dayTotal = dayEvents.reduce((s, e) => s + e.amount, 0)

            return (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                    isToday ? 'bg-red-100 text-red-700' :
                    isTomorrow ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <CalendarClock className="w-3.5 h-3.5" />
                    {dateLabel}
                    {!isToday && !isTomorrow && (
                      <span className="opacity-70">· em {dayEvents[0].daysFromNow}d</span>
                    )}
                  </div>
                  {dayTotal > 0 && (
                    <span className="text-xs text-gray-400">{formatCurrency(dayTotal)}</span>
                  )}
                </div>

                {/* Events for this date */}
                <div className="space-y-2 ml-2 border-l-2 border-gray-100 pl-4">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${ev.source === 'recurring' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                          {ev.source === 'recurring'
                            ? <RefreshCw className="w-4 h-4 text-blue-500" />
                            : <Layers className="w-4 h-4 text-purple-500" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{ev.label}</p>
                          {ev.detail && (
                            <p className="text-xs text-gray-400 mt-0.5">{ev.detail}</p>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            ev.source === 'recurring'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-purple-50 text-purple-600'
                          }`}>
                            {ev.source === 'recurring' ? 'Recorrente' : 'Parcela'}
                          </span>
                        </div>
                      </div>
                      {ev.amount > 0 ? (
                        <p className="font-semibold text-red-600">{formatCurrency(ev.amount)}</p>
                      ) : (
                        <p className="text-sm text-gray-400">—</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
