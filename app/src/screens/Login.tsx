import { useState } from 'react'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register' | 'reset'

export function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [registerSent, setRegisterSent] = useState(false)

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setPassword('')
    setConfirm('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError('E-Mail oder Passwort falsch.')
    setLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 6) { setError('Mindestens 6 Zeichen erforderlich.'); return }
    setLoading(true)
    setError(null)
    const redirectTo = window.location.origin + window.location.pathname
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Wenn E-Mail-Bestätigung deaktiviert ist, liefert signUp direkt eine Session → useAuth loggt automatisch ein
    // Wenn E-Mail-Bestätigung aktiv ist, session ist null → Bestätigungshinweis zeigen
    if (!data.session) setRegisterSent(true)
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

  if (registerSent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
        <div className="text-5xl">📬</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-stone-800">Fast geschafft!</h2>
          <p className="text-sm text-stone-500 mt-2">
            Wir haben dir eine Bestätigungs-E-Mail geschickt.<br />
            Klicke auf den Link darin — danach kannst du dich anmelden.
          </p>
        </div>
        <button
          onClick={() => { setRegisterSent(false); switchMode('login') }}
          className="text-sm text-amber-700 underline"
        >
          Zurück zur Anmeldung
        </button>
      </div>
    )
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
          onClick={() => { setResetSent(false); switchMode('login') }}
          className="text-sm text-amber-700 underline"
        >
          Zurück zur Anmeldung
        </button>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🐕</div>
        <h1 className="text-2xl font-bold text-stone-800">Hundetraining</h1>
      </div>

      {/* Tab-Umschalter */}
      <div className="flex w-full max-w-xs rounded-xl border border-stone-200 overflow-hidden">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mode === 'login' ? 'bg-amber-600 text-white' : 'bg-white text-stone-500'
          }`}
        >
          Anmelden
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
            mode === 'register' ? 'bg-amber-600 text-white' : 'bg-white text-stone-500'
          }`}
        >
          Registrieren
        </button>
      </div>

      {mode === 'login' && (
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-3 max-w-xs">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Passwort"
            required
            className={inputClass}
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
            onClick={() => switchMode('reset')}
            className="text-sm text-stone-500 underline mt-1"
          >
            Passwort vergessen?
          </button>
        </form>
      )}

      {mode === 'register' && (
        <form onSubmit={handleRegister} className="w-full flex flex-col gap-3 max-w-xs">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Passwort (mind. 6 Zeichen)"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Passwort wiederholen"
            required
            className={inputClass}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email.trim() || !password || !confirm}
            className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? 'Wird registriert…' : 'Konto erstellen'}
          </button>
        </form>
      )}

      {mode === 'reset' && (
        <form onSubmit={handleReset} className="w-full flex flex-col gap-3 max-w-xs">
          <p className="text-sm text-stone-500 text-center -mt-4">Du bekommst einen Link per E-Mail</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="deine@email.de"
            required
            className={inputClass}
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
            onClick={() => switchMode('login')}
            className="text-sm text-stone-500 underline"
          >
            Zurück zur Anmeldung
          </button>
        </form>
      )}
    </div>
  )
}
