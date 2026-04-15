'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function ReportViewToggle({ view }: { view: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function setView(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', v)
    params.delete('month')
    params.delete('year')
    router.push(`/reports?${params.toString()}`)
  }

  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
      <button
        onClick={() => setView('monthly')}
        className={`px-4 py-1.5 transition-colors ${view === 'monthly' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        Mensal
      </button>
      <button
        onClick={() => setView('annual')}
        className={`px-4 py-1.5 transition-colors ${view === 'annual' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        Anual
      </button>
      <button
        onClick={() => setView('compare')}
        className={`px-4 py-1.5 transition-colors ${view === 'compare' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        Comparar
      </button>
    </div>
  )
}
