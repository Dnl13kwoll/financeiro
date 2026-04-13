'use client'
import { useState, useEffect } from 'react'
import { Palette, EyeOff, Eye } from 'lucide-react'
import { useTheme, type Theme } from './theme-provider'

const themes: { value: Theme; label: string; color: string }[] = [
  { value: 'green', label: 'Verde', color: '#16a34a' },
  { value: 'pink',  label: 'Rosa',  color: '#db2777' },
  { value: 'blue',  label: 'Azul',  color: '#2563eb' },
  { value: 'dark',  label: 'Escuro', color: '#1e293b' },
]

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<Theme>('green')
  const [hidden, setHidden] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => {
    try {
      setCurrent((localStorage.getItem('theme') as Theme) || 'green')
      setHidden(localStorage.getItem('hideValues') === 'true')
    } catch {}
  }, [])

  function handleTheme(t: Theme) {
    setTheme(t)
    setCurrent(t)
    setOpen(false)
  }

  function toggleHide() {
    const next = !hidden
    setHidden(next)
    localStorage.setItem('hideValues', String(next))
    if (next) document.body.setAttribute('data-hide-values', '1')
    else document.body.removeAttribute('data-hide-values')
  }

  return (
    <div className="flex items-center gap-1 relative">
      <button
        onClick={toggleHide}
        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        title={hidden ? 'Mostrar valores' : 'Ocultar valores'}
      >
        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>

      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        title="Tema"
      >
        <Palette className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-[140px]">
            <p className="text-xs text-gray-500 mb-2 font-medium">Tema</p>
            <div className="space-y-1">
              {themes.map(t => (
                <button
                  key={t.value}
                  onClick={() => handleTheme(t.value)}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    current === t.value ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                  {t.label}
                  {current === t.value && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
