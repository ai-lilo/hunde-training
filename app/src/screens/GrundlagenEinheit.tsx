import { useState } from 'react'
import type { Exercise, ExerciseStatus, Level, TrainingEntry } from '../data/types'
import { getStatusMap, levelIndex } from '../data/progression'
import { LevelBadge } from '../components/LevelBadge'

const GL_CATEGORY_LABEL: Record<string, string> = {
  gl_mindset: 'Mindset',
  gl_physio: 'Physio',
  gl_fuss: 'Fuß',
  gl_sitz: 'Sitz',
  gl_platz: 'Platz',
  gl_steh: 'Steh',
  grundlage: 'BH-Grundlagen',
}

const LEVEL_ORDER: Level[] = ['nicht_begonnen', 'aufbau', 'basis', 'stabil']
const LEVEL_LABEL: Record<Level, string> = {
  nicht_begonnen: 'Nicht begonnen',
  aufbau: 'Aufbau',
  basis: 'Basis',
  stabil: 'Stabil',
  pruefungsreif: 'Prüfungsreif',
}

interface EntryDraft {
  rating: 1 | 2 | 3
  note: string
  levelAfter: Level
}

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  onSave: (entries: TrainingEntry[], date: string) => void
  onCancel: () => void
}

export function GrundlagenEinheit({ statuses, allExercises, onSave, onCancel }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [selected, setSelected] = useState<Record<string, EntryDraft>>({})

  const map = getStatusMap(statuses, allExercises)

  const glExercises = allExercises.filter(e =>
    e.isFoundational || e.category.startsWith('gl_')
  )

  // Gruppieren
  const categoryOrder = ['gl_mindset', 'gl_physio', 'gl_fuss', 'gl_sitz', 'gl_platz', 'gl_steh', 'grundlage']
  const grouped = categoryOrder
    .map(cat => ({
      cat,
      exercises: glExercises.filter(e =>
        cat === 'grundlage' ? e.isFoundational && e.category === 'grundlage' : e.category === cat
      ),
    }))
    .filter(g => g.exercises.length > 0)

  function toggleExercise(ex: Exercise) {
    setSelected(prev => {
      if (prev[ex.id]) {
        const next = { ...prev }
        delete next[ex.id]
        return next
      }
      return {
        ...prev,
        [ex.id]: { rating: 2, note: '', levelAfter: map[ex.id] ?? 'nicht_begonnen' },
      }
    })
  }

  function updateEntry(id: string, patch: Partial<EntryDraft>) {
    setSelected(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  const canSave = Object.keys(selected).length > 0

  function handleSave() {
    const entries: TrainingEntry[] = Object.entries(selected).map(([exerciseId, draft]) => ({
      exerciseId,
      rating: draft.rating,
      note: draft.note,
      levelAfter: draft.levelAfter,
    }))
    onSave(entries, new Date(date + 'T12:00:00').toISOString())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4 pb-4">
          <div className="flex items-center justify-between pt-2">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">Schnell-Einheit</h1>
              <p className="text-sm text-stone-500 mt-0.5">Übungen antippen zum Auswählen</p>
            </div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          {grouped.map(({ cat, exercises }) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                {GL_CATEGORY_LABEL[cat] ?? cat}
              </p>
              <div className="flex flex-col gap-2">
                {exercises.map(ex => {
                  const isChosen = !!selected[ex.id]
                  const current = map[ex.id] ?? 'nicht_begonnen'
                  const draft = selected[ex.id]

                  return (
                    <div key={ex.id} className={`rounded-xl border transition-colors ${isChosen ? 'border-amber-300 bg-amber-50' : 'border-stone-100 bg-white'}`}>
                      {/* Titelzeile — antippen zum Auswählen */}
                      <button
                        type="button"
                        onClick={() => toggleExercise(ex)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center text-xs ${isChosen ? 'bg-amber-500 border-amber-500 text-white' : 'border-stone-300'}`}>
                            {isChosen ? '✓' : ''}
                          </span>
                          <span className="text-sm font-medium text-stone-800 truncate">{ex.name}</span>
                        </div>
                        <LevelBadge level={current} />
                      </button>

                      {/* Aufgeklappte Eingabe wenn ausgewählt */}
                      {isChosen && draft && (
                        <div className="px-4 pb-4 flex flex-col gap-3 border-t border-amber-100 pt-3">
                          {/* Rating */}
                          <div>
                            <p className="text-xs text-stone-500 mb-1.5">Bewertung</p>
                            <div className="flex gap-2">
                              {([1, 2, 3] as const).map(r => (
                                <button
                                  key={r}
                                  onClick={() => updateEntry(ex.id, { rating: r })}
                                  className={`flex-1 py-2 rounded-lg text-xl transition-colors ${
                                    draft.rating === r ? 'bg-amber-100 ring-1 ring-amber-400' : 'bg-white border border-stone-200'
                                  }`}
                                >
                                  {r === 3 ? '😄' : r === 2 ? '🙂' : '😕'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Level */}
                          <div>
                            <p className="text-xs text-stone-500 mb-1.5">Level nach Einheit</p>
                            <div className="flex flex-wrap gap-1.5">
                              {LEVEL_ORDER.map((l, i) => {
                                const currentIdx = levelIndex(current)
                                if (i < currentIdx) return null
                                return (
                                  <button
                                    key={l}
                                    onClick={() => updateEntry(ex.id, { levelAfter: l })}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                      draft.levelAfter === l
                                        ? 'bg-amber-500 text-white border-amber-500'
                                        : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                                    }`}
                                  >
                                    {LEVEL_LABEL[l]}
                                    {l === current && ' (aktuell)'}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Notiz */}
                          <input
                            type="text"
                            placeholder="Notiz (optional)"
                            value={draft.note}
                            onChange={e => updateEntry(ex.id, { note: e.target.value })}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {glExercises.length === 0 && (
            <div className="text-center py-12 text-stone-400 text-sm">
              Noch keine Übungen. Lege zuerst Übungen im Fortschritt an.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 bg-white border-t border-stone-100 p-4 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 text-sm text-stone-500 border border-stone-200 rounded-xl active:bg-stone-50"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-3 bg-amber-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          {Object.keys(selected).length > 0
            ? `${Object.keys(selected).length} Übung${Object.keys(selected).length !== 1 ? 'en' : ''} speichern`
            : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
