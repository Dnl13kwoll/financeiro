'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ColorSelectOption = {
  value: string
  label: string
  color?: string | null
}

export function ColorSelect({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  className,
}: {
  options: ColorSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {selected?.color
          ? <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
          : selected && <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-200" />
        }
        <span className={cn('flex-1 truncate', !selected && 'text-gray-400')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[300] max-h-52 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left transition-colors',
                opt.value === value && 'bg-primary-50'
              )}
            >
              {opt.color
                ? <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
                : <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-gray-200" />
              }
              <span className="flex-1 truncate text-gray-700">{opt.label}</span>
              {opt.value === value && <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
