import { useEffect, useRef } from 'react'

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return

    let cancelled = false

    navigator.wakeLock.request('screen').then(lock => {
      if (cancelled) {
        lock.release()
        return
      }
      lockRef.current = lock
      lock.addEventListener('release', () => { lockRef.current = null })
    }).catch(() => { /* Gerät unterstützt Wake Lock nicht */ })

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !lockRef.current && !cancelled) {
        navigator.wakeLock.request('screen').then(lock => {
          if (cancelled) { lock.release(); return }
          lockRef.current = lock
        }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }
  }, [active])
}
