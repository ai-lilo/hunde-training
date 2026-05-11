import { useMemo, useState } from 'react'
import type { Exercise, TrainingSession } from '../data/types'
import { RO_SIGNS } from '../data/ro-signs'

interface Props {
  sessions: TrainingSession[]
  allExercises: Exercise[]
  onDeleteSession: (id: string) => void
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

const roSignMap = Object.fromEntries(RO_SIGNS.map(s => [s.id, s]))

export function Tagebuch({ sessions, allExercises, onDeleteSession }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const allExerciseMap = useMemo(
    () => Object.fromEntries(allExercises.map(e => [e.id, e])),
    [allExercises]
  )

  function exerciseName(exerciseId: string): string {
    const ex = allExerciseMap[exerciseId]
    if (!ex) return exerciseId
    if (ex.parentId) {
      const parent = allExerciseMap[ex.parentId]
      return `${parent?.name ?? ex.parentId} – ${ex.name}`
    }
    return ex.name
  }
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4 pb-24">
        <div className="pt-2">
          <h1 className="text-2xl font-bold text-stone-800">Trainingstagebuch</h1>
          <p className="text-sm text-stone-500 mt-0.5">Alle Trainingseinheiten im Überblick</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 text-center">
          <p className="text-stone-400 text-sm">Noch keine Einheiten gespeichert.</p>
          <p className="text-stone-400 text-xs mt-1">Tippe auf „Eintragen" um zu starten.</p>
        </div>
      </div>
    )
  }

  // Group sessions by month
  const grouped: Record<string, { label: string; entries: TrainingSession[] }> = {}
  for (const s of sessions) {
    const key = monthKey(s.date)
    if (!grouped[key]) grouped[key] = { label: monthLabel(s.date), entries: [] }
    grouped[key].entries.push(s)
  }
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-stone-800">Trainingstagebuch</h1>
        <p className="text-sm text-stone-500 mt-0.5">{sessions.length} Einheit{sessions.length !== 1 ? 'en' : ''} gespeichert</p>
      </div>

      {months.map(month => (
        <div key={month}>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2 capitalize">
            {grouped[month].label}
          </p>
          <div className="flex flex-col gap-2">
            {grouped[month].entries.map(session => {
              const parentEntries = session.entries.filter(e => !allExerciseMap[e.exerciseId]?.parentId)
              const subEntries = session.entries.filter(e => allExerciseMap[e.exerciseId]?.parentId)
              return (
                <div key={session.id} className="bg-white rounded-xl border border-stone-100 px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-800">{formatDate(session.date)}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        (session.sport ?? 'bh') === 'ro'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {(session.sport ?? 'bh') === 'ro' ? 'RO' : 'BH'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-400">
                        {(session.sport ?? 'bh') === 'ro'
                          ? `${session.roEntries?.length ?? 0} Schilder`
                          : `${session.entries.length} Übung${session.entries.length !== 1 ? 'en' : ''}`
                        }
                      </span>
                      {confirmId === session.id ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { onDeleteSession(session.id); setConfirmId(null) }}
                            className="text-xs text-red-500 font-medium active:text-red-700"
                          >
                            Löschen
                          </button>
                          <span className="text-stone-200">|</span>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs text-stone-400 active:text-stone-600"
                          >
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(session.id)}
                          className="text-stone-300 text-sm active:text-red-400 transition-colors"
                          aria-label="Einheit löschen"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* RO session: show signs */}
                  {(session.sport ?? 'bh') === 'ro' && session.roEntries && session.roEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {session.roEntries.map(e => {
                        const sign = roSignMap[e.signId]
                        return (
                          <span
                            key={e.signId}
                            className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full"
                          >
                            {sign ? `${sign.number} ${sign.name}` : e.signId}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {/* BH session: parent-level exercises */}
                  {(session.sport ?? 'bh') === 'bh' && parentEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {parentEntries.map(e => (
                        <span
                          key={e.exerciseId}
                          className="text-xs bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-full"
                        >
                          {exerciseName(e.exerciseId)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* BH session: sub-exercises */}
                  {(session.sport ?? 'bh') === 'bh' && subEntries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {subEntries.map(e => (
                        <span
                          key={e.exerciseId}
                          className="text-xs bg-stone-50 text-stone-500 border border-stone-100 px-2 py-0.5 rounded-full"
                        >
                          {exerciseName(e.exerciseId)}
                        </span>
                      ))}
                    </div>
                  )}

                  {session.generalNote && (
                    <p className="text-xs text-stone-400 italic mt-1">„{session.generalNote}"</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
