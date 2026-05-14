import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AuthCallback() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      navigate('/', { replace: true })
    }
  }, [session, loading, navigate])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-stone-500">Anmeldung wird verarbeitet…</p>
    </div>
  )
}
