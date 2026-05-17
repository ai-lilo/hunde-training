import { useMemo, useState } from 'react'
import type { Exercise, ExerciseOverride, ExerciseStatus, Level, TrainingSession } from '../data/types'
import { getStatusMap, levelIndex } from '../data/progression'
import { LevelBadge } from '../components/LevelBadge'
import { ExerciseEditModal } from '../components/ExerciseEditModal'
import { BHAuswertung } from '../components/BHAuswertung'

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  sessions: TrainingSession[]
  onUpdateExercise: (id: string, changes: ExerciseOverride) => void
  onDeleteExercise: (id: string) => void
}

const LEVEL_ORDER: Level[] = ['nicht_begonnen', 'aufbau', 'basis', 'stabil', 'pruefungsreif']

const CATEGORY_LABEL: Record<string, string> = {
  grundlage: 'Grundlagen',
  unterordnung: 'Unterordnung',
  verkehr: 'Verkehrsteil',
  pruefung: 'Prüfungsablauf',
  sport: 'Sport',
}

export function Progress({ statuses, allExercises, sessions, onUpdateExercise, onDeleteExercise }: Props) {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)

  const allExerciseMap = useMemo(
    () => Object.fromEntries(allExercises.map(e => [e.id, e])),
    [allExercises]
  )
  const map = getStatusMap(statuses, allExercises)

  const categories = ['grundlage', 'unterordnung', 'verkehr', 'pruefung', 'sport'] as const

  return (
    <>
      <div className="flex flex-col gap-4 p-4 pb-24">
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-stone-800">Fortschritt</h1>
          <p className="text-sm text-stone-500 mt-0.5">Aktueller Stand je Übung</p>
        </div>

        <BHAuswertung sessions={sessions} allExercises={allExercises} />

        {categories.map(cat => {
          const exs = allExercises.filter(e => e.category === cat && !e.parentId)
          if (exs.length === 0) return null
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                {CATEGORY_LABEL[cat]}
              </p>
              <div className="flex flex-col gap-2">
                {exs.map(ex => {
                  const current = map[ex.id] ?? 'nicht_begonnen'
                  const idx = levelIndex(current)
                  const isCustom = ex.id.startsWith('custom_')
                  const isFoundational = ex.isFoundational === true
                  const recentSessions = sessions
                    .filter(s => s.entries.some(e => e.exerciseId === ex.id))
                    .slice(0, 3)

                  return (
                    <details key={ex.id} className={`bg-white rounded-xl border group ${isCustom ? 'border-amber-100' : 'border-stone-100'}`}>
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none select-none active:bg-stone-50">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-medium text-stone-800 truncate">{ex.name}</span>
                            {isCustom && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">eigene</span>}
                            {isFoundational && <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full border border-stone-200 flex-shrink-0">Grundlagen</span>}
                          </div>
                          <span className="text-xs text-stone-400 mt-0.5 truncate">{ex.criteria[current]}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <LevelBadge level={current} />
                          <span className="text-stone-400 text-xs group-open:rotate-180 transition-transform">▾</span>
                        </div>
                      </summary>

                      <div className="px-4 pb-4 flex flex-col gap-3 border-t border-stone-50 pt-3">
                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => setEditingExercise(ex)}
                          className="self-start text-xs text-amber-600 border border-amber-200 rounded-lg px-2.5 py-1 active:bg-amber-50"
                        >
                          ✎ Bearbeiten
                        </button>

                        {/* Level bar */}
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
                            <span>Prüfungsreif</span>
                          </div>
                        </div>

                        {/* Nächste Stufe */}
                        {idx < 3 && (
                          <div className="bg-amber-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-amber-700 mb-0.5">Nächste Stufe: {LEVEL_ORDER[idx + 1]}</p>
                            <p className="text-xs text-amber-600">{ex.criteria[LEVEL_ORDER[idx + 1]]}</p>
                          </div>
                        )}

                        {/* Voraussetzungen */}
                        {ex.prerequisites.length > 0 && (
                          <div>
                            <p className="text-xs text-stone-400 mb-1">Voraussetzungen</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ex.prerequisites.map(pid => {
                                const prereq = allExerciseMap[pid]
                                const lvl = map[pid] ?? 'nicht_begonnen'
                                const met = levelIndex(lvl) >= levelIndex('basis')
                                return (
                                  <span
                                    key={pid}
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      met ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                                    }`}
                                  >
                                    {met ? '✓' : '○'} {prereq?.name ?? pid}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Recent training history */}
                        {recentSessions.length > 0 && (
                          <div>
                            <p className="text-xs text-stone-400 mb-1.5">Letzte Einheiten</p>
                            <div className="flex flex-col gap-1.5">
                              {recentSessions.map(s => {
                                const entry = s.entries.find(e => e.exerciseId === ex.id)!
                                const date = new Date(s.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
                                const ratingEmoji = entry.rating === 3 ? '😄' : entry.rating === 2 ? '🙂' : '😕'
                                return (
                                  <div key={s.id} className="flex items-center gap-2 text-xs text-stone-500">
                                    <span className="text-stone-400 w-10 flex-shrink-0">{date}</span>
                                    <span>{ratingEmoji}</span>
                                    <LevelBadge level={entry.levelAfter} />
                                    {entry.note && <span className="text-stone-400 truncate">{entry.note}</span>}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Session history */}
        {sessions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
              Trainingsprotokoll
            </p>
            <div className="flex flex-col gap-2">
              {sessions.slice(0, 10).map(s => {
                const date = new Date(s.date).toLocaleDateString('de-DE', {
                  weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit'
                })
                return (
                  <div key={s.id} className="bg-white rounded-xl border border-stone-100 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-stone-700">{date}</span>
                      <span className="text-xs text-stone-400">{s.entries.length} Übung{s.entries.length !== 1 ? 'en' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {s.entries.map(e => (
                        <span key={e.exerciseId} className="text-xs bg-stone-50 text-stone-600 px-2 py-0.5 rounded-full border border-stone-100">
                          {allExerciseMap[e.exerciseId]?.name ?? e.exerciseId}
                        </span>
                      ))}
                    </div>
                    {s.generalNote && (
                      <p className="text-xs text-stone-400 mt-2 italic">"{s.generalNote}"</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          allExercises={allExercises}
          onSave={onUpdateExercise}
          onDelete={onDeleteExercise}
          onClose={() => setEditingExercise(null)}
        />
      )}
    </>
  )
}
