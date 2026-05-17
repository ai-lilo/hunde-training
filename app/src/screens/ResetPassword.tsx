import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onDone: () => void
}

export function ResetPassword({ onDone }: Props) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwörter stimmen nicht überein.'); return }
    if (password.length < 6) { setError('Mindestens 6 Zeichen erforderlich.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    await supabase.auth.signOut()
    onDone()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-8">
      <div className="text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold text-stone-800">Neues Passwort setzen</h1>
        <p className="text-sm text-stone-500 mt-1">Mindestens 6 Zeichen</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 max-w-xs">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Neues Passwort"
          required
          autoFocus
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Passwort wiederholen"
          required
          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password || !confirm}
          className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? 'Wird gespeichert…' : 'Passwort speichern'}
        </button>
      </form>
    </div>
  )
}
