import { useState } from 'react'
import type { Exercise, ExerciseStatus, Level, LevelCriteria } from '../data/types'
import { CUSTOM_CRITERIA } from '../data/exercises'
import { getStatusMap, levelIndex } from '../data/progression'
import { LevelBadge } from '../components/LevelBadge'
import { useSetExerciseLevel } from '../hooks/useExerciseProgress'

const GL_CATEGORIES = [
  { key: 'gl_mindset' as const, label: 'Mindset' },
  { key: 'gl_physio'  as const, label: 'Physio' },
  { key: 'gl_fuss'    as const, label: 'Fuß' },
  { key: 'gl_sitz'    as const, label: 'Sitz' },
  { key: 'gl_platz'   as const, label: 'Platz' },
  { key: 'gl_steh'    as const, label: 'Steh' },
]

const LEVEL_ORDER: Level[] = ['nicht_begonnen', 'aufbau', 'basis', 'stabil']
const LEVEL_LABEL: Record<Level, string> = {
  nicht_begonnen: 'Noch nicht begonnen',
  aufbau: 'Aufbau',
  basis: 'Basis',
  stabil: 'Stabil',
  pruefungsreif: 'Prüfungsreif',
}

interface AddFormState {
  name: string
  description: string
  aufbau: string
  basis: string
  stabil: string
}

const EMPTY_FORM: AddFormState = { name: '', description: '', aufbau: '', basis: '', stabil: '' }

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  dogId: string
  userId: string
  onAddExercise: (fields: { name: string; category: Exercise['category']; description?: string; criteria?: LevelCriteria }) => void
}

export function GrundlagenFortschritt({ statuses, allExercises, dogId, userId, onAddExercise }: Props) {
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM)
  const setLevel = useSetExerciseLevel(dogId, userId)

  const map = getStatusMap(statuses, allExercises)

  const foundationalExercises = allExercises.filter(e => e.isFoundational)

  function handleSubmit(categoryKey: string) {
    if (!form.name.trim()) return
    const hasCriteria = form.aufbau || form.basis || form.stabil
    const criteria: LevelCriteria | undefined = hasCriteria ? {
      nicht_begonnen: CUSTOM_CRITERIA.nicht_begonnen,
      aufbau: form.aufbau || CUSTOM_CRITERIA.aufbau,
      basis: form.basis || CUSTOM_CRITERIA.basis,
      stabil: form.stabil || CUSTOM_CRITERIA.stabil,
      pruefungsreif: CUSTOM_CRITERIA.pruefungsreif,
    } : undefined
    onAddExercise({
      name: form.name.trim(),
      category: categoryKey as Exercise['category'],
      description: form.description.trim() || undefined,
      criteria,
    })
    setAddingTo(null)
    setForm(EMPTY_FORM)
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-stone-800">Grundlagen</h1>
        <p className="text-sm text-stone-500 mt-0.5">Fundament für alle Sportarten</p>
      </div>

      {GL_CATEGORIES.map(cat => {
        const customExs = allExercises.filter(e => e.category === cat.key)
        const mindsetExs = cat.key === 'gl_mindset' ? foundationalExercises : []
        const allCatExs = [...mindsetExs, ...customExs]

        return (
          <div key={cat.key}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{cat.label}</p>
              {addingTo !== cat.key && (
                <button
                  onClick={() => { setAddingTo(cat.key); setForm(EMPTY_FORM) }}
                  className="text-xs text-amber-600 border border-amber-200 rounded-lg px-2 py-0.5 active:bg-amber-50"
                >
                  + Übung
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {allCatExs.map(ex => {
                const current = map[ex.id] ?? 'nicht_begonnen'
                const idx = levelIndex(current)

                return (
                  <details key={ex.id} className={`bg-white rounded-xl border group ${ex.isFoundational ? 'border-stone-200' : 'border-amber-100'}`}>
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none active:bg-stone-50">
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-medium text-stone-800 truncate">{ex.name}</span>
                          {ex.isFoundational && (
                            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full border border-stone-200 flex-shrink-0">BH-Grundlage</span>
                          )}
                        </div>
                        <span className="text-xs text-stone-400 mt-0.5 truncate">{ex.criteria[current]}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <LevelBadge level={current} />
                        <span className="text-stone-400 text-xs group-open:rotate-180 transition-transform">▾</span>
                      </div>
                    </summary>

                    <div className="px-4 pb-4 flex flex-col gap-3 border-t border-stone-50 pt-3">
                      {/* Level-Selector */}
                      <div>
                        <p className="text-xs text-stone-400 mb-1.5">Level setzen</p>
                        <div className="flex flex-wrap gap-1.5">
                          {LEVEL_ORDER.map(l => (
                            <button
                              key={l}
                              onClick={() => setLevel.mutate({ exerciseId: ex.id, level: l })}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                current === l
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                              }`}
                            >
                              {LEVEL_LABEL[l]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Level-Fortschrittsbalken */}
                      <div>
                        <div className="flex gap-1 mb-1">
                          {LEVEL_ORDER.map((l, i) => (
                            <div
                              key={l}
                              className={`flex-1 h-1.5 rounded-full transition-colors ${
                                i <= idx ? 'bg-amber-400' : 'bg-stone-100'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-stone-400">
                          <span>Aufbau</span>
                          <span>Stabil</span>
                        </div>
                      </div>

                      {/* Nächste Stufe */}
                      {idx < 3 && idx >= 0 && LEVEL_ORDER[idx + 1] && (
                        <div className="bg-amber-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-amber-700 mb-0.5">Nächste Stufe: {LEVEL_LABEL[LEVEL_ORDER[idx + 1]]}</p>
                          <p className="text-xs text-amber-600">{ex.criteria[LEVEL_ORDER[idx + 1]]}</p>
                        </div>
                      )}

                      {/* Beschreibung */}
                      {ex.description && (
                        <p className="text-xs text-stone-500">{ex.description}</p>
                      )}
                    </div>
                  </details>
                )
              })}

              {/* Inline-Formular */}
              {addingTo === cat.key && (
                <div className="bg-white rounded-xl border border-amber-200 p-4 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-stone-700">Neue Übung — {cat.label}</p>

                  <input
                    autoFocus
                    type="text"
                    placeholder="Name der Übung *"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />

                  <input
                    type="text"
                    placeholder="Beschreibung (optional)"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />

                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-stone-400 font-medium">Level-Kriterien (optional)</p>
                    {(['aufbau', 'basis', 'stabil'] as const).map(l => (
                      <div key={l} className="flex items-center gap-2">
                        <span className="text-xs text-stone-400 w-20 flex-shrink-0 capitalize">{l}:</span>
                        <input
                          type="text"
                          placeholder={CUSTOM_CRITERIA[l]}
                          value={form[l]}
                          onChange={e => setForm(f => ({ ...f, [l]: e.target.value }))}
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSubmit(cat.key)}
                      disabled={!form.name.trim()}
                      className="flex-1 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg disabled:opacity-40 active:scale-95 transition-transform"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={() => { setAddingTo(null); setForm(EMPTY_FORM) }}
                      className="px-4 py-2 text-sm text-stone-500 border border-stone-200 rounded-lg active:bg-stone-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {allCatExs.length === 0 && addingTo !== cat.key && (
                <p className="text-xs text-stone-300 px-1">Noch keine Übungen — tippe auf "+ Übung"</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
