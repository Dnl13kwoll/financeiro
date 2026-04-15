'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function CompareMonthsPicker({ monthA, monthB }: { monthA: string; monthB: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: 'monthA' | 'monthB', value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <input
        type="month"
        value={monthA}
        onChange={e => update('monthA', e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <span className="text-gray-400">vs</span>
      <input
        type="month"
        value={monthB}
        onChange={e => update('monthB', e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
    </div>
  )
}
