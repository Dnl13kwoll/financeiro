'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Event = {
  day: number
  label: string
  amount: number | null
  type: 'installment' | 'recurring'
}

type Props = {
  installmentEvents: { day: number; label: string; amount: number }[]
  recurringEvents: { day: number; label: string; amount: number | null }[]
  currentMonth: number
  currentYear: number
}

export function CommitmentsCalendar({ installmentEvents, recurringEvents, currentMonth, currentYear }: Props) {
  const [monthOffset, setMonthOffset] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const viewDate = new Date(currentYear, currentMonth - 1 + monthOffset, 1)
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth() // 0-indexed
  const viewMonthLabel = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0 = Sunday

  // Filter events for viewed month (only show current month installments by day,
  // recurring events are shown for every month by day_due)
  const allEvents: (Event & { day: number })[] = [
    ...(monthOffset === 0 ? installmentEvents : []).map(e => ({ ...e, type: 'installment' as const })),
    ...recurringEvents.map(e => ({ ...e, type: 'recurring' as const })),
  ]

  // Group by day
  const eventsByDay = new Map<number, Event[]>()
  for (const ev of allEvents) {
    if (ev.day >= 1 && ev.day <= daysInMonth) {
      if (!eventsByDay.has(ev.day)) eventsByDay.set(ev.day, [])
      eventsByDay.get(ev.day)!.push(ev)
    }
  }

  const totalAmount = allEvents.reduce((s, e) => s + (e.amount ?? 0), 0)
  const totalEvents = allEvents.length

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === viewYear && today.getMonth() === viewMonth
  const todayDay = isCurrentMonth ? today.getDate() : -1

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(firstDayOfWeek).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  if (week.length > 0) { weeks.push([...week, ...Array(7 - week.length).fill(null)]) }

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const selectedEvents = selectedDay !== null ? (eventsByDay.get(selectedDay) ?? []) : []

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-600" />
          <span className="font-semibold text-gray-800 text-sm">Calendário de Compromissos</span>
          {totalEvents > 0 && (
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
              {totalEvents} evento{totalEvents !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalAmount > 0 && (
            <span className="text-xs text-gray-500">{formatCurrency(totalAmount)}</span>
          )}
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-50">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <button onClick={() => setMonthOffset(o => o - 1)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 capitalize">{viewMonthLabel}</span>
            <button onClick={() => setMonthOffset(o => o + 1)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day of week headers */}
          <div className="grid grid-cols-7 px-3 pt-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="px-3 pb-3 space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5">
                {week.map((day, di) => {
                  if (!day) return <div key={di} />
                  const events = eventsByDay.get(day) ?? []
                  const isToday = day === todayDay
                  const hasInstall = events.some(e => e.type === 'installment')
                  const hasRecurring = events.some(e => e.type === 'recurring')
                  const isSelected = day === selectedDay
                  return (
                    <button
                      key={di}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`relative flex flex-col items-center py-1 px-0.5 rounded-lg text-xs transition-colors
                        ${isToday ? 'bg-primary-600 text-white font-bold' : ''}
                        ${isSelected && !isToday ? 'bg-primary-100 text-primary-800' : ''}
                        ${!isToday && !isSelected ? 'hover:bg-gray-50 text-gray-700' : ''}
                      `}
                    >
                      <span>{day}</span>
                      {events.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasInstall && <span className="w-1 h-1 rounded-full bg-red-400" />}
                          {hasRecurring && <span className="w-1 h-1 rounded-full bg-blue-400" />}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 pb-2 text-xs text-gray-400">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Parcelas</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Recorrentes</div>
          </div>

          {/* Selected day detail */}
          {selectedDay !== null && selectedEvents.length > 0 && (
            <div className="border-t border-gray-50 px-4 py-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">Dia {selectedDay}:</p>
              {selectedEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${ev.type === 'installment' ? 'bg-red-400' : 'bg-blue-400'}`} />
                    <span className="text-gray-700 truncate max-w-[180px]">{ev.label}</span>
                    <span className={`text-gray-400 ${ev.type === 'installment' ? '' : 'italic'}`}>
                      {ev.type === 'installment' ? 'parcela' : 'recorrente'}
                    </span>
                  </div>
                  <span className="font-medium text-gray-700 shrink-0 ml-2">
                    {ev.amount !== null ? formatCurrency(ev.amount) : 'variável'}
                  </span>
                </div>
              ))}
            </div>
          )}
          {selectedDay !== null && selectedEvents.length === 0 && (
            <div className="border-t border-gray-50 px-4 py-3 text-xs text-gray-400">
              Nenhum compromisso no dia {selectedDay}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
