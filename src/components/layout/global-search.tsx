'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, X } from 'lucide-react'

type Result = {
  type: 'transaction' | 'installment' | 'recurring'
  id: string
  label: string
  sub: string
  href: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()

      const [txRes, instRes, recRes] = await Promise.all([
        (supabase.from('transactions') as any)
          .select('id, description, amount, date, type')
          .ilike('description', `%${query}%`)
          .is('deleted_at', null)
          .limit(5),
        (supabase.from('installments') as any)
          .select('id, description, total_amount')
          .ilike('description', `%${query}%`)
          .limit(5),
        (supabase.from('recurring_accounts') as any)
          .select('id, name, day_due')
          .ilike('name', `%${query}%`)
          .eq('active', true)
          .limit(5),
      ])

      const items: Result[] = [
        ...(txRes.data ?? []).map((t: any) => ({
          type: 'transaction' as const,
          id: t.id,
          label: t.description ?? '—',
          sub: `${t.type === 'expense' ? 'Saída' : t.type === 'income' ? 'Entrada' : 'Transferência'} · R$ ${t.amount?.toFixed(2)} · ${t.date}`,
          href: '/transactions',
        })),
        ...(instRes.data ?? []).map((i: any) => ({
          type: 'installment' as const,
          id: i.id,
          label: i.description,
          sub: `Parcelamento · R$ ${i.total_amount?.toFixed(2)}`,
          href: '/installments',
        })),
        ...(recRes.data ?? []).map((r: any) => ({
          type: 'recurring' as const,
          id: r.id,
          label: r.name,
          sub: `Recorrente · vence dia ${r.day_due}`,
          href: '/recurring',
        })),
      ]
      setResults(items)
      setLoading(false)
    }, 300)
  }, [query])

  function handleSelect(href: string) {
    setOpen(false)
    setQuery('')
    setResults([])
    router.push(href)
  }

  const typeLabel = { transaction: 'Transação', installment: 'Parcelamento', recurring: 'Recorrente' }
  const typeBg = { transaction: 'bg-blue-50 text-blue-600', installment: 'bg-purple-50 text-purple-600', recurring: 'bg-orange-50 text-orange-600' }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Busca global"
      >
        <Search className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar transações, parcelamentos, recorrentes..."
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
              />
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {loading && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Buscando...</div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Nenhum resultado encontrado.</div>
            )}

            {results.length > 0 && (
              <div className="py-2 max-h-80 overflow-y-auto">
                {results.map(r => (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => handleSelect(r.href)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${typeBg[r.type]}`}>
                      {typeLabel[r.type]}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!query && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Digite para buscar em transações, parcelamentos e recorrentes.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
