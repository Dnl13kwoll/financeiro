import Link from 'next/link'
import { CheckCircle2, AlertCircle, Calendar, RefreshCw, Layers } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type BillItem = {
  id: string
  label: string
  amount: number | null
  dueDate: string
  paid: boolean
  type: 'installment' | 'recurring'
  href: string
}

function dayOfWeekLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

export function UpcomingBillsWidget({
  installments,
  recurring,
  today,
  currentMonthStart,
}: {
  installments: { id: string; due_date: string; amount: number; installments: any }[]
  recurring: { id: string; name: string; day_due: number; amount: number | null; paid?: boolean }[]
  today: string
  currentMonthStart: string
}) {
  const now = new Date(today + 'T00:00:00')
  const year = now.getFullYear()
  const month = now.getMonth()

  const bills: BillItem[] = [
    ...installments.map(item => ({
      id: item.id,
      label: item.installments?.description ?? 'Parcela',
      amount: item.amount,
      dueDate: item.due_date,
      paid: false,
      type: 'installment' as const,
      href: '/installments',
    })),
    ...recurring.map(rec => {
      const day = Math.min(rec.day_due, new Date(year, month + 1, 0).getDate())
      const dueDate = new Date(year, month, day).toISOString().slice(0, 10)
      return {
        id: rec.id,
        label: rec.name,
        amount: rec.amount,
        dueDate,
        paid: rec.paid ?? false,
        type: 'recurring' as const,
        href: '/recurring',
      }
    }),
  ].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

  const unpaid = bills.filter(b => !b.paid)
  const paid = bills.filter(b => b.paid)
  const totalDue = unpaid.reduce((s, b) => s + (b.amount ?? 0), 0)
  const overdue = unpaid.filter(b => b.dueDate < today)

  if (bills.length === 0) {
    return (
      <section data-widget="upcoming_bills" className="bg-green-50 border border-green-100 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Semana tranquila!</p>
            <p className="text-xs text-green-600">Nenhuma conta vencendo nos próximos 7 dias.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section data-widget="upcoming_bills" className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900 text-sm">Contas a pagar — próximos 7 dias</h3>
        </div>
        <div className="flex items-center gap-3">
          {overdue.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {overdue.length} em atraso
            </span>
          )}
          {totalDue > 0 && (
            <span className="text-sm font-bold text-gray-700">{formatCurrency(totalDue)}</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {unpaid.map(bill => {
          const isOverdue = bill.dueDate < today
          const isToday = bill.dueDate === today
          return (
            <Link
              key={bill.id}
              href={bill.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors hover:bg-gray-50',
                isOverdue ? 'border-red-100 bg-red-50/50' : isToday ? 'border-orange-100 bg-orange-50/50' : 'border-gray-100'
              )}
            >
              <div className={cn(
                'w-1.5 h-8 rounded-full shrink-0',
                isOverdue ? 'bg-red-400' : isToday ? 'bg-orange-400' : 'bg-gray-200'
              )} />

              <div className="p-1 rounded-lg bg-gray-100 shrink-0">
                {bill.type === 'recurring'
                  ? <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                  : <Layers className="w-3.5 h-3.5 text-gray-500" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{bill.label}</p>
                <p className={cn(
                  'text-xs',
                  isOverdue ? 'text-red-500 font-medium' : isToday ? 'text-orange-500 font-medium' : 'text-gray-400'
                )}>
                  {dayOfWeekLabel(bill.dueDate)}
                  {isOverdue && ' · Atrasada'}
                </p>
              </div>

              <div className="text-right shrink-0">
                {bill.amount != null
                  ? <p className={cn('text-sm font-semibold', isOverdue ? 'text-red-600' : 'text-gray-700')}>{formatCurrency(bill.amount)}</p>
                  : <p className="text-xs text-gray-400">—</p>
                }
              </div>
            </Link>
          )
        })}

        {paid.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
            <p className="text-xs text-gray-400">{paid.length} conta{paid.length !== 1 ? 's' : ''} já paga{paid.length !== 1 ? 's' : ''} esta semana</p>
          </div>
        )}
      </div>
    </section>
  )
}
