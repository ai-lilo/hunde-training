import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAllSports } from '../hooks/useUserSports'
import { useCreateDog } from '../hooks/useDogs'
import { useUpdateProfile } from '../hooks/useProfile'

interface Props {
  userId: string
  onComplete: (dogId: string) => void
}

type Step = 'name' | 'sports' | 'dog'

export function Onboarding({ userId, onComplete }: Props) {
  const [step, setStep] = useState<Step>('name')
  const [displayName, setDisplayName] = useState('')
  const [selectedSportIds, setSelectedSportIds] = useState<string[]>([])
  const [dogName, setDogName] = useState('')
  const [dogBreed, setDogBreed] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: sports = [] } = useAllSports()
  const createDog = useCreateDog()
  const updateProfile = useUpdateProfile()

  const toggleSport = (id: string) => {
    setSelectedSportIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleFinish = async () => {
    if (!dogName.trim()) return
    setSaving(true)
    try {
      // 1. Sportarten speichern
      if (selectedSportIds.length > 0) {
        const rows = selectedSportIds.map(sport_id => ({ user_id: userId, sport_id }))
        await supabase.from('user_sports').insert(rows)
      }

      // 2. Profil abschließen
      await updateProfile.mutateAsync({
        id: userId,
        display_name: displayName.trim() || null,
        onboarding_completed: true,
      })

      // 3. Ersten Hund anlegen
      const dog = await createDog.mutateAsync({
        name: dogName.trim(),
        breed: dogBreed.trim() || null,
      })

      onComplete(dog.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      {/* Fortschrittsanzeige */}
      <div className="flex gap-2 pt-2">
        {(['name', 'sports', 'dog'] as Step[]).map((s, i) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${
              step === s ? 'bg-amber-500' :
              (['name', 'sports', 'dog'] as Step[]).indexOf(step) > i ? 'bg-amber-300' : 'bg-stone-200'
            }`}
          />
        ))}
      </div>

      {/* Schritt 1: Name */}
      {step === 'name' && (
        <div className="flex flex-col flex-1 gap-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Willkommen!</h1>
            <p className="text-sm text-stone-500 mt-1">Wie soll dein Anzeigename sein?</p>
          </div>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Dein Name (optional)"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="mt-auto">
            <button
              onClick={() => setStep('sports')}
              className="w-full py-3 bg-amber-600 text-white font-semibold rounded-xl active:scale-95 transition-transform"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Schritt 2: Sportarten */}
      {step === 'sports' && (
        <div className="flex flex-col flex-1 gap-6">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Welche Sportarten trainierst du?</h2>
            <p className="text-sm text-stone-500 mt-1">Du kannst das später jederzeit ändern.</p>
          </div>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
            {sports.map(sport => (
              <button
                key={sport.id}
                onClick={() => toggleSport(sport.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                  selectedSportIds.includes(sport.id)
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-stone-200 bg-white'
                }`}
              >
                <span className="text-2xl">{sport.icon}</span>
                <span className={`font-medium ${selectedSportIds.includes(sport.id) ? 'text-amber-800' : 'text-stone-700'}`}>
                  {sport.name}
                </span>
                {selectedSportIds.includes(sport.id) && (
                  <span className="ml-auto text-amber-600">✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('name')}
              className="flex-1 py-3 border border-stone-200 text-stone-600 font-semibold rounded-xl"
            >
              Zurück
            </button>
            <button
              onClick={() => setStep('dog')}
              className="flex-1 py-3 bg-amber-600 text-white font-semibold rounded-xl active:scale-95 transition-transform"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Schritt 3: Hund */}
      {step === 'dog' && (
        <div className="flex flex-col flex-1 gap-6">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Dein Hund</h2>
            <p className="text-sm text-stone-500 mt-1">Wie heißt dein Hund?</p>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Name *</label>
              <input
                type="text"
                value={dogName}
                onChange={e => setDogName(e.target.value)}
                placeholder="z.B. Ari"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Rasse (optional)</label>
              <input
                type="text"
                value={dogBreed}
                onChange={e => setDogBreed(e.target.value)}
                placeholder="z.B. Australian Shepherd"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-auto">
            <button
              onClick={() => setStep('sports')}
              className="flex-1 py-3 border border-stone-200 text-stone-600 font-semibold rounded-xl"
            >
              Zurück
            </button>
            <button
              onClick={handleFinish}
              disabled={!dogName.trim() || saving}
              className="flex-1 py-3 bg-amber-600 text-white font-semibold rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              {saving ? 'Wird gespeichert…' : 'Loslegen!'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
