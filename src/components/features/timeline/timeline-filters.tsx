'use client'
import { useRouter } from 'next/navigation'

export function TimelineFilters({ currentDays }: { currentDays: number }) {
  const router = useRouter()
  const options = [30, 60, 90]

  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
      {options.map((d) => (
        <button
          key={d}
          onClick={() => router.push(`/timeline?days=${d}`)}
          className={`px-4 py-1.5 transition-colors ${
            currentDays === d
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {d} dias
        </button>
      ))}
    </div>
  )
}
