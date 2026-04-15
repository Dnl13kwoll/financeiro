'use client'
import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const STORAGE_KEY = 'finance-privacy-mode'

export function PrivacyToggle() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === '1'
    setHidden(stored)
    document.body.toggleAttribute('data-hide-values', stored)
  }, [])

  function toggle() {
    const next = !hidden
    setHidden(next)
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
    document.body.toggleAttribute('data-hide-values', next)
  }

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      title={hidden ? 'Mostrar valores' : 'Ocultar valores'}
    >
      {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )
}
