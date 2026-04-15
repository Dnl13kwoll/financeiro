'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { X, Lock } from 'lucide-react'

type Account = { id: string; name: string }
type Category = { id: string; name: string; type: string }

export function TransactionFilters({
  accounts,
  categories,
}: {
  accounts: Account[]
  categories: Category[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<'month' | 'range'>(
    searchParams.get('date_from') ? 'range' : 'month'
  )

  const FILTER_KEYS = ['month', 'date_from', 'date_to', 'type', 'category_id', 'account_id', 'q', 'tag', 'private']
  const hasActiveFilters = FILTER_KEYS.some(k => !!searchParams.get(k))
  const privateOnly = searchParams.get('private') === '1'

  function clearFilters() {
    setMode('month')
    router.push('/transactions')
  }

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/transactions?${params.toString()}`)
  }, [router, searchParams])

  function switchMode(m: 'month' | 'range') {
    setMode(m)
    const params = new URLSearchParams(searchParams.toString())
    if (m === 'month') {
      params.delete('date_from')
      params.delete('date_to')
    } else {
      params.delete('month')
    }
    router.push(`/transactions?${params.toString()}`)
  }

  function applyQuickRange(type: 'week' | 'month' | 'last30') {
    const now = new Date()
    let from: string, to: string
    if (type === 'week') {
      const day = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((day + 6) % 7))
      from = monday.toISOString().slice(0, 10)
      to = now.toISOString().slice(0, 10)
    } else if (type === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    } else {
      const past = new Date(now)
      past.setDate(now.getDate() - 30)
      from = past.toISOString().slice(0, 10)
      to = now.toISOString().slice(0, 10)
    }
    setMode('range')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('month')
    params.set('date_from', from)
    params.set('date_to', to)
    router.push(`/transactions?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        <button
          onClick={() => switchMode('month')}
          className={`px-3 py-1.5 transition-colors ${mode === 'month' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Mês
        </button>
        <button
          onClick={() => switchMode('range')}
          className={`px-3 py-1.5 transition-colors ${mode === 'range' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Período
        </button>
      </div>

      {mode === 'month' ? (
        <input
          type="month"
          defaultValue={searchParams.get('month') ?? ''}
          onChange={e => update('month', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      ) : (
        <>
          <input
            type="date"
            defaultValue={searchParams.get('date_from') ?? ''}
            onChange={e => update('date_from', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <span className="self-center text-gray-400 text-sm">até</span>
          <input
            type="date"
            defaultValue={searchParams.get('date_to') ?? ''}
            onChange={e => update('date_to', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </>
      )}

      {/* Quick date buttons */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
        <button onClick={() => applyQuickRange('week')} className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors">Esta semana</button>
        <button onClick={() => applyQuickRange('month')} className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition-colors">Este mês</button>
        <button onClick={() => applyQuickRange('last30')} className="px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 border-l border-gray-200 transition-colors">Últimos 30d</button>
      </div>

      <select
        defaultValue={searchParams.get('type') ?? ''}
        onChange={e => update('type', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Todos os tipos</option>
        <option value="expense">Saída</option>
        <option value="income">Entrada</option>
        <option value="transfer">Transferência</option>
      </select>
      <select
        defaultValue={searchParams.get('category_id') ?? ''}
        onChange={e => update('category_id', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Todas as categorias</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get('account_id') ?? ''}
        onChange={e => update('account_id', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">Todas as contas</option>
        {accounts.map(a => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Buscar..."
        defaultValue={searchParams.get('q') ?? ''}
        onChange={e => update('q', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-32"
      />
      <input
        type="text"
        placeholder="Tag..."
        defaultValue={searchParams.get('tag') ?? ''}
        onChange={e => update('tag', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-24"
      />

      {/* Private only toggle */}
      <button
        onClick={() => update('private', privateOnly ? '' : '1')}
        title="Mostrar apenas transações privadas"
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
          privateOnly
            ? 'bg-gray-800 text-white border-gray-800'
            : 'text-gray-500 border-gray-200 hover:bg-gray-50'
        }`}
      >
        <Lock className="w-3.5 h-3.5" />
        Privadas
      </button>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="Limpar todos os filtros"
        >
          <X className="w-3.5 h-3.5" />
          Limpar
        </button>
      )}
    </div>
  )
}
