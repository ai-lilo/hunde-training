import { useState, useMemo } from 'react'
import type { Exercise, TrainingEntry, Level, ExerciseStatus } from '../data/types'
import { getStatusMap, nextLevel } from '../data/progression'
import { LevelBadge } from '../components/LevelBadge'
import { CustomExerciseModal } from '../components/CustomExerciseModal'

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  onSave: (entries: TrainingEntry[], note: string, date: string) => void
  onCancel: () => void
  onAddCustomExercise: (fields: { name: string; category: import('../data/types').Category; description: string }) => void
}

const RATING_LABEL: Record<1 | 2 | 3, { emoji: string; label: string }> = {
  1: { emoji: '😕', label: 'Schwierig' },
  2: { emoji: '🙂', label: 'Okay' },
  3: { emoji: '😄', label: 'Gut' },
}

const LEVEL_LABEL: Record<Level, string> = {
  aufbau: 'Aufbau',
  basis: 'Basis',
  stabil: 'Stabil',
  pruefungsreif: 'Prüfungsreif',
}

export function LogSession({ statuses, allExercises, onSave, onCancel, onAddCustomExercise }: Props) {
  const map = useMemo(() => getStatusMap(statuses, allExercises), [statuses, allExercises])

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [ratings, setRatings] = useState<Record<string, 1 | 2 | 3>>({})
  const [levelUpIds, setLevelUpIds] = useState<string[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [generalNote, setGeneralNote] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  function toggleExercise(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const subIds = allExercises.filter(e => e.parentId === id).map(e => e.id)
        return prev.filter(x => x !== id && !subIds.includes(x))
      }
      return [...prev, id]
    })
  }

  function toggleLevelUp(id: string) {
    setLevelUpIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function getRating(id: string): 1 | 2 | 3 { return ratings[id] ?? 2 }
  function getNote(id: string): string { return notes[id] ?? '' }
  function getLevel(id: string): Level {
    const current = map[id] ?? 'aufbau'
    if (levelUpIds.includes(id)) return nextLevel(current) ?? current
    return current
  }

  const canSave = selectedIds.length > 0

  function handleSave() {
    const finalized: TrainingEntry[] = selectedIds.map(id => ({
      exerciseId: id,
      rating: getRating(id),
      note: getNote(id),
      levelAfter: getLevel(id),
    }))
    onSave(finalized, generalNote, new Date(date + 'T12:00:00').toISOString())
  }

  const categories = [
    { key: 'grundlage', label: 'Grundlagen' },
    { key: 'unterordnung', label: 'Unterordnung' },
    { key: 'verkehr', label: 'Verkehrsteil' },
    { key: 'pruefung', label: 'Prüfungsablauf' },
    { key: 'sport', label: 'Sport' },
  ] as const

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100 bg-white flex-shrink-0">
          <button onClick={onCancel} className="text-stone-500 text-sm min-w-[70px]">Abbrechen</button>
          <h2 className="text-base font-semibold text-stone-800">Einheit eintragen</h2>
          <div className="min-w-[70px]" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Date picker */}
          <div className="bg-white rounded-xl border border-stone-100 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Datum</span>
            <input
              type="date"
              value={date}
              onChange={ev => setDate(ev.target.value)}
              className="text-sm text-stone-700 border-none outline-none bg-transparent"
            />
          </div>

          <p className="text-xs text-stone-400">Übungen antippen, die an diesem Tag trainiert wurden.</p>

          {categories.map(({ key, label }) => {
            const exs = allExercises.filter(e => e.category === key && !e.parentId)
            return (
              <div key={key}>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{label}</p>
                <div className="flex flex-col gap-2">
                  {exs.map(ex => {
                    const isSelected = selectedIds.includes(ex.id)
                    const currentLevel = map[ex.id] ?? 'aufbau'
                    const nextLvl = nextLevel(currentLevel)
                    const subExs = allExercises.filter(e => e.parentId === ex.id)
                    const isLevelUp = levelUpIds.includes(ex.id)

                    return (
                      <div key={ex.id} className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 text-left active:bg-stone-50"
                          onClick={() => toggleExercise(ex.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected ? 'bg-amber-500 border-amber-500' : 'border-stone-300'
                            }`}>
                              {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                            </span>
                            <span className="text-sm font-medium text-stone-800">{ex.name}</span>
                          </div>
                          <LevelBadge level={isSelected && isLevelUp && nextLvl ? nextLvl : currentLevel} />
                        </button>

                        {isSelected && (
                          <div className="px-4 pb-4 flex flex-col gap-3 border-t border-stone-100 pt-3 bg-stone-50">
                            {/* Rating */}
                            <div>
                              <p className="text-xs text-stone-400 mb-1.5">Wie lief es?</p>
                              <div className="flex gap-2">
                                {([1, 2, 3] as const).map(r => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRatings(prev => ({ ...prev, [ex.id]: r }))}
                                    className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                                      getRating(ex.id) === r
                                        ? 'bg-amber-50 border-amber-400 text-amber-800'
                                        : 'bg-white border-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {RATING_LABEL[r].emoji} {RATING_LABEL[r].label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Next level criteria & level-up checkbox */}
                            {nextLvl ? (
                              <div className={`rounded-xl p-3 border transition-colors ${
                                isLevelUp
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-stone-100 border-stone-200'
                              }`}>
                                <p className="text-xs text-stone-500 mb-0.5">
                                  Kriterium für <span className="font-medium text-stone-700">{LEVEL_LABEL[nextLvl]}</span>
                                </p>
                                <p className="text-xs text-stone-600 mb-3">{ex.criteria[nextLvl]}</p>
                                <button
                                  type="button"
                                  onClick={() => toggleLevelUp(ex.id)}
                                  className="flex items-center gap-2"
                                >
                                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                    isLevelUp
                                      ? 'bg-green-500 border-green-500'
                                      : 'border-stone-300 bg-white'
                                  }`}>
                                    {isLevelUp && <span className="text-white text-xs font-bold leading-none">✓</span>}
                                  </span>
                                  <span className={`text-xs font-medium ${isLevelUp ? 'text-green-700' : 'text-stone-500'}`}>
                                    {isLevelUp
                                      ? `Level up auf ${LEVEL_LABEL[nextLvl]}!`
                                      : 'Kriterium erfüllt → Level up'}
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <div className="bg-green-50 rounded-xl px-3 py-2 border border-green-200">
                                <p className="text-xs text-green-700 font-medium">✓ Bereits auf höchstem Level</p>
                              </div>
                            )}

                            {/* Note */}
                            <input
                              type="text"
                              placeholder="Notiz (optional)"
                              value={getNote(ex.id)}
                              onChange={ev => setNotes(prev => ({ ...prev, [ex.id]: ev.target.value }))}
                              className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-amber-400 bg-white"
                            />

                            {/* Sub-exercises */}
                            {subExs.length > 0 && (
                              <div className="border-t border-stone-200 pt-3">
                                <p className="text-xs text-stone-400 mb-2">Teilübungen</p>
                                <div className="flex flex-col gap-2">
                                  {subExs.map(sub => {
                                    const isSubSelected = selectedIds.includes(sub.id)
                                    return (
                                      <div key={sub.id}>
                                        <button
                                          type="button"
                                          onClick={() => toggleExercise(sub.id)}
                                          className="flex items-center gap-2 text-left w-full"
                                        >
                                          <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                            isSubSelected ? 'bg-amber-500 border-amber-500' : 'border-stone-300'
                                          }`}>
                                            {isSubSelected && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                                          </span>
                                          <span className="text-xs text-stone-700">{sub.name}</span>
                                        </button>
                                        {isSubSelected && (
                                          <div className="ml-6 mt-1.5 flex gap-1.5">
                                            {([1, 2, 3] as const).map(r => (
                                              <button
                                                key={r}
                                                type="button"
                                                onClick={() => setRatings(prev => ({ ...prev, [sub.id]: r }))}
                                                className={`flex-1 py-1 rounded-lg text-xs border transition-colors ${
                                                  getRating(sub.id) === r
                                                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                                                    : 'bg-white border-stone-200 text-stone-600'
                                                }`}
                                              >
                                                {RATING_LABEL[r].emoji}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Add custom exercise */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-stone-200 text-sm text-stone-400 active:border-amber-300 active:text-amber-600 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            Eigene Übung hinzufügen
          </button>

          {/* General note */}
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Allgemeine Notiz</p>
            <textarea
              placeholder="Besonderheiten, Umgebung, Aris Tagesform..."
              value={generalNote}
              onChange={ev => setGeneralNote(ev.target.value)}
              rows={3}
              className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400 bg-white resize-none"
            />
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors mb-4 ${
              canSave
                ? 'bg-amber-600 text-white active:bg-green-600'
                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
            }`}
          >
            {canSave
              ? `${selectedIds.length} Übung${selectedIds.length !== 1 ? 'en' : ''} speichern`
              : 'Keine Übung ausgewählt'}
          </button>
        </div>
      </div>

      {showAddModal && (
        <CustomExerciseModal
          onAdd={fields => { onAddCustomExercise(fields) }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  )
}
