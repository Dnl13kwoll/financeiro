'use client'
import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-36 right-4 lg:bottom-20 lg:right-6 z-20 w-10 h-10 bg-white border border-gray-200 text-gray-500 rounded-full shadow-md hover:shadow-lg hover:text-primary-600 hover:border-primary-300 transition-all flex items-center justify-center"
      title="Voltar ao topo"
      aria-label="Voltar ao topo"
    >
      <ChevronUp className="w-5 h-5" />
    </button>
  )
}
