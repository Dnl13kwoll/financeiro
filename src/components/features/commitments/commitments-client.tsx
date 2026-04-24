'use client'

import { useState } from 'react'
import { RefreshCw, Tv, ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const CYCLE_MONTHLY: Record<string, number> = {
  semanal: 4.33,
  mensal: 1,
  bimestral: 0.5,
  trimestral: 1 / 3,
  semestral: 1 / 6,
  anual: 1 / 12,
}

function toMonthly(cost: number, cycle: string): number {
  return cost * (CYCLE_MONTHLY[cycle] ?? 1)
}

type Recurring = {
  id: string
  name: string
  amount: number | null
  day_due: number
  active: boolean
  categories: { name: string } | null
}

type Subscription = {
  id: string
  name: string
  cost: number
  billing_cycle: string
  category: string
  renewal_date: string | null
  active: boolean
  color: string | null
}

type Tab = 'all' | 'recurring' | 'subscriptions'

export function CommitmentsClient({
  recurring,
  subscriptions,
}: {
  recurring: Recurring[]
  subscriptions: Subscription[]
}) {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const activeRecurring = recurring.filter(r => showInactive ? true : r.active)
  const activeSubscriptions = subscriptions.filter(s => showInactive ? true : s.active)

  const filteredRecurring = activeRecurring.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )
  const filteredSubscriptions = activeSubscriptions.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalRecurring = recurring
    .filter(r => r.active && r.amount)
    .reduce((s, r) => s + (r.amount ?? 0), 0)

  const totalSubscriptions = subscriptions
    .filter(s => s.active)
    .reduce((s, sub) => s + toMonthly(sub.cost, sub.billing_cycle), 0)

  const grandTotal = totalRecurring + totalSubscriptions

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: filteredRecurring.length + filteredSubscriptions.length },
    { key: 'recurring', label: 'Recorrentes', count: filteredRecurring.length },
    { key: 'subscriptions', label: 'Assinaturas', count: filteredSubscriptions.length },
  ]

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3" /> Recorrentes/mês
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1 financial-value">{fmt(totalRecurring)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Tv className="w-3 h-3" /> Assinaturas/mês
          </p>
          <p className="text-lg font-bold text-gray-900 mt-1 financial-value">{fmt(totalSubscriptions)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm border-l-4 border-l-primary-400">
          <p className="text-xs text-gray-500">Total fixo/mês</p>
          <p className="text-lg font-bold text-primary-600 mt-1 financial-value">{fmt(grandTotal)}</p>
          <p className="text-xs text-gray-400 mt-0.5 financial-value">{fmt(grandTotal * 12)}/ano</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
          Mostrar inativos
        </label>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-1.5 transition-colors flex items-center gap-1.5',
              tab === t.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            {t.label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === t.key ? 'bg-white/20' : 'bg-gray-100 text-gray-500')}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Recurring list */}
      {(tab === 'all' || tab === 'recurring') && filteredRecurring.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 text-sm">Contas Recorrentes</h3>
            </div>
            <Link href="/recurring" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Gerenciar <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredRecurring.map(r => (
              <div key={r.id} className={cn('flex items-center justify-between px-4 py-3', !r.active && 'opacity-50')}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', r.active ? 'bg-green-500' : 'bg-gray-300')} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400">
                      Dia {r.day_due}
                      {r.categories?.name && ` · ${r.categories.name}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 financial-value">
                    {r.amount ? fmt(r.amount) : '—'}
                  </p>
                  <p className="text-xs text-gray-400">por mês</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between">
            <span className="text-xs font-semibold text-gray-600">Total recorrentes</span>
            <span className="text-xs font-bold text-gray-900 financial-value">{fmt(totalRecurring)}/mês</span>
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      {(tab === 'all' || tab === 'subscriptions') && filteredSubscriptions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 text-sm">Assinaturas</h3>
            </div>
            <Link href="/subscriptions" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Gerenciar <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredSubscriptions.map(s => {
              const monthly = toMonthly(s.cost, s.billing_cycle)
              const renewSoon = s.renewal_date && s.renewal_date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
              return (
                <div key={s.id} className={cn('flex items-center justify-between px-4 py-3', !s.active && 'opacity-50')}>
                  <div className="flex items-center gap-3">
                    {s.color ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: s.color }}>
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-primary-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        {renewSoon && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Renova em breve</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {s.category}
                        {s.billing_cycle !== 'mensal' && ` · ${s.billing_cycle}`}
                        {s.renewal_date && ` · renova ${new Date(s.renewal_date + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 financial-value">{fmt(monthly)}</p>
                    {s.billing_cycle !== 'mensal' && (
                      <p className="text-xs text-gray-400 financial-value">{fmt(s.cost)}/{s.billing_cycle.slice(0, 3)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between">
            <span className="text-xs font-semibold text-gray-600">Total assinaturas</span>
            <span className="text-xs font-bold text-gray-900 financial-value">{fmt(totalSubscriptions)}/mês</span>
          </div>
        </div>
      )}

      {filteredRecurring.length === 0 && filteredSubscriptions.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          {search ? 'Nenhum resultado para a busca.' : 'Nenhum compromisso fixo cadastrado.'}
        </div>
      )}
    </div>
  )
}
