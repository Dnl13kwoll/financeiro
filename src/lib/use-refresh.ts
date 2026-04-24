'use client'
import { useRouter } from 'next/navigation'
import { useTransition, useCallback } from 'react'

export function useRefresh() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const refresh = useCallback(() => startTransition(() => router.refresh()), [router])
  return { refresh, isPending }
}
