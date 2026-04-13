'use client'
import { useRouter } from 'next/navigation'

export function MonthFilter({ value }: { value: string }) {
  const router = useRouter()
  return (
    <input
      type="month"
      defaultValue={value}
      onChange={e => router.push(`/reports?month=${e.target.value}`)}
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  )
}
