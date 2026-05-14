import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    const redirectTo = `${window.location.origin}${window.location.pathname}#/auth/callback`
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      setError('Fehler beim Senden. Bitte versuche es erneut.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
        <div className="text-5xl">📬</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-stone-800 mb-2">Link versendet!</h2>
          <p className="text-sm text-stone-500">
            Schau in dein Postfach für <span className="font-medium text-stone-700">{email}</span> und klicke auf den Link.
          </p>
        </div>
        <button
          onClick={() => setSent(false)}
          className="text-sm text-amber-700 underline"
        >
          Andere E-Mail verwenden
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🐕</div>
        <h1 className="text-2xl font-bold text-stone-800">Hundetraining</h1>
        <p className="text-sm text-stone-500 mt-1">Melde dich mit deiner E-Mail an</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 max-w-xs">
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
          {loading ? 'Wird gesendet…' : 'Magic Link senden'}
        </button>
      </form>

      <p className="text-xs text-stone-400 text-center max-w-xs">
        Kein Passwort nötig. Du bekommst einen Anmeldelink per E-Mail.
      </p>
    </div>
  )
}
