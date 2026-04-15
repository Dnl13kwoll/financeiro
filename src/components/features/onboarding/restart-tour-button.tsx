'use client'
import { PlayCircle } from 'lucide-react'

const STORAGE_KEY = 'onboarding_tour_done'

export function RestartTourButton() {
  function handleRestart() {
    localStorage.removeItem(STORAGE_KEY)
    window.location.reload()
  }

  return (
    <button
      onClick={handleRestart}
      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors"
    >
      <PlayCircle className="w-4 h-4" />
      Iniciar tour do sistema
    </button>
  )
}
