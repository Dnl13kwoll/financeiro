'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, ArrowLeftRight, Layers, RefreshCw, Target, LineChart, PieChart, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type Result = {
  type: string
  id: string
  label: string
  sub?: string
  href: string
  amount?: number
}

const TYPE_ICON: Record<string, React.ElementType> = {
  transaction: ArrowLeftRight,
  installment: Layers,
  recurring: RefreshCw,
  goal: Target,
  investment: LineChart,
  budget: PieChart,
}

const TYPE_BG: Record<string, string> = {
  transaction: 'bg-blue-50 text-blue-600',
  installment: 'bg-purple-50 text-purple-600',
  recurring: 'bg-orange-50 text-orange-600',
  goal: 'bg-green-50 text-green-600',
  investment: 'bg-indigo-50 text-indigo-600',
  budget: 'bg-amber-50 text-amber-600',
}

const TYPE_LABEL: Record<string, string> = {
  transaction: 'Transação', installment: 'Parcelamento', recurring: 'Recorrente',
  goal: 'Meta', investment: 'Investimento', budget: 'Orçamento',
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(v => !v) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setResults([]); setSelected(0) }
  }, [open])

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.results ?? [])
        setSelected(0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 300)
  }, [query, doSearch])

  function handleSelect(href: string) {
    setOpen(false)
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && results[selected]) handleSelect(results[selected].href)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Busca global (⌘K)"
      >
        <Search className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              {loading
                ? <Loader2 className="w-4 h-4 text-gray-400 shrink-0 animate-spin" />
                : <Search className="w-4 h-4 text-gray-400 shrink-0" />
              }
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar transações, metas, investimentos..."
                className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400"
              />
              {query
                ? <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }} className="text-gray-300 hover:text-gray-500"><X className="w-4 h-4" /></button>
                : <kbd className="text-xs text-gray-300 border border-gray-200 px-1.5 py-0.5 rounded hidden sm:block">Esc</kbd>
              }
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="py-1 max-h-80 overflow-y-auto">
                {results.map((r, i) => {
                  const Icon = TYPE_ICON[r.type] ?? Search
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSelect(r.href)}
                      className={cn(
                        'w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left',
                        i === selected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div className={cn('flex items-center justify-center w-7 h-7 rounded-lg shrink-0', TYPE_BG[r.type] ?? 'bg-gray-100 text-gray-500')}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                        {r.sub && <p className="text-xs text-gray-400 truncate">{r.sub}</p>}
                      </div>
                      {r.amount != null && (
                        <span className="text-sm font-semibold text-gray-600 shrink-0 financial-value">{formatCurrency(r.amount)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Nenhum resultado para <strong className="text-gray-600">&ldquo;{query}&rdquo;</strong>
              </div>
            )}

            {!query && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                Digite para buscar em transações, metas, investimentos e mais.
              </div>
            )}

            {/* Footer */}
            {results.length > 0 && (
              <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-50 text-xs text-gray-300">
                <span><kbd className="border border-gray-200 px-1 rounded">↑↓</kbd> navegar</span>
                <span><kbd className="border border-gray-200 px-1 rounded">↵</kbd> abrir</span>
                <span><kbd className="border border-gray-200 px-1 rounded">Esc</kbd> fechar</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
