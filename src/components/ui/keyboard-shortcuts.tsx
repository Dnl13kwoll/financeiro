'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case 'n':
        case 'N':
          // Trigger new transaction FAB
          window.dispatchEvent(new CustomEvent('open-quick-add'))
          break
        case '/':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('open-global-search'))
          break
        case 'd':
        case 'D':
          router.push('/dashboard')
          break
        case 't':
        case 'T':
          router.push('/transactions')
          break
        case 'a':
        case 'A':
          router.push('/accounts')
          break
        case 'r':
          router.push('/reports')
          break
        case 'g':
        case 'G':
          router.push('/goals')
          break
        case '?':
          window.dispatchEvent(new CustomEvent('open-shortcuts-help'))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return null
}
