'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function YearFilter({ value }: { value: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setYear(y: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', String(y))
    router.push(`/reports?${params.toString()}`)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i)

  return (
    <select
      value={value}
      onChange={e => setYear(Number(e.target.value))}
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {years.map(y => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}
