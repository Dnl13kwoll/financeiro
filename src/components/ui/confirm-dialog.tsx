'use client'
import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

type DialogState = {
  message: string
  confirmLabel?: string
  destructive?: boolean
  resolve: (value: boolean) => void
} | null

let setDialogState: ((state: DialogState) => void) | null = null

export function confirmDialog(
  message: string,
  options?: { confirmLabel?: string; destructive?: boolean }
): Promise<boolean> {
  return new Promise((resolve) => {
    setDialogState?.({ message, ...options, resolve })
  })
}

export function ConfirmDialogProvider() {
  const [state, setState] = useState<DialogState>(null)

  useEffect(() => {
    setDialogState = setState
    return () => { setDialogState = null }
  }, [])

  if (!state) return null

  function close(result: boolean) {
    state?.resolve(result)
    setState(null)
  }

  const confirmLabel = state.confirmLabel ?? 'Confirmar'
  const isDestructive = state.destructive ?? true

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => close(false)} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-start gap-3 mb-5">
          {isDestructive && (
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          )}
          <p className="text-gray-800 text-sm leading-relaxed mt-1">{state.message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => close(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => close(true)}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
