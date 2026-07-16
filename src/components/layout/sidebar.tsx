'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Layers, RefreshCw,
  PieChart, Settings, LogOut, BarChart2, Target, Menu, X,
  CalendarClock, LineChart, Heart,
  HelpCircle, Star, Plane, Tag,
  CalendarCheck, Sliders, SlidersHorizontal, RotateCcw, Car, CheckSquare, CalendarDays, Zap,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { PrivacyToggle } from '@/components/ui/privacy-toggle'
import { cn, formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── Badge counts + total balance ─────────────────────────────────────────────
type BadgeCounts = Partial<Record<string, number>>
type SidebarData = { badges: BadgeCounts; totalBalance: number | null }

async function fetchSidebarData(): Promise<SidebarData> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { badges: {}, totalBalance: null }

    const memberRes = await supabase
      .from('couple_members').select('couple_id').eq('user_id', user.id).maybeSingle()
    const coupleId = (memberRes.data as any)?.couple_id
    if (!coupleId) return { badges: {}, totalBalance: null }

    const today = new Date().toISOString().slice(0, 10)

    const [tasksRes, remindersRes, billsRes, balancesRes] = await Promise.all([
      supabase.from('tasks').select('id', { count: 'exact', head: true })
        .eq('couple_id', coupleId).neq('status', 'done'),
      supabase.from('financial_reminders').select('id', { count: 'exact', head: true })
        .eq('couple_id', coupleId).eq('done', false).lte('due_date', today),
      supabase.from('installment_items')
        .select('id, installments!inner(couple_id)', { count: 'exact', head: true })
        .eq('installments.couple_id', coupleId)
        .eq('paid', false).eq('canceled', false).lte('due_date', today),
      supabase.from('account_balances').select('balance').eq('couple_id', coupleId),
    ])

    const totalBalance = (balancesRes.data ?? []).reduce(
      (sum, a) => sum + (a.balance ?? 0), 0
    )

    return {
      badges: {
        '/tasks':     (tasksRes.count ?? 0) + (remindersRes.count ?? 0),
        '/recurring': billsRes.count ?? 0,
      },
      totalBalance,
    }
  } catch {
    return { badges: {}, totalBalance: null }
  }
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Essencial',
    pinned: true,
    items: [
      { href: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard },
      { href: '/accounts',     label: 'Contas',          icon: CreditCard },
      { href: '/transactions', label: 'Transações',      icon: ArrowLeftRight },
    ],
  },
  {
    label: 'Controle',
    items: [
      { href: '/installments',   label: 'Parcelamentos',    icon: Layers },
      { href: '/recurring',      label: 'Pagamentos Fixos', icon: RefreshCw },
      { href: '/tasks',          label: 'Atividades',       icon: CheckSquare },
      { href: '/budgets',        label: 'Orçamentos',       icon: PieChart },
      { href: '/goals',          label: 'Metas',            icon: Target },
    ],
  },
  {
    label: 'Análise',
    items: [
      { href: '/reports',      label: 'Análise',         icon: BarChart2 },
      // { href: '/investments',  label: 'Investimentos',   icon: LineChart },
    ],
  },
  {
    label: 'Estilo de vida',
    items: [
      { href: '/agenda',       label: 'Agenda',           icon: CalendarDays },
      { href: '/wishlist',     label: 'Listas',           icon: Heart },
      { href: '/travel',       label: 'Viagens',          icon: Plane },
      { href: '/vehicles',     label: 'Patrimônio Físico',icon: Car },
    ],
  },
  {
    label: 'Sistema',
    pinned: true,
    items: [
      { href: '/monthly-close',label: 'Fechamento Mensal', icon: CalendarCheck },
      { href: '/settings',     label: 'Configurações',     icon: Settings },
      { href: '/help',         label: 'Ajuda',             icon: HelpCircle },
    ],
  },
]

// Flat list for favorites and filtered rendering
const navItems = NAV_GROUPS.flatMap(g => g.items)

// Items that can never be hidden
const ALWAYS_VISIBLE = new Set(['/dashboard', '/settings'])

// Tab siblings: when on any of these routes, highlight the primary sidebar item
const TAB_SIBLINGS: Record<string, string[]> = {
  '/recurring':   ['/subscriptions', '/commitments'],
  '/tasks':       ['/reminders', '/today'],
  '/investments': ['/simulator'],
  '/reports':     ['/insights', '/projection', '/planning', '/networth', '/timeline'],
  '/vehicles':    ['/imoveis'],
  '/wishlist':    ['/shopping', '/price-history'],
  '/settings':    ['/categories'],
}

function isActive(href: string, pathname: string) {
  if (pathname === href) return true
  return (TAB_SIBLINGS[href] ?? []).includes(pathname)
}

// ── Customize modal ────────────────────────────────────────────────────────────
function CustomizeModal({
  hidden,
  onToggle,
  onReset,
  onClose,
}: {
  hidden: Set<string>
  onToggle: (href: string) => void
  onReset: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Personalizar menu</p>
            <p className="text-xs text-gray-400 mt-0.5">Escolha o que aparece no sidebar</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Restaurar padrão"
            >
              <RotateCcw className="w-3 h-3" />
              Resetar
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Groups */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-4">
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.label}
                {group.pinned && <span className="ml-1.5 text-gray-300 normal-case font-normal">(fixo)</span>}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const isAlways = ALWAYS_VISIBLE.has(href)
                  const isPinned = group.pinned || isAlways
                  const isVisible = !hidden.has(href)
                  return (
                    <label
                      key={href}
                      className={cn(
                        'flex items-center gap-3 px-2 py-2 rounded-lg transition-colors',
                        isPinned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        disabled={isPinned}
                        onChange={() => !isPinned && onToggle(href)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  )
}

// ── NavLinks ──────────────────────────────────────────────────────────────────
function NavLinks({ pathname, onNavigate, favorites, onToggleFavorite, hidden, badges }: {
  pathname: string
  onNavigate?: () => void
  favorites: string[]
  onToggleFavorite: (href: string) => void
  hidden: Set<string>
  badges: BadgeCounts
}) {
  const visible = navItems.filter(n => !hidden.has(n.href))
  return (
    <>
      {visible.map(({ href, label, icon: Icon }) => {
        const isFav = favorites.includes(href)
        const badge = badges[href] ?? 0
        return (
          <div key={href} className="group relative flex items-center">
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex flex-1 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive(href, pathname)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="ml-auto mr-5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
            <button
              onClick={e => { e.preventDefault(); onToggleFavorite(href) }}
              className={cn(
                'absolute right-2 p-0.5 rounded transition-opacity',
                isFav ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              title={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star className={cn('w-3 h-3', isFav ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300')} />
            </button>
          </div>
        )
      })}
    </>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [badges, setBadges] = useState<BadgeCounts>({})
  const [totalBalance, setTotalBalance] = useState<number | null>(null)

  useEffect(() => {
    try {
      const fav = localStorage.getItem('sidebar-favorites')
      if (fav) setFavorites(JSON.parse(fav))
      const hid = localStorage.getItem('sidebar-hidden')
      if (hid) setHidden(new Set(JSON.parse(hid)))
    } catch {}
    fetchSidebarData().then(({ badges, totalBalance }) => {
      setBadges(badges)
      setTotalBalance(totalBalance)
    })
  }, [])

  function toggleFavorite(href: string) {
    const updated = favorites.includes(href)
      ? favorites.filter(f => f !== href)
      : [...favorites, href]
    setFavorites(updated)
    localStorage.setItem('sidebar-favorites', JSON.stringify(updated))
  }

  function toggleHidden(href: string) {
    const next = new Set(hidden)
    if (next.has(href)) next.delete(href)
    else next.add(href)
    // also remove from favorites if hidden
    if (next.has(href)) {
      const updatedFav = favorites.filter(f => f !== href)
      setFavorites(updatedFav)
      localStorage.setItem('sidebar-favorites', JSON.stringify(updatedFav))
    }
    setHidden(next)
    localStorage.setItem('sidebar-hidden', JSON.stringify([...next]))
  }

  function resetHidden() {
    setHidden(new Set())
    localStorage.removeItem('sidebar-hidden')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const hiddenCount = hidden.size

  const Logo = () => (
    <div className="p-6 border-b border-gray-100">
      <h1 className="text-xl font-bold text-primary-600">Financeiro</h1>
      <p className="text-xs text-gray-400 mt-0.5">para casais</p>
    </div>
  )

  const LogoutButton = () => (
    <div className="p-4 border-t border-gray-100 space-y-1">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-xs text-gray-400">Tema</span>
        <div className="flex items-center gap-1">
          <PrivacyToggle />
          <ThemeToggle />
        </div>
      </div>
      <button
        onClick={() => setCustomizeOpen(true)}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Personalizar menu
        {hiddenCount > 0 && (
          <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full">
            {hiddenCount} oculto{hiddenCount !== 1 ? 's' : ''}
          </span>
        )}
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </div>
  )

  const FavSection = ({ onNav }: { onNav?: () => void }) => {
    const visibleFavs = navItems.filter(n => favorites.includes(n.href) && !hidden.has(n.href))
    if (visibleFavs.length === 0) return null
    return (
      <>
        <p className="text-xs text-gray-400 px-3 py-1 font-medium">Favoritos</p>
        {visibleFavs.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNav}
            className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(href, pathname) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50')}>
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {label}
          </Link>
        ))}
        <div className="border-t border-gray-100 my-1" />
      </>
    )
  }

  return (
    <>
      {/* Customize modal */}
      {customizeOpen && (
        <CustomizeModal
          hidden={hidden}
          onToggle={toggleHidden}
          onReset={resetHidden}
          onClose={() => setCustomizeOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 justify-between">
        <div>
          <span className="text-lg font-bold text-primary-600">Financeiro</span>
          <span className="text-xs text-gray-400 ml-2">para casais</span>
        </div>
        {totalBalance !== null && (
          <Link
            href="/accounts"
            className="text-sm font-semibold text-gray-700 hover:text-primary-600 transition-colors financial-value"
            title="Ver contas"
          >
            {formatCurrency(totalBalance)}
          </Link>
        )}
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl flex flex-col transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-primary-600">Financeiro</h1>
            <p className="text-xs text-gray-400">para casais</p>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <FavSection onNav={() => setMobileOpen(false)} />
          <NavLinks
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            hidden={hidden}
            badges={badges}
          />
        </nav>
        <LogoutButton />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-white border-r border-gray-100 flex-col">
        <Logo />
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <FavSection />
          <NavLinks
            pathname={pathname}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            hidden={hidden}
            badges={badges}
          />
        </nav>
        <LogoutButton />
      </aside>
    </>
  )
}
