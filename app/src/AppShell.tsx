import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useActiveDog } from './hooks/useActiveDog'
import { useDogs } from './hooks/useDogs'
import type { Dog } from './hooks/useDogs'
import { Login } from './screens/Login'
import { ResetPassword } from './screens/ResetPassword'
import { Onboarding } from './screens/Onboarding'
import { DogSelector } from './screens/DogSelector'
import MainApp from './App'

const DEV_DOG: Dog = {
  id: 'dev-dog-id',
  owner_id: 'dev-user-id',
  name: 'Ari (Dev)',
  breed: 'Australian Shepherd',
  gender: null,
  birthdate: null,
  weight_kg: null,
  photo_url: null,
  notes: null,
  created_at: new Date().toISOString(),
}

export function AppShell() {
  const { user, loading: authLoading, isRecovery } = useAuth()
  const [devBypass, setDevBypass] = useState(false)

  // Supabase leitet bei Fehler auf Root mit #error=... um (z.B. abgelaufener Magic Link)
  const [authError, setAuthError] = useState<string | null>(() => {
    const hash = window.location.hash
    if (hash && !hash.startsWith('#/')) {
      const params = new URLSearchParams(hash.slice(1))
      const error = params.get('error')
      if (error) {
        const desc = params.get('error_description')
        window.history.replaceState(null, '', window.location.pathname + '#/')
        const decoded = desc ? decodeURIComponent(desc.replace(/\+/g, ' ')) : 'Anmeldung fehlgeschlagen'
        return decoded.replace(/<[^>]*>/g, '').slice(0, 200)
      }
    }
    return null
  })
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id)
  const { dogId, setDogId } = useActiveDog()
  const { data: dogs = [], isLoading: dogsLoading } = useDogs()

  // Loading-Splash
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Dev-Bypass (nur localhost, keine echte Auth nötig)
  if (import.meta.env.DEV && devBypass) {
    return <MainApp dogId={DEV_DOG.id} dog={DEV_DOG} userId={DEV_DOG.owner_id} />
  }

  // Auth-Fehler (z.B. abgelaufener Magic Link)
  if (!user && authError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
        <div className="text-5xl">⚠️</div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-stone-800 mb-2">Anmeldung fehlgeschlagen</h2>
          <p className="text-sm text-stone-500">{authError}</p>
        </div>
        <button
          onClick={() => setAuthError(null)}
          className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl active:scale-95 transition-transform"
        >
          Erneut anmelden
        </button>
      </div>
    )
  }

  // Passwort-Reset: temporäre Recovery-Session nach Klick auf Reset-Link
  if (isRecovery) {
    return <ResetPassword onDone={() => window.location.reload()} />
  }

  // Nicht angemeldet → Login (mit Dev-Button auf localhost)
  if (!user) return (
    <div className="relative h-full">
      <Login />
      {import.meta.env.DEV && (
        <button
          onClick={() => setDevBypass(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-stone-400 underline"
        >
          Dev-Modus (ohne Login)
        </button>
      )}
    </div>
  )

  // Onboarding nicht abgeschlossen
  if (!profile?.onboarding_completed) {
    return <Onboarding userId={user.id} onComplete={setDogId} />
  }

  // Laden der Hunde
  if (dogsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Kein Hund ausgewählt oder ausgewählter Hund existiert nicht mehr
  const validDog = dogs.find(d => d.id === dogId)
  if (!validDog) {
    return <DogSelector onSelect={setDogId} />
  }

  return <MainApp dogId={validDog.id} dog={validDog} userId={user.id} />
}
