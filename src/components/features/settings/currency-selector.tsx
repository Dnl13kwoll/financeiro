'use client'
import { useState, useTransition} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const CURRENCIES = [
  { code: 'BRL', label: 'Real Brasileiro (R$)' },
  { code: 'USD', label: 'Dólar Americano ($)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'GBP', label: 'Libra Esterlina (£)' },
  { code: 'ARS', label: 'Peso Argentino ($)' },
  { code: 'CLP', label: 'Peso Chileno ($)' },
]

export function CurrencySelector({ coupleId, current }: { coupleId: string; current: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [, startTransition] = useTransition()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setLoading(true)
    const supabase = createClient()
    await (supabase.from('couples') as any).update({ currency: e.target.value }).eq('id', coupleId)
    setLoading(false)
    startTransition(() => { router.refresh() })
  }

  return (
    <div className="flex items-center gap-3">
      <select
        defaultValue={current}
        onChange={handleChange}
        disabled={loading}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
      >
        {CURRENCIES.map(c => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </select>
      {loading && <span className="text-xs text-gray-400">Salvando...</span>}
    </div>
  )
}
