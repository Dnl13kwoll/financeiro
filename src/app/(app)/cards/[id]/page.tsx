import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Fatura do Cartão' }
export const dynamic = 'force-dynamic'

import { Header } from '@/components/layout/header'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { CardInvoicePayment } from '@/components/features/accounts/card-invoice-payment'

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ cycle?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { id } = await params
  const sp = await searchParams

  const memberRes = await supabase.from('couple_members').select('couple_id').eq('user_id', user!.id).limit(1).maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const accountRes = await supabase.from('accounts').select('*').eq('id', id).single()
  const account: any = accountRes.data
  if (!account || account.type !== 'credit_card') {
    return <div className="p-6 text-gray-500">Cartão não encontrado.</div>
  }

  const closingDay: number = account.closing_day ?? 1
  const dueDay: number = account.due_day ?? 10
  const now = new Date()

  // Determine billing cycle start/end from ?cycle=YYYY-MM or current
  let cycleStart: Date
  if (sp.cycle) {
    const [y, m] = sp.cycle.split('-').map(Number)
    cycleStart = new Date(y, m - 1, closingDay + 1)
  } else {
    // Current cycle: from last closing day to next closing day
    const closingThisMonth = new Date(now.getFullYear(), now.getMonth(), closingDay)
    if (now > closingThisMonth) {
      cycleStart = new Date(now.getFullYear(), now.getMonth(), closingDay + 1)
    } else {
      cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, closingDay + 1)
    }
  }
  const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, closingDay)
  const dueDate = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), dueDay + 1)

  const cycleStartStr = cycleStart.toISOString().slice(0, 10)
  const cycleEndStr = cycleEnd.toISOString().slice(0, 10)

  // Prev/next cycle
  const prevCycleDate = new Date(cycleStart.getFullYear(), cycleStart.getMonth() - 1, 1)
  const nextCycleDate = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 1)
  const prevCycle = `${prevCycleDate.getFullYear()}-${String(prevCycleDate.getMonth() + 1).padStart(2, '0')}`
  const nextCycle = `${nextCycleDate.getFullYear()}-${String(nextCycleDate.getMonth() + 1).padStart(2, '0')}`

  const [txRes, paymentsRes, balanceRes] = await Promise.all([
    supabase.from('transactions').select('*, categories(name)').eq('account_id', id).eq('type', 'expense').gte('date', cycleStartStr).lte('date', cycleEndStr).is('deleted_at', null).order('date', { ascending: false }),
    supabase.from('card_invoice_payments').select('*').eq('account_id', id).gte('paid_at', cycleStartStr).lte('paid_at', cycleEndStr).order('paid_at', { ascending: false }),
    supabase.from('account_balances').select('*').eq('id', id).single(),
  ])

  const transactions: any[] = txRes.data ?? []
  const payments: any[] = paymentsRes.data ?? []
  const currentBalance: number = (balanceRes.data as any)?.balance ?? 0
  const invoiceTotal = transactions.reduce((s, t) => s + t.amount, 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = invoiceTotal - totalPaid

  // Group by category
  const catMap = new Map<string, number>()
  transactions.forEach(t => {
    const name = (t.categories as any)?.name ?? 'Sem categoria'
    catMap.set(name, (catMap.get(name) ?? 0) + t.amount)
  })
  const catBreakdown = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])

  // Projeção da fatura
  const isCurrentCycle = !sp.cycle
  const daysElapsedInCycle = isCurrentCycle
    ? Math.max(1, Math.ceil((now.getTime() - cycleStart.getTime()) / 86400000))
    : null
  const daysInCycle = Math.max(1, Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / 86400000))
  const projectedInvoice = daysElapsedInCycle && daysElapsedInCycle < daysInCycle && invoiceTotal > 0
    ? Math.round((invoiceTotal / daysElapsedInCycle) * daysInCycle)
    : null

  const cycleLabel = cycleStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col flex-1">
      <Header title={account.name} />

      <div className="p-4 md:p-6 space-y-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/accounts" className="text-gray-400 hover:text-gray-700 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Contas
          </Link>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Link href={`/cards/${id}?cycle=${prevCycle}`} className="hover:text-gray-900">← Anterior</Link>
            <span className="font-medium text-gray-900 capitalize">{cycleLabel}</span>
            <Link href={`/cards/${id}?cycle=${nextCycle}`} className="hover:text-gray-900">Próxima →</Link>
          </div>
        </div>

        {/* Invoice summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">{account.name}</p>
              <p className="text-xs text-gray-400">
                Fecha dia {closingDay} · Vence dia {dueDay} ({formatDate(dueDate.toISOString().slice(0, 10))})
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div>
              <p className="text-xs text-gray-500">Total da fatura</p>
              <p className="text-xl font-bold text-red-600 financial-value">{formatCurrency(invoiceTotal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pago</p>
              <p className="text-xl font-bold text-green-600 financial-value">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Restante</p>
              <p className={`text-xl font-bold financial-value ${remaining > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{formatCurrency(remaining)}</p>
            </div>
          </div>
          {account.limit_amount && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Limite usado: {formatCurrency(invoiceTotal)} / {formatCurrency(account.limit_amount)}</span>
                <span>{Math.round((invoiceTotal / account.limit_amount) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${(invoiceTotal / account.limit_amount) > 0.8 ? 'bg-red-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min(100, (invoiceTotal / account.limit_amount) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {projectedInvoice && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">Projeção do ciclo completo</span>
              <span className={`font-semibold financial-value ${projectedInvoice > (account.limit_amount ?? Infinity) * 0.8 ? 'text-red-600' : 'text-orange-600'}`}>
                ~{formatCurrency(projectedInvoice)}
              </span>
            </div>
          )}
        </div>

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Por categoria</h3>
            <div className="space-y-2">
              {catBreakdown.map(([name, total]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">{name}</span>
                  <span className="text-sm font-medium text-gray-900 financial-value">{formatCurrency(total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment registration */}
        {coupleId && (
          <CardInvoicePayment
            accountId={id}
            coupleId={coupleId}
            userId={user!.id}
            invoiceTotal={invoiceTotal}
            totalPaid={totalPaid}
            payments={payments}
          />
        )}

        {/* Transactions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">{transactions.length} lançamentos</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Nenhum lançamento neste ciclo.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm text-gray-900">{t.description ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(t.date)}
                      {(t.categories as any)?.name ? ` · ${(t.categories as any).name}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-600 financial-value">-{formatCurrency(t.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
