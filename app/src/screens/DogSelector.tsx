import { useState } from 'react'
import { useDogs, useCreateDog } from '../hooks/useDogs'
import { supabase } from '../lib/supabase'

interface Props {
  onSelect: (dogId: string) => void
}

export function DogSelector({ onSelect }: Props) {
  const { data: dogs = [], isLoading } = useDogs()
  const createDog = useCreateDog()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBreed, setNewBreed] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const dog = await createDog.mutateAsync({ name: newName.trim(), breed: newBreed.trim() || null })
    onSelect(dog.id)
    setAdding(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6 gap-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-stone-800">Meine Hunde</h1>
        <p className="text-sm text-stone-500 mt-1">Wähle einen Hund aus</p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {dogs.map(dog => (
          <button
            key={dog.id}
            onClick={() => onSelect(dog.id)}
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm text-left active:scale-95 transition-transform"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
              🐕
            </div>
            <div>
              <p className="font-semibold text-stone-800">{dog.name}</p>
              {dog.breed && <p className="text-sm text-stone-500">{dog.breed}</p>}
            </div>
            <span className="ml-auto text-stone-300">›</span>
          </button>
        ))}

        {/* Neuen Hund hinzufügen */}
        {showAdd ? (
          <div className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-col gap-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Name des Hundes"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <input
              type="text"
              value={newBreed}
              onChange={e => setNewBreed(e.target.value)}
              placeholder="Rasse (optional)"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-600 font-medium rounded-xl text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || adding}
                className="flex-1 py-2.5 bg-amber-600 text-white font-medium rounded-xl text-sm disabled:opacity-50"
              >
                {adding ? 'Wird gespeichert…' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 active:scale-95 transition-transform"
          >
            <span className="text-xl">+</span>
            <span className="text-sm font-medium">Weiteren Hund hinzufügen</span>
          </button>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="text-sm text-stone-400 text-center"
      >
        Abmelden
      </button>
    </div>
  )
}
