'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function PushSubscribeButton() {
  const [status, setStatus] = useState<'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'>('loading')
  const [busy, setBusy] = useState(false)
  const [subError, setSubError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      setStatus(existing ? 'subscribed' : 'unsubscribed')
    })
  }, [])

  async function subscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { setStatus('denied'); return }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { alert('VAPID public key não configurada.'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      })

      setStatus('subscribed')
    } catch {
      setSubError('Falha ao ativar notificações. Verifique as permissões do navegador e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus('unsubscribed')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return null
  if (status === 'unsupported') return null

  if (status === 'denied') {
    return (
      <p className="text-xs text-red-500">
        Notificações bloqueadas. Habilite nas configurações do navegador.
      </p>
    )
  }

  if (status === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        disabled={busy}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
      >
        <BellOff className="w-4 h-4" />
        {busy ? 'Aguarde...' : 'Desativar notificações'}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {subError && (
        <p className="text-xs text-red-500">{subError}</p>
      )}
      <button
        onClick={() => { setSubError(null); subscribe() }}
        disabled={busy}
        className="flex items-center gap-2 text-sm text-[var(--color-primary-600)] hover:opacity-80 transition-opacity"
      >
        <Bell className="w-4 h-4" />
        {busy ? 'Aguarde...' : 'Ativar notificações push'}
      </button>
    </div>
  )
}
