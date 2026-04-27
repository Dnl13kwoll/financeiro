'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarCheck, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function MonthlyCloseReminder() {
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Only show in the last 4 days of the month
    const now = new Date()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysLeft = daysInMonth - now.getDate()
    if (daysLeft > 3) return

    // Don't show on the monthly-close page itself
    if (pathname === '/monthly-close') return

    const key = `monthly_close_reminder_${now.getFullYear()}_${now.getMonth() + 1}`
    if (localStorage.getItem(key)) return

    // Small delay so it doesn't appear immediately on page load
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [pathname])

  function dismiss() {
    const now = new Date()
    const key = `monthly_close_reminder_${now.getFullYear()}_${now.getMonth() + 1}`
    localStorage.setItem(key, '1')
    setShow(false)
  }

  if (!show) return null

  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate()

  return (
    <div className="fixed bottom-24 right-4 md:bottom-6 md:right-24 z-40 w-72 bg-white border border-primary-100 rounded-2xl shadow-xl p-4 flex gap-3 animate-in slide-in-from-bottom-2">
      <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
        <CalendarCheck className="w-5 h-5 text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Fechamento do mês</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {daysLeft === 0 ? 'Último dia do mês!' : `Faltam ${daysLeft} dia${daysLeft !== 1 ? 's' : ''} para fechar o mês.`}
        </p>
        <Link
          href="/monthly-close"
          onClick={dismiss}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
        >
          Fazer fechamento <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 shrink-0 self-start">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
