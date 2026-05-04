'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, CalendarDays, Zap, BarChart2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/dashboard',    label: 'Início',      icon: LayoutDashboard },
  { href: '/transactions', label: 'Lançamentos', icon: ArrowLeftRight },
  { href: '/agenda',       label: 'Agenda',      icon: CalendarDays },
  { href: '/today',        label: 'Hoje',        icon: Zap },
  { href: '/reports',      label: 'Análise',     icon: BarChart2 },
]

const TAB_SIBLINGS: Record<string, string[]> = {
  '/reports': ['/insights', '/projection', '/planning', '/networth'],
}

function isActive(href: string, pathname: string) {
  if (pathname === href) return true
  return (TAB_SIBLINGS[href] ?? []).includes(pathname)
}

export function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
      <div className="flex items-stretch h-16">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-1 transition-colors',
                active ? 'text-primary-700' : 'text-gray-400 active:text-gray-700'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
              <span className={cn('text-[10px] font-medium leading-none', active ? 'text-primary-700' : 'text-gray-400')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
