'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

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

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/transactions?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="month"
        defaultValue={searchParams.get('month') ?? ''}
        onChange={e => update('month', e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
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
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-36"
      />
    </div>
  )
}
