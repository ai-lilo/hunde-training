import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'reset'

export function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError('E-Mail oder Passwort falsch.')
    setLoading(false)
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const redirectTo = window.location.origin + window.location.pathname
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  if (resetSent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
        <div className="text-5xl">📬</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-stone-800">Link versendet!</h2>
          <p className="text-sm text-stone-500 mt-2">
            Klicke auf den Link in deiner E-Mail um ein neues Passwort zu setzen.
          </p>
        </div>
        <button
          onClick={() => { setResetSent(false); setMode('login') }}
          className="text-sm text-amber-700 underline"
        >
          Zurück zur Anmeldung
        </button>
      </div>
    )
  }

  if (mode === 'reset') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-stone-800">Passwort zurücksetzen</h1>
          <p className="text-sm text-stone-500 mt-1">Du bekommst einen Link per E-Mail</p>
        </div>
        <form onSubmit={handleReset} className="w-full flex flex-col gap-3 max-w-xs">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? 'Wird gesendet…' : 'Reset-Link senden'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null) }}
            className="text-sm text-stone-500 underline"
          >
            Zurück zur Anmeldung
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🐕</div>
        <h1 className="text-2xl font-bold text-stone-800">Hundetraining</h1>
        <p className="text-sm text-stone-500 mt-1">Melde dich an</p>
      </div>

      <form onSubmit={handleLogin} className="w-full flex flex-col gap-3 max-w-xs">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="deine@email.de"
          required
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Passwort"
          required
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? 'Anmelden…' : 'Anmelden'}
        </button>
        <button
          type="button"
          onClick={() => { setMode('reset'); setError(null) }}
          className="text-sm text-stone-500 underline mt-1"
        >
          Passwort vergessen?
        </button>
      </form>

      <p className="text-xs text-stone-400 text-center max-w-xs">
        Kein Konto? Wende dich an den Administrator.
      </p>
    </div>
  )
}
