'use client'
import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { CreditCard, Banknote, Building2, GripVertical } from 'lucide-react'
import { AccountActions } from './account-actions'
import Link from 'next/link'

type AccountItem = {
  id: string
  name: string
  type: 'cash' | 'bank' | 'credit_card'
  color?: string | null
  sort_order?: number | null
  limit_amount?: number | null
  closing_day?: number | null
  due_day?: number | null
  min_balance_alert?: number | null
  [key: string]: any
}

const TYPE_LABEL = { cash: 'Dinheiro', bank: 'Banco', credit_card: 'Cartão de Crédito' } as const
const TYPE_ICON  = { cash: Banknote,   bank: Building2, credit_card: CreditCard } as const

export function AccountsDragGrid({
  initialAccounts,
  balances,
  forecastDeducts,
}: {
  initialAccounts: AccountItem[]
  balances: { id: string; balance: number | null }[]
  forecastDeducts: { id: string; amount: number }[]
}) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [isDragging, setIsDragging] = useState(false)
  const dragIdx = useRef<number | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const balanceMap    = new Map(balances.map(b => [b.id, b.balance ?? 0]))
  const forecastMap   = new Map(forecastDeducts.map(f => [f.id, f.amount]))

  function onDragStart(idx: number) {
    dragIdx.current = idx
    setIsDragging(true)
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === idx) return
    const next = [...accounts]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(idx, 0, moved)
    dragIdx.current = idx
    setAccounts(next)
  }

  async function onDrop() {
    setIsDragging(false)
    const supabase = createClient()
    await Promise.all(
      accounts.map((a, i) => supabase.from('accounts').update({ sort_order: i * 10 }).eq('id', a.id))
    )
    startTransition(() => { router.refresh() })
    dragIdx.current = null
  }

  function onDragEnd() {
    setIsDragging(false)
    dragIdx.current = null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map((account, idx) => {
        const TypeIcon = TYPE_ICON[account.type]

        const cardProps = {
          draggable: true,
          onDragStart: () => onDragStart(idx),
          onDragOver:  (e: React.DragEvent) => onDragOver(e, idx),
          onDrop,
          onDragEnd,
          className: `bg-white rounded-xl border border-gray-100 p-5 shadow-sm relative select-none ${isDragging ? 'cursor-grabbing' : ''}`,
        }

        const DragHandle = () => (
          <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 relative z-10 transition-colors hidden md:block" title="Arrastar para reordenar">
            <GripVertical className="w-4 h-4" />
          </div>
        )

        const Header = () => (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-500">
              <DragHandle />
              {account.color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: account.color }} />}
              <TypeIcon className="w-5 h-5" />
              <span className="text-xs">{TYPE_LABEL[account.type]}</span>
            </div>
            <div className="relative z-10">
              <AccountActions account={account} />
            </div>
          </div>
        )

        if (account.type === 'credit_card') {
          const used      = Math.max(0, -(balanceMap.get(account.id) ?? 0))
          const limit     = account.limit_amount ?? 0
          const available = limit - used
          const pct       = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

          return (
            <div key={account.id} {...cardProps}>
              <Link href={`/accounts/${account.id}`} className="absolute inset-0 rounded-xl" aria-label={account.name} />
              <Header />
              <p className="font-semibold text-gray-900">{account.name}</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Usado</span>
                  <span className="font-semibold text-red-600">{formatCurrency(used)}</span>
                </div>
                {limit > 0 && (
                  <>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${pct > 95 ? 'bg-red-600' : pct > 80 ? 'bg-red-400' : 'bg-primary-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Disponível: <span className="text-green-600 font-medium">{formatCurrency(available)}</span></span>
                      <span>{pct.toFixed(0)}% usado</span>
                    </div>
                    {pct > 80 && (
                      <p className={`text-xs font-medium ${pct > 95 ? 'text-red-600' : 'text-amber-600'}`}>
                        ⚠ {pct > 95 ? 'Limite crítico!' : 'Acima de 80% do limite'}
                      </p>
                    )}
                    {limit > 0 && (
                      <p className="text-xs text-gray-400">Limite: {formatCurrency(limit)}</p>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">
                  {account.closing_day ? `Fecha dia ${account.closing_day}` : ''}
                  {account.closing_day && account.due_day ? ' · ' : ''}
                  {account.due_day ? `Vence dia ${account.due_day}` : ''}
                </p>
                <a href={`/cards/${account.id}`} className="text-xs text-primary-600 hover:underline relative z-10" onClick={e => e.stopPropagation()}>
                  Ver fatura →
                </a>
              </div>
            </div>
          )
        }

        // bank / cash
        const bal       = balanceMap.get(account.id) ?? 0
        const minAlert  = account.min_balance_alert
        const belowAlert = minAlert != null && bal < minAlert

        return (
          <div key={account.id} {...cardProps}>
            <Link href={`/accounts/${account.id}`} className="absolute inset-0 rounded-xl" aria-label={account.name} />
            <Header />
            <p className="font-semibold text-gray-900">{account.name}</p>
            <p className={`text-2xl font-bold mt-2 financial-value ${belowAlert ? 'text-red-600' : 'text-primary-600'}`}>
              {formatCurrency(bal)}
            </p>
            {belowAlert && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                ⚠ Saldo abaixo de {formatCurrency(minAlert!)}
              </p>
            )}
            {forecastMap.has(account.id) && (
              <p className="text-xs text-orange-500 mt-0.5">
                Previsão 30d: {formatCurrency(bal - (forecastMap.get(account.id) ?? 0))}
              </p>
            )}
          </div>
        )
      })}

      {accounts.length === 0 && (
        <div className="col-span-full text-center py-16 text-gray-400">
          Nenhuma conta cadastrada ainda.
        </div>
      )}
    </div>
  )
}
