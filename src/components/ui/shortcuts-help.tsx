'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const shortcuts = [
  { keys: ['N'], desc: 'Nova transação (FAB)' },
  { keys: ['/'], desc: 'Busca global' },
  { keys: ['D'], desc: 'Ir para Dashboard' },
  { keys: ['T'], desc: 'Ir para Transações' },
  { keys: ['A'], desc: 'Ir para Contas' },
  { keys: ['R'], desc: 'Ir para Relatórios' },
  { keys: ['G'], desc: 'Ir para Metas' },
  { keys: ['?'], desc: 'Mostrar atalhos' },
]

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler() { setOpen(true) }
    window.addEventListener('open-shortcuts-help', handler)
    return () => window.removeEventListener('open-shortcuts-help', handler)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Atalhos de teclado</h2>
          <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {shortcuts.map(({ keys, desc }) => (
            <div key={desc} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{desc}</span>
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 bg-gray-100 border border-gray-300 rounded text-xs font-mono font-semibold text-gray-700 shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">Atalhos só funcionam fora de campos de texto</p>
      </div>
    </div>
  )
}
