import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import { useActiveDog } from './hooks/useActiveDog'
import { useDogs } from './hooks/useDogs'
import { Login } from './screens/Login'
import { Onboarding } from './screens/Onboarding'
import { DogSelector } from './screens/DogSelector'
import MainApp from './App'

export function AppShell() {
  const { user, loading: authLoading } = useAuth()
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

  // Nicht angemeldet → Login
  if (!user) return <Login />

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
