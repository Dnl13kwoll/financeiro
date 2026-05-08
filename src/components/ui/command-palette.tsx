'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, X, Plus,
  LayoutDashboard, CreditCard, ArrowLeftRight, Layers, RefreshCw,
  PieChart, Target, CalendarClock, BarChart2, LineChart,
  CalendarDays, Heart, Plane, Tag, Car,
  CalendarCheck, Sliders, Settings, HelpCircle, CheckSquare, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PaletteItem = {
  label: string
  group: string
  href?: string
  action?: () => void
  icon: React.ElementType
  keywords?: string
}

const ITEMS: PaletteItem[] = [
  // Quick actions
  { label: 'Nova Transação', group: 'Ação rápida', action: () => window.dispatchEvent(new CustomEvent('open-quick-add')), icon: Plus, keywords: 'lançar adicionar criar' },
  // Essencial
  { label: 'Dashboard',       group: 'Essencial',     href: '/dashboard',     icon: LayoutDashboard },
  { label: 'Contas',          group: 'Essencial',     href: '/accounts',      icon: CreditCard },
  { label: 'Transações',      group: 'Essencial',     href: '/transactions',  icon: ArrowLeftRight },
  // Controle
  { label: 'Hoje',            group: 'Controle',      href: '/today',         icon: Zap },
  { label: 'Parcelamentos',   group: 'Controle',      href: '/installments',  icon: Layers },
  { label: 'Pagamentos Fixos',group: 'Controle',      href: '/recurring',     icon: RefreshCw },
  { label: 'Atividades',      group: 'Controle',      href: '/tasks',         icon: CheckSquare },
  { label: 'Lembretes',       group: 'Controle',      href: '/reminders',     icon: CheckSquare },
  { label: 'Orçamentos',      group: 'Controle',      href: '/budgets',       icon: PieChart },
  { label: 'Metas',           group: 'Controle',      href: '/goals',         icon: Target },
  // Análise
  { label: 'Linha do Tempo',  group: 'Análise',       href: '/timeline',      icon: CalendarClock },
  { label: 'Análise',         group: 'Análise',       href: '/reports',       icon: BarChart2 },
  { label: 'Investimentos',   group: 'Análise',       href: '/investments',   icon: LineChart },
  // Estilo de vida
  { label: 'Agenda',          group: 'Estilo de vida',href: '/agenda',        icon: CalendarDays },
  { label: 'Listas',          group: 'Estilo de vida',href: '/wishlist',      icon: Heart },
  { label: 'Viagens',         group: 'Estilo de vida',href: '/travel',        icon: Plane },
  { label: 'Hist. de Preços', group: 'Estilo de vida',href: '/price-history', icon: Tag },
  { label: 'Patrimônio Físico',group:'Estilo de vida',href: '/vehicles',      icon: Car },
  // Sistema
  { label: 'Fechamento Mensal',group:'Sistema',       href: '/monthly-close', icon: CalendarCheck },
  { label: 'Categorias',      group: 'Sistema',       href: '/categories',    icon: Sliders },
  { label: 'Configurações',   group: 'Sistema',       href: '/settings',      icon: Settings },
  { label: 'Ajuda',           group: 'Sistema',       href: '/help',          icon: HelpCircle },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function onOpen() { setOpen(true) }
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('open-global-search', onOpen)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('open-global-search', onOpen)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const filtered = query.trim()
    ? ITEMS.filter(item =>
        (item.label + ' ' + (item.keywords ?? '') + ' ' + item.group)
          .toLowerCase().includes(query.toLowerCase())
      )
    : ITEMS

  useEffect(() => { setActiveIdx(0) }, [query])

  function select(item: PaletteItem) {
    if (item.href) router.push(item.href)
    else item.action?.()
    setOpen(false)
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (filtered[activeIdx]) select(filtered[activeIdx])
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center pt-[18vh] px-4"
      onMouseDown={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Buscar páginas e ações..."
            className="flex-1 text-sm outline-none text-gray-900 placeholder-gray-400 bg-transparent"
          />
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum resultado para &quot;{query}&quot;</p>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.label}
                onClick={() => select(item)}
                onMouseEnter={() => setActiveIdx(i)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                  i === activeIdx ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon className={cn('w-4 h-4 shrink-0', i === activeIdx ? 'text-primary-500' : 'text-gray-400')} />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs text-gray-300">{item.group}</span>
              </button>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">↵</kbd> selecionar</span>
          <span><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">Esc</kbd> fechar</span>
          <span className="ml-auto"><kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">⌘K</kbd></span>
        </div>
      </div>
    </div>
  )
}
