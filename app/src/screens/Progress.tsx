import { useMemo, useState } from 'react'
import type { Exercise, ExerciseOverride, ExerciseStatus, Level, TrainingSession, Command } from '../data/types'
import { getStatusMap, levelIndex, nextLevel } from '../data/progression'
import { LEVEL_LABEL, CATEGORY_LABEL, LEVEL_ORDER } from '../data/labels'
import { LevelBadge } from '../components/LevelBadge'
import { LevelTimeline } from '../components/LevelTimeline'
import { CommandChip } from '../components/CommandChip'
import { ExerciseEditModal } from '../components/ExerciseEditModal'
import { BHAuswertung } from '../components/BHAuswertung'
import { useSetExerciseLevel } from '../hooks/useExerciseProgress'
import { useAllExerciseCommands, useLinkCommand, useUnlinkCommand } from '../hooks/useExerciseCommands'
import { useAllExerciseLevelHistory } from '../hooks/useExerciseLevelHistory'

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  sessions: TrainingSession[]
  dogId: string
  userId: string
  allCommands: Command[]
  onUpdateExercise: (id: string, changes: ExerciseOverride) => void
  onDeleteExercise: (id: string) => void
}

export function Progress({ statuses, allExercises, sessions, dogId, userId, allCommands, onUpdateExercise, onDeleteExercise }: Props) {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [showResetFor, setShowResetFor] = useState<string | null>(null)
  const [showCommandPickerFor, setShowCommandPickerFor] = useState<string | null>(null)
  const [levelUpId, setLevelUpId] = useState<string | null>(null)

  const setLevel = useSetExerciseLevel(dogId, userId)
  const linkCommand = useLinkCommand(userId)
  const unlinkCommand = useUnlinkCommand(userId)
  const { data: exerciseCommandLinks = {} } = useAllExerciseCommands(userId)
  const { data: levelHistoryAll = {} } = useAllExerciseLevelHistory(dogId)

  const allExerciseMap = useMemo(
    () => Object.fromEntries(allExercises.map(e => [e.id, e])),
    [allExercises]
  )
  const map = getStatusMap(statuses, allExercises)

  function handleNextLevel(ex: Exercise, current: Level) {
    const next = nextLevel(current)
    if (!next) return
    setLevel.mutate({ exerciseId: ex.id, level: next })
    setShowResetFor(null)
    setLevelUpId(ex.id)
    setTimeout(() => setLevelUpId(null), 2000)
  }

  function handleLinkCommand(exerciseId: string, commandId: string) {
    linkCommand.mutate({ exerciseId, commandId })
    setShowCommandPickerFor(null)
  }

  const categories = ['grundlage', 'unterordnung', 'verkehr', 'pruefung', 'sport'] as const

  return (
    <>
      <div className="flex flex-col gap-6 p-4 pb-28">
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
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                {CATEGORY_LABEL[cat]}
              </p>
              <div className="flex flex-col gap-3">
                {exs.map(ex => {
                  const current = map[ex.id] ?? 'nicht_begonnen'
                  const idx = levelIndex(current)
                  const next = nextLevel(current)
                  const isCustom = ex.id.startsWith('custom_')
                  const recentSessions = sessions
                    .filter(s => s.entries.some(e => e.exerciseId === ex.id))
                    .slice(0, 3)
                  const links = exerciseCommandLinks[ex.id] ?? []
                  const history = levelHistoryAll[ex.id] ?? []
                  const isLevelUp = levelUpId === ex.id

                  return (
                    <details key={ex.id} className={`bg-white rounded-xl shadow-sm group ${isLevelUp ? 'ring-2 ring-green-400' : isCustom ? 'border border-teal-100' : 'border border-stone-100'}`}>
                      <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none select-none active:bg-stone-50 rounded-xl">
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-stone-800 truncate">{ex.name}</span>
                            {isCustom && <span className="text-[10px] text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-200 flex-shrink-0">eigene</span>}
                          </div>
                          <span className="text-xs text-stone-400 mt-0.5 truncate">{ex.criteria[current]}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          {isLevelUp && <span className="text-xs text-green-600 animate-bounce">🎉</span>}
                          <LevelBadge level={current} />
                          <span className="text-stone-300 text-xs group-open:rotate-180 transition-transform">▾</span>
                        </div>
                      </summary>

                      <div className="px-4 pb-4 flex flex-col gap-4 border-t border-stone-50 pt-3">

                        {/* Level-Fortschrittsbalken */}
                        <div>
                          <div className="flex gap-1 mb-2">
                            {LEVEL_ORDER.map((l, i) => (
                              <div
                                key={l}
                                className={`flex-1 h-1.5 rounded-full transition-colors ${i <= idx ? 'bg-teal-400' : 'bg-stone-100'}`}
                              />
                            ))}
                          </div>

                          {isLevelUp && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-2.5 mb-2 text-center">
                              <p className="text-xs font-semibold text-green-700">🎉 Neue Stufe: {LEVEL_LABEL[current]}!</p>
                            </div>
                          )}

                          {next && !showResetFor && (
                            <button
                              onClick={() => handleNextLevel(ex, current)}
                              className="w-full py-2.5 bg-teal-700 text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform"
                            >
                              Nächste Stufe → {LEVEL_LABEL[next]}
                            </button>
                          )}
                          {!next && (
                            <div className="text-center py-1.5">
                              <span className="text-xs text-green-600 font-semibold">✓ Höchste Stufe erreicht</span>
                            </div>
                          )}
                          {!showResetFor && current !== 'nicht_begonnen' && (
                            <button
                              onClick={() => setShowResetFor(ex.id)}
                              className="w-full text-xs text-stone-400 mt-1.5 py-1"
                            >
                              Stufe zurücksetzen
                            </button>
                          )}
                          {showResetFor === ex.id && (
                            <div className="flex flex-col gap-1.5 mt-1">
                              <p className="text-xs text-stone-400 text-center">Level manuell setzen</p>
                              <div className="flex flex-wrap gap-1.5">
                                {LEVEL_ORDER.map(l => (
                                  <button
                                    key={l}
                                    onClick={() => {
                                      setLevel.mutate({ exerciseId: ex.id, level: l })
                                      setShowResetFor(null)
                                    }}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                      current === l ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-stone-600 border-stone-200 active:bg-stone-50'
                                    }`}
                                  >
                                    {LEVEL_LABEL[l]}
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => setShowResetFor(null)} className="text-xs text-stone-400 text-center mt-0.5">Abbrechen</button>
                            </div>
                          )}
                        </div>

                        {/* Nächste Stufe Beschreibung */}
                        {next && !isLevelUp && (
                          <div className="bg-teal-50 rounded-xl p-3">
                            <p className="text-xs font-medium text-teal-700 mb-0.5">Ziel: {LEVEL_LABEL[next]}</p>
                            <p className="text-xs text-teal-600">{ex.criteria[next]}</p>
                          </div>
                        )}

                        {/* Bearbeiten-Button */}
                        <button
                          type="button"
                          onClick={() => setEditingExercise(ex)}
                          className="self-start text-xs text-teal-700 border border-teal-200 rounded-lg px-2.5 py-1 active:bg-teal-50"
                        >
                          ✎ Bearbeiten
                        </button>

                        {/* Voraussetzungen */}
                        {ex.prerequisites.length > 0 && (
                          <div>
                            <p className="text-xs text-stone-400 mb-1.5">Voraussetzungen</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ex.prerequisites.map(pid => {
                                const prereq = allExerciseMap[pid]
                                const lvl = map[pid] ?? 'nicht_begonnen'
                                const met = levelIndex(lvl) >= levelIndex('basis')
                                return (
                                  <span
                                    key={pid}
                                    className={`text-xs px-2 py-0.5 rounded-full ${met ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                                  >
                                    {met ? '✓' : '○'} {prereq?.name ?? pid}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Kommandos */}
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-stone-400">Kommandos</p>
                          {links.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {links.map(link => {
                                const cmd = allCommands.find(c => c.id === link.commandId)
                                if (!cmd) return null
                                return (
                                  <CommandChip
                                    key={link.id}
                                    name={cmd.name}
                                    onRemove={() => unlinkCommand.mutate({ linkId: link.id, exerciseId: ex.id })}
                                  />
                                )
                              })}
                            </div>
                          )}
                          {showCommandPickerFor === ex.id ? (
                            <div className="flex flex-col gap-1">
                              {allCommands.filter(c => !links.some(l => l.commandId === c.id)).length === 0 ? (
                                <p className="text-xs text-stone-400 italic">Alle Kommandos bereits verknüpft</p>
                              ) : (
                                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto">
                                  {allCommands
                                    .filter(c => !links.some(l => l.commandId === c.id))
                                    .map(cmd => (
                                      <button
                                        key={cmd.id}
                                        onClick={() => handleLinkCommand(ex.id, cmd.id)}
                                        className="text-left text-xs px-3 py-2 rounded-lg bg-stone-50 border border-stone-100 text-stone-700 active:bg-teal-50"
                                      >
                                        <span className="font-medium">{cmd.name}</span>
                                        {cmd.description && <span className="text-stone-400"> — {cmd.description}</span>}
                                      </button>
                                    ))}
                                </div>
                              )}
                              <button onClick={() => setShowCommandPickerFor(null)} className="text-xs text-stone-400 mt-0.5">Schließen</button>
                            </div>
                          ) : (
                            allCommands.length > 0 && (
                              <button
                                onClick={() => setShowCommandPickerFor(ex.id)}
                                className="text-xs text-teal-700 border border-teal-200 rounded-lg px-2.5 py-1.5 self-start active:bg-teal-50"
                              >
                                + Kommando verknüpfen
                              </button>
                            )
                          )}
                          {allCommands.length === 0 && (
                            <p className="text-xs text-stone-300 italic">Kommandos anlegen in den Einstellungen</p>
                          )}
                        </div>

                        {/* Letzte Einheiten */}
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

                        {/* Lernkurve */}
                        {history.length > 0 && <LevelTimeline history={history} />}
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
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              Trainingsprotokoll
            </p>
            <div className="flex flex-col gap-2">
              {sessions.slice(0, 10).map(s => {
                const date = new Date(s.date).toLocaleDateString('de-DE', {
                  weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit'
                })
                return (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm border border-stone-100 px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-stone-700">{date}</span>
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
