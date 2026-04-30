'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Tab {
  href: string
  label: string
}

export function PageTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()
  return (
    <div className="border-b border-gray-100 bg-white px-4 md:px-6">
      <div className="flex gap-1 overflow-x-auto scrollbar-none">
        {tabs.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              pathname === href
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            )}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
