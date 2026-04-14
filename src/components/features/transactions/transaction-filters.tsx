'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

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
    </div>
  )
}
