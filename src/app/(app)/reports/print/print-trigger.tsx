'use client'
import { useEffect } from 'react'

export function PrintTrigger() {
  useEffect(() => {
    const btn = document.getElementById('print-btn')
    if (btn) btn.onclick = () => window.print()
  }, [])
  return null
}
