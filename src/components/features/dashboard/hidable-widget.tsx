'use client'
import { useEffect } from 'react'

const STORAGE_KEY = 'dashboard_hidden_widgets'

/**
 * Injeta uma tag <style> que oculta os widgets marcados com data-widget="id"
 * baseado no localStorage. Deve ser renderizado uma vez no dashboard.
 */
export function DashboardHider() {
  useEffect(() => {
    function apply() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const hidden: string[] = stored ? JSON.parse(stored) : []
        let css = ''
        for (const id of hidden) {
          css += `[data-widget="${id}"] { display: none !important; }\n`
        }
        let el = document.getElementById('dashboard-hider-style')
        if (!el) {
          el = document.createElement('style')
          el.id = 'dashboard-hider-style'
          document.head.appendChild(el)
        }
        el.textContent = css
      } catch {}
    }

    apply()
    window.addEventListener('dashboard-widgets-changed', apply)
    return () => window.removeEventListener('dashboard-widgets-changed', apply)
  }, [])

  return null
}
