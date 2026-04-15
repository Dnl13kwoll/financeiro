'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X, RotateCcw } from 'lucide-react'

type Toast = { id: number; message: string; type: 'success' | 'error'; onUndo?: () => void }

export function showToast(message: string, type: 'success' | 'error' = 'success', onUndo?: () => void) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('toast', { detail: { message, type, onUndo } }))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    let counter = 0
    function handler(e: Event) {
      const { message, type, onUndo } = (e as CustomEvent).detail
      const id = ++counter
      setToasts(prev => [...prev, { id, message, type, onUndo }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), onUndo ? 4500 : 3500)
    }
    window.addEventListener('toast', handler)
    return () => window.removeEventListener('toast', handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            t.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {t.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            : <XCircle className="w-4 h-4 text-red-200 shrink-0" />
          }
          {t.message}
          {t.onUndo && (
            <button
              onClick={() => {
                t.onUndo?.()
                setToasts(prev => prev.filter(x => x.id !== t.id))
              }}
              className="ml-1 flex items-center gap-1 underline underline-offset-2 opacity-90 hover:opacity-100 font-semibold"
            >
              <RotateCcw className="w-3 h-3" /> Desfazer
            </button>
          )}
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="ml-1 opacity-60 hover:opacity-100"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
