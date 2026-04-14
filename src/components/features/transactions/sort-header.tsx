'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export function SortHeader({ label, column, className }: { label: string; column: string; className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort')
  const currentDir = searchParams.get('dir') ?? 'desc'

  const isActive = currentSort === column
  const nextDir = isActive && currentDir === 'desc' ? 'asc' : 'desc'

  function handleSort() {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', column)
    params.set('dir', nextDir)
    router.push(`/transactions?${params.toString()}`)
  }

  return (
    <button onClick={handleSort} className={`flex items-center gap-1 font-medium hover:text-gray-900 transition-colors ${className ?? ''}`}>
      {label}
      {isActive
        ? currentDir === 'desc'
          ? <ChevronDown className="w-3 h-3" />
          : <ChevronUp className="w-3 h-3" />
        : <ChevronsUpDown className="w-3 h-3 text-gray-300" />
      }
    </button>
  )
}
