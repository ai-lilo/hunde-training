import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Supabase appends ?code= to the path (before #), not inside the hash fragment.
    // useSearchParams() in HashRouter only reads within the hash, so we also check window.location.search.
    const code = searchParams.get('code') ?? new URLSearchParams(window.location.search).get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code)
        .then(() => navigate('/', { replace: true }))
        .catch(() => navigate('/', { replace: true }))
    } else {
      navigate('/', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-stone-500">Anmeldung wird verarbeitet…</p>
    </div>
  )
}
