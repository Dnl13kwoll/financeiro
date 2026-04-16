'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Layers,
  RefreshCw,
  PieChart,
  Settings,
  LogOut,
  BarChart2,
  Target,
  Menu,
  X,
  CalendarClock,
  TrendingUp,
  Activity,
  Heart,
  ClipboardList,
  Landmark,
  HelpCircle,
  Star,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { PrivacyToggle } from '@/components/ui/privacy-toggle'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Contas', icon: CreditCard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/installments', label: 'Parcelamentos', icon: Layers },
  { href: '/recurring', label: 'Recorrentes', icon: RefreshCw },
  { href: '/budgets', label: 'Orçamentos', icon: PieChart },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/timeline', label: 'Linha do Tempo', icon: CalendarClock },
  { href: '/projection', label: 'Projeção', icon: TrendingUp },
  { href: '/planning', label: 'Planejamento', icon: ClipboardList },
  { href: '/networth', label: 'Patrimônio', icon: Landmark },
  { href: '/wishlist', label: 'Lista de Desejos', icon: Heart },
  { href: '/reports', label: 'Relatórios', icon: BarChart2 },
  { href: '/activity', label: 'Atividade', icon: Activity },
  { href: '/settings', label: 'Configurações', icon: Settings },
  { href: '/help', label: 'Ajuda', icon: HelpCircle },
]

function NavLinks({ pathname, onNavigate, favorites, onToggleFavorite }: {
  pathname: string
  onNavigate?: () => void
  favorites: string[]
  onToggleFavorite: (href: string) => void
}) {
  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isFav = favorites.includes(href)
        return (
          <div key={href} className="group relative flex items-center">
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex flex-1 items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
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

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sidebar-favorites')
      if (stored) setFavorites(JSON.parse(stored))
    } catch {}
  }, [])

  function toggleFavorite(href: string) {
    const updated = favorites.includes(href)
      ? favorites.filter(f => f !== href)
      : [...favorites, href]
    setFavorites(updated)
    localStorage.setItem('sidebar-favorites', JSON.stringify(updated))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

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
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 justify-between">
        <div>
          <span className="text-lg font-bold text-primary-600">Financeiro</span>
          <span className="text-xs text-gray-400 ml-2">para casais</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
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
          {favorites.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-3 py-1 font-medium">Favoritos</p>
              {navItems.filter(n => favorites.includes(n.href)).map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', pathname === href ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50')}>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-gray-100 my-1" />
            </>
          )}
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </nav>
        <LogoutButton />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-white border-r border-gray-100 flex-col">
        <Logo />
        <nav className="flex-1 p-4 space-y-1">
          {favorites.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-3 py-1 font-medium">Favoritos</p>
              {navItems.filter(n => favorites.includes(n.href)).map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className={cn('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors', pathname === href ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50')}>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {label}
                </Link>
              ))}
              <div className="border-t border-gray-100 my-1" />
            </>
          )}
          <NavLinks pathname={pathname} favorites={favorites} onToggleFavorite={toggleFavorite} />
        </nav>
        <LogoutButton />
      </aside>
    </>
  )
}
