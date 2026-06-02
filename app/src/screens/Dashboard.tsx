import { useMemo } from 'react'
import type { Exercise, ExerciseStatus, TrainingSession } from '../data/types'
import { getBhProgress, getStatusMap, getSuggestions, levelIndex } from '../data/progression'
import { LevelBadge } from '../components/LevelBadge'
import { WochenPlan } from '../components/WochenPlan'
import type { RecentSave } from '../App'
import type { Dog } from '../hooks/useDogs'

interface Props {
  dog: Dog
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  sessions: TrainingSession[]
  recentSave: RecentSave[] | null
  onDismissRecentSave: () => void
  onNavigate: (screen: string) => void
}

const CATEGORY_LABEL: Record<string, string> = {
  grundlage: 'Grundlagen',
  unterordnung: 'Unterordnung',
  verkehr: 'Verkehrsteil',
  pruefung: 'Prüfungsablauf',
  sport: 'Sport',
}

const RATING_EMOJI: Record<1 | 2 | 3, string> = { 1: '😕', 2: '🙂', 3: '😄' }

export function Dashboard({ dog, statuses, allExercises, sessions, recentSave, onDismissRecentSave, onNavigate }: Props) {
  const exerciseMap = useMemo(() => Object.fromEntries(allExercises.map(e => [e.id, e])), [allExercises])
  const { done, total, percent } = getBhProgress(statuses, allExercises)
  const map = getStatusMap(statuses, allExercises)
  const topSuggestions = getSuggestions(statuses, allExercises).slice(0, 2)

  const categories = ['grundlage', 'unterordnung', 'verkehr', 'pruefung', 'sport'] as const
  const levelUps = recentSave?.filter(s => levelIndex(s.levelAfter) > levelIndex(s.levelBefore)) ?? []

  return (
    <div className="flex flex-col gap-5 p-4 pb-28 animate-fadein">
      {/* Header — persönlich und warm */}
      <div className="pt-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
          🐾
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-800 leading-tight">{dog.name}</h1>
          <p className="text-sm text-stone-500">
            {[dog.breed, 'Begleithundeprüfung'].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* ── Gerade gespeichert ── */}
      {recentSave && (
        <div className="bg-green-50 rounded-2xl border border-green-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-lg">✓</span>
              <span className="text-sm font-semibold text-green-800">
                {recentSave.length} Übung{recentSave.length !== 1 ? 'en' : ''} gespeichert
              </span>
            </div>
            <button
              onClick={onDismissRecentSave}
              className="text-green-400 text-lg leading-none px-1"
            >
              ×
            </button>
          </div>

          {levelUps.length > 0 && (
            <div className="mx-4 mb-3 bg-green-100 rounded-xl px-3 py-2.5">
              <p className="text-xs font-semibold text-green-700 mb-2">Level up! 🎉</p>
              <div className="flex flex-col gap-1.5">
                {levelUps.map(s => (
                  <div key={s.exerciseId} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-900 flex-1">
                      {exerciseMap[s.exerciseId]?.name ?? s.exerciseId}
                    </span>
                    <LevelBadge level={s.levelBefore} />
                    <span className="text-green-500 text-xs font-bold">→</span>
                    <LevelBadge level={s.levelAfter} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 pb-4 flex flex-col gap-1.5">
            {recentSave
              .filter(s => levelIndex(s.levelAfter) === levelIndex(s.levelBefore))
              .map(s => (
                <div key={s.exerciseId} className="flex items-center justify-between">
                  <span className="text-sm text-green-800">
                    {exerciseMap[s.exerciseId]?.name ?? s.exerciseId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{RATING_EMOJI[s.rating]}</span>
                    <LevelBadge level={s.levelAfter} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* BH Progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-stone-700">BH-Fortschritt</span>
          <span className="text-sm font-semibold text-amber-600">{done}/{total}</span>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-stone-400 mt-1.5">{percent}% der Übungen prüfungsreif</p>
      </div>

      {/* Smarte Wochenplanung */}
      <WochenPlan
        statuses={statuses}
        allExercises={allExercises}
        sessions={sessions}
        onLogSession={() => onNavigate('einheit')}
      />

      {/* Top suggestions */}
      {topSuggestions.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
          <p className="text-sm font-semibold text-amber-800 mb-3">Als nächstes üben</p>
          <div className="flex flex-col gap-2">
            {topSuggestions.map(s => (
              <button
                key={s.exercise.id}
                onClick={() => onNavigate('empfehlung')}
                className="flex items-start gap-3 text-left"
              >
                <span className={`mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                  s.priority === 'kritisch' ? 'bg-red-100 text-red-700' :
                  s.priority === 'hoch'     ? 'bg-orange-100 text-orange-700' :
                                              'bg-stone-100 text-stone-600'
                }`}>
                  {s.priority === 'kritisch' ? '!' : s.priority === 'hoch' ? '↑' : '→'}
                </span>
                <div>
                  <p className="text-sm font-medium text-stone-800">{s.exercise.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{s.exercise.criteria[s.targetLevel]}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => onNavigate('empfehlung')}
            className="mt-3 text-xs text-amber-700 font-medium"
          >
            Alle Empfehlungen →
          </button>
        </div>
      )}

      {/* Exercise overview by category */}
      {categories.map(cat => {
        const exercises = allExercises.filter(e => e.category === cat && !e.parentId)
        if (exercises.length === 0) return null
        return (
          <div key={cat} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
              {CATEGORY_LABEL[cat]}
            </p>
            <div className="flex flex-col gap-2">
              {exercises.map(e => {
                const justChanged = recentSave?.some(
                  s => s.exerciseId === e.id && levelIndex(s.levelAfter) > levelIndex(s.levelBefore)
                )
                return (
                  <button
                    key={e.id}
                    onClick={() => onNavigate('fortschritt')}
                    className="flex items-center justify-between"
                  >
                    <span className={`text-sm ${justChanged ? 'text-green-700 font-semibold' : 'text-stone-700'}`}>
                      {e.name}
                      {justChanged && <span className="ml-1 text-xs text-green-500">↑</span>}
                    </span>
                    <LevelBadge level={map[e.id] ?? 'nicht_begonnen'} />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Trainingseinheit starten */}
      <button
        onClick={() => onNavigate('einheit')}
        className="w-full py-3.5 bg-amber-600 text-white text-sm font-semibold rounded-2xl shadow-sm active:scale-95 transition-transform"
      >
        + Neue Trainingseinheit
      </button>
    </div>
  )
}
