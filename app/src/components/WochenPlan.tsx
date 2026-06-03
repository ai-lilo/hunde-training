import { useState, useMemo } from 'react'
import type { Exercise, ExerciseStatus, TrainingSession } from '../data/types'
import { getSuggestions } from '../data/progression'
import { LevelBadge } from './LevelBadge'

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  sessions: TrainingSession[]
  onLogSession: () => void
}

export function WochenPlan({ statuses, allExercises, sessions, onLogSession }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const weekSuggestions = useMemo(() => {
    const now = Date.now()
    const sevenDays = 7 * 24 * 60 * 60 * 1000

    // Letzte Trainingszeit pro Übung
    const lastPracticed: Record<string, number> = {}
    for (const s of sessions) {
      const sessionTime = new Date(s.date).getTime()
      for (const e of s.entries) {
        if (!lastPracticed[e.exerciseId] || lastPracticed[e.exerciseId] < sessionTime) {
          lastPracticed[e.exerciseId] = sessionTime
        }
      }
    }

    const suggestions = getSuggestions(statuses, allExercises)

    // Priorisiere: kritisch/hoch zuerst, dann länger nicht geübt
    return suggestions
      .sort((a, b) => {
        const pOrder = { kritisch: 0, hoch: 1, mittel: 2 }
        const pd = pOrder[a.priority] - pOrder[b.priority]
        if (pd !== 0) return pd
        const aLast = lastPracticed[a.exercise.id] ?? 0
        const bLast = lastPracticed[b.exercise.id] ?? 0
        return aLast - bLast  // länger nicht geübt = weiter vorne
      })
      .filter(s => {
        const last = lastPracticed[s.exercise.id] ?? 0
        // Kritische immer zeigen, andere nur wenn >7 Tage oder nie geübt
        return s.priority === 'kritisch' || (now - last) > sevenDays || last === 0
      })
      .slice(0, 5)
  }, [statuses, allExercises, sessions])

  if (weekSuggestions.length === 0) return null

  const allChecked = weekSuggestions.every(s => checked.has(s.exercise.id))

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-stone-800">Diese Woche üben</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {checked.size}/{weekSuggestions.length} erledigt
          </p>
        </div>
        {allChecked && (
          <span className="text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            ✓ Woche geschafft!
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {weekSuggestions.map(s => {
          const isChecked = checked.has(s.exercise.id)
          return (
            <button
              key={s.exercise.id}
              onClick={() => setChecked(prev => {
                const next = new Set(prev)
                if (next.has(s.exercise.id)) next.delete(s.exercise.id)
                else next.add(s.exercise.id)
                return next
              })}
              className={`flex items-center gap-3 text-left py-2 px-1 rounded-xl transition-colors ${isChecked ? 'opacity-50' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                isChecked ? 'bg-green-500 border-green-500' : 'border-stone-300'
              }`}>
                {isChecked && <span className="text-white text-xs font-bold leading-none">✓</span>}
              </span>
              <span className={`text-sm font-medium flex-1 min-w-0 truncate ${isChecked ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                {s.exercise.name}
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                s.priority === 'kritisch' ? 'bg-red-100 text-red-700' :
                s.priority === 'hoch' ? 'bg-orange-100 text-orange-700' :
                'bg-stone-100 text-stone-500'
              }`}>
                {s.priority === 'kritisch' ? '!' : s.priority === 'hoch' ? '↑' : '→'}
              </span>
              <LevelBadge level={s.currentLevel} />
            </button>
          )
        })}
      </div>

      <button
        onClick={onLogSession}
        className="mt-3 w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl active:scale-95 transition-transform"
      >
        Einheit starten →
      </button>
    </div>
  )
}
