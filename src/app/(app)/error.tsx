'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col flex-1 items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Algo deu errado</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Ocorreu um erro inesperado ao carregar esta página.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Tentar novamente
      </button>
    </div>
  )
}
