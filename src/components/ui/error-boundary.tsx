'use client'
import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ErrorBoundary({
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
    <div className="flex flex-col flex-1 items-center justify-center p-8 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Algo deu errado</h2>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Ocorreu um erro inesperado ao carregar esta página. Tente novamente.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
