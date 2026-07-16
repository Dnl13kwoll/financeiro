export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Faturas dos Cartões' }

import { Header } from '@/components/layout/header'
import { PageTabs } from '@/components/ui/page-tabs'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function CardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const memberRes = await supabase
    .from('couple_members').select('couple_id').eq('user_id', user!.id).limit(1).maybeSingle()
  const coupleId: string | null = (memberRes.data as any)?.couple_id ?? null

  const now = new Date()

  const cardsRes = coupleId
    ? await supabase
        .from('accounts')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('type', 'credit_card')
        .is('deleted_at', null)
        .order('created_at')
    : null

  const cards: any[] = cardsRes?.data ?? []

  // For each card compute current cycle and fetch totals
  const cardSummaries = await Promise.all(
    cards.map(async (card) => {
      const closingDay: number = card.closing_day ?? 1
      const dueDay: number = card.due_day ?? 10

      const closingThisMonth = new Date(now.getFullYear(), now.getMonth(), closingDay)
      let cycleStart: Date
      if (now > closingThisMonth) {
        cycleStart = new Date(now.getFullYear(), now.getMonth(), closingDay + 1)
      } else {
        cycleStart = new Date(now.getFullYear(), now.getMonth() - 1, closingDay + 1)
      }
      const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, closingDay)
      const dueDate = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), dueDay + 1)

      const cycleStartStr = cycleStart.toISOString().slice(0, 10)
      const cycleEndStr = cycleEnd.toISOString().slice(0, 10)
      const todayStr = now.toISOString().slice(0, 10)

      const [txRes, paymentsRes, balanceRes] = await Promise.all([
        supabase.from('transactions')
          .select('amount')
          .eq('account_id', card.id)
          .eq('type', 'expense')
          .gte('date', cycleStartStr)
          .lte('date', cycleEndStr)
          .is('deleted_at', null),
        supabase.from('card_invoice_payments')
          .select('amount')
          .eq('account_id', card.id)
          .gte('paid_at', cycleStartStr)
          .lte('paid_at', cycleEndStr),
        supabase.from('account_balances').select('balance').eq('id', card.id).maybeSingle(),
      ])

      const invoiceTotal = (txRes.data ?? []).reduce((s: number, t: any) => s + t.amount, 0)
      const totalPaid = (paymentsRes.data ?? []).reduce((s: number, p: any) => s + p.amount, 0)
      const remaining = invoiceTotal - totalPaid
      const currentBalance = Math.max(0, -((balanceRes.data as any)?.balance ?? 0))

      const daysUntilClose = Math.ceil((cycleEnd.getTime() - now.getTime()) / 86400000)
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000)
      const closingSoon = daysUntilClose >= 0 && daysUntilClose <= 3
      const dueSoon = daysUntilDue >= 0 && daysUntilDue <= 5
      const isPaid = remaining <= 0 && invoiceTotal > 0

      return {
        ...card,
        invoiceTotal,
        totalPaid,
        remaining,
        currentBalance,
        daysUntilClose,
        daysUntilDue,
        closingSoon,
        dueSoon,
        isPaid,
        cycleEndStr,
        dueDateStr: dueDate.toISOString().slice(0, 10),
      }
    })
  )

  const totalInvoices = cardSummaries.reduce((s, c) => s + c.invoiceTotal, 0)
  const totalRemaining = cardSummaries.reduce((s, c) => s + c.remaining, 0)
  const totalLimit = cardSummaries.reduce((s, c) => s + (c.limit_amount ?? 0), 0)

  return (
    <div className="flex flex-col flex-1">
      <Header title="Contas" />
      <PageTabs tabs={[
        { href: '/accounts', label: 'Contas' },
        { href: '/cards', label: 'Faturas' },
      ]} />

      <div className="p-4 md:p-6 space-y-4 max-w-3xl">
        {cards.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {coupleId ? 'Nenhum cartão de crédito cadastrado.' : 'Crie um casal em Configurações para começar.'}
          </div>
        ) : (
          <>
            {/* Summary header */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Total em faturas</p>
                <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalInvoices)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Ainda a pagar</p>
                <p className={`text-xl font-bold mt-1 ${totalRemaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(totalRemaining)}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-xs text-gray-500">Limite total</p>
                <p className="text-xl font-bold text-gray-700 mt-1">{formatCurrency(totalLimit)}</p>
              </div>
            </div>

            {/* Card list */}
            <div className="space-y-3">
              {cardSummaries.map((card) => {
                const limitPct = card.limit_amount > 0
                  ? Math.min(100, (card.currentBalance / card.limit_amount) * 100)
                  : 0

                return (
                  <Link
                    key={card.id}
                    href={`/cards/${card.id}`}
                    className="block bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-gray-50">
                          <CreditCard className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{card.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Fecha dia {card.closing_day ?? '—'} · Vence dia {card.due_day ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600 text-lg">{formatCurrency(card.invoiceTotal)}</p>
                        {card.isPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                          </span>
                        ) : card.remaining > 0 ? (
                          <p className="text-xs text-orange-600">Restam {formatCurrency(card.remaining)}</p>
                        ) : null}
                      </div>
                    </div>

                    {/* Limit bar */}
                    {card.limit_amount > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Limite usado</span>
                          <span>{limitPct.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${limitPct > 95 ? 'bg-red-600' : limitPct > 80 ? 'bg-red-400' : 'bg-primary-500'}`}
                            style={{ width: `${limitPct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Disponível: <span className="text-green-600 font-medium">{formatCurrency((card.limit_amount ?? 0) - card.currentBalance)}</span>
                          {' '}/ {formatCurrency(card.limit_amount)}
                        </p>
                      </div>
                    )}

                    {/* Alerts */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {card.closingSoon && card.daysUntilClose >= 0 && (
                        <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Fecha {card.daysUntilClose === 0 ? 'hoje' : `em ${card.daysUntilClose}d`}
                        </span>
                      )}
                      {card.dueSoon && !card.isPaid && (
                        <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" />
                          Vence {card.daysUntilDue === 0 ? 'hoje' : `em ${card.daysUntilDue}d`}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
