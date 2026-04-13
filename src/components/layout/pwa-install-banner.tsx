'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show if not already installed and not dismissed
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (sessionStorage.getItem('pwa-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
  }

  function handleDismiss() {
    setShow(false)
    sessionStorage.setItem('pwa-dismissed', '1')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-lg">F</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Instalar app</p>
        <p className="text-xs text-gray-500">Acesso rápido na tela inicial</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-1.5 bg-primary-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        Instalar
      </button>
      <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
