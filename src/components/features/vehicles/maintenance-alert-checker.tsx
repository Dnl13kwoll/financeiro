'use client'

import { useEffect } from 'react'

export function MaintenanceAlertChecker() {
  useEffect(() => {
    const key = 'maintenance-alerts-checked'
    const last = localStorage.getItem(key)
    const now = Date.now()
    // Run at most once per hour
    if (last && now - parseInt(last) < 3600000) return
    localStorage.setItem(key, String(now))
    fetch('/api/maintenance-alerts', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}
