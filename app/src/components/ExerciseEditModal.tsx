import { useState } from 'react'
import type { Exercise, ExerciseOverride } from '../data/types'

interface Props {
  exercise: Exercise
  allExercises: Exercise[]
  onSave: (id: string, changes: ExerciseOverride) => void
  onDelete: (id: string) => void
  onClose: () => void
}

const CATEGORY_LABEL: Record<string, string> = {
  grundlage: 'Grundlagen',
  unterordnung: 'Unterordnung',
  verkehr: 'Verkehrsteil',
  pruefung: 'Prüfungsablauf',
  sport: 'Sport',
}

export function ExerciseEditModal({ exercise, allExercises, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(exercise.name)
  const [description, setDescription] = useState(exercise.description)
  const [prerequisites, setPrerequisites] = useState<string[]>(exercise.prerequisites)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Candidate prerequisites: top-level exercises in same or other categories, excluding self and its own children
  const prereqCandidates = allExercises.filter(
    e => !e.parentId && e.id !== exercise.id
  )

  const categories = ['grundlage', 'unterordnung', 'verkehr', 'pruefung', 'sport'] as const

  function togglePrereq(id: string) {
    setPrerequisites(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSave() {
    if (!name.trim()) return
    onSave(exercise.id, {
      name: name.trim(),
      description: description.trim(),
      prerequisites,
    })
    onClose()
  }

  function handleDelete() {
    onDelete(exercise.id)
    onClose()
  }

  const isDirty =
    name.trim() !== exercise.name ||
    description.trim() !== exercise.description ||
    JSON.stringify([...prerequisites].sort()) !== JSON.stringify([...exercise.prerequisites].sort())

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" />

      {/* Sheet */}
      <div
        className="bg-white rounded-t-2xl shadow-xl flex flex-col max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h3 className="text-base font-semibold text-stone-800">Übung bearbeiten</h3>
          <button onClick={onClose} className="text-stone-400 text-xl leading-none px-1">×</button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Kurze Beschreibung der Übung"
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 bg-white resize-none"
            />
          </div>

          {/* Prerequisites */}
          <div>
            <label className="text-xs text-stone-500 mb-2 block">Voraussetzungen</label>
            {categories.map(cat => {
              const exs = prereqCandidates.filter(e => e.category === cat)
              if (exs.length === 0) return null
              return (
                <div key={cat} className="mb-3">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
                    {CATEGORY_LABEL[cat]}
                  </p>
                  <div className="flex flex-col gap-1">
                    {exs.map(e => {
                      const checked = prerequisites.includes(e.id)
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => togglePrereq(e.id)}
                          className="flex items-center gap-2.5 py-1 text-left"
                        >
                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            checked ? 'bg-amber-500 border-amber-500' : 'border-stone-300'
                          }`}>
                            {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                          </span>
                          <span className="text-sm text-stone-700">{e.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim() || !isDirty}
              className={`w-full py-3.5 rounded-2xl text-sm font-semibold transition-colors ${
                name.trim() && isDirty
                  ? 'bg-amber-600 text-white active:bg-amber-700'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
              }`}
            >
              Änderungen speichern
            </button>

            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 rounded-2xl text-sm border border-stone-200 text-stone-500"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-red-500 text-white active:bg-red-600"
                >
                  Ja, löschen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full py-3 rounded-2xl text-sm text-red-400 border border-red-100 active:bg-red-50"
              >
                Übung löschen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
