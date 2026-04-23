'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { BellRing, CheckCircle2, Circle, AlertTriangle, Clock, Plus, ChevronRight } from 'lucide-react'
import { differenceInDays, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

interface Reminder {
  id: string
  title: string
  due_date: string
  amount: number | null
  priority: string
  status: string
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function RemindersDashboardCard({ reminders: initial }: { reminders: Reminder[] }) {
  const [reminders, setReminders] = useState<Reminder[]>(initial)

  async function handleDone(r: Reminder) {
    const db = createClient() as any
    const { data } = await db.from('financial_reminders')
      .update({ status: 'concluido' }).eq('id', r.id).select().single()
    if (data) setReminders(prev => prev.map(x => x.id === r.id ? data : x))
  }

  const pending = reminders.filter(r => r.status === 'pendente')
  const visible = pending
    .sort((a, b) => differenceInDays(parseISO(a.due_date), new Date()) - differenceInDays(parseISO(b.due_date), new Date()))
    .slice(0, 5)

  if (pending.length === 0) return null

  const overdueCount = pending.filter(r => differenceInDays(parseISO(r.due_date), new Date()) < 0).length

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <BellRing className="w-4 h-4 text-primary-500" />
          Lembretes
          {overdueCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
              {overdueCount} atrasado{overdueCount !== 1 ? 's' : ''}
            </span>
          )}
        </h3>
        <Link href="/reminders" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
          Ver todos <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {visible.map(r => {
          const diff = differenceInDays(parseISO(r.due_date), new Date())
          const isOverdue = diff < 0
          const isToday = diff === 0
          const isSoon = diff > 0 && diff <= 3

          return (
            <div key={r.id} className={cn(
              'flex items-center gap-3 py-2 px-2 rounded-lg border',
              isOverdue ? 'border-red-100 bg-red-50/50' :
              isToday   ? 'border-amber-100 bg-amber-50/50' :
              isSoon    ? 'border-amber-50 bg-amber-50/30' :
                          'border-transparent'
            )}>
              <button onClick={() => handleDone(r)}
                className="text-gray-300 hover:text-green-500 transition-colors shrink-0">
                <Circle className="w-4 h-4" />
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                <p className={cn('text-xs flex items-center gap-1',
                  isOverdue ? 'text-red-500' : isToday ? 'text-amber-600' : isSoon ? 'text-amber-500' : 'text-gray-400')}>
                  {isOverdue && <AlertTriangle className="w-3 h-3" />}
                  {isToday && <Clock className="w-3 h-3" />}
                  {isOverdue ? `Atrasado ${Math.abs(diff)}d` :
                   isToday   ? 'Hoje!' :
                   isSoon    ? `Em ${diff} dia${diff !== 1 ? 's' : ''}` :
                               format(parseISO(r.due_date), "dd/MM", { locale: ptBR })}
                </p>
              </div>

              {r.amount != null && (
                <span className="text-xs font-medium text-gray-600 shrink-0">
                  {formatCurrency(r.amount)}
                </span>
              )}

              <button onClick={() => handleDone(r)}
                className="text-xs text-gray-400 hover:text-green-600 hover:bg-green-50 px-2 py-0.5 rounded-lg transition-colors shrink-0">
                Feito
              </button>
            </div>
          )
        })}
      </div>

      {pending.length > 5 && (
        <Link href="/reminders" className="mt-2 block text-center text-xs text-gray-400 hover:text-primary-600 transition-colors">
          +{pending.length - 5} lembretes pendentes
        </Link>
      )}
    </section>
  )
}
