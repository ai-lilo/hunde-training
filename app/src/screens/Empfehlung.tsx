import type { Exercise, ExerciseStatus } from '../data/types'
import { getSuggestions } from '../data/progression'
import type { Suggestion } from '../data/progression'
import { LevelBadge } from '../components/LevelBadge'

interface Props {
  statuses: ExerciseStatus[]
  allExercises: Exercise[]
  onLogSession: () => void
}

const PRIORITY_CONFIG = {
  kritisch: { label: 'Kritisch', bg: 'bg-red-50', border: 'border-red-100', badge: 'bg-red-100 text-red-700', icon: '🚨' },
  hoch:     { label: 'Hoch',     bg: 'bg-orange-50', border: 'border-orange-100', badge: 'bg-orange-100 text-orange-700', icon: '↑' },
  mittel:   { label: 'Mittel',   bg: 'bg-stone-50', border: 'border-stone-100', badge: 'bg-stone-100 text-stone-600', icon: '→' },
}

const CATEGORY_LABEL: Record<string, string> = {
  grundlage: 'Grundlage',
  unterordnung: 'Unterordnung',
  verkehr: 'Verkehrsteil',
}

export function Empfehlung({ statuses, allExercises, onLogSession }: Props) {
  const suggestions = getSuggestions(statuses, allExercises)
  const kritisch = suggestions.filter(s => s.priority === 'kritisch')
  const hoch = suggestions.filter(s => s.priority === 'hoch')
  const mittel = suggestions.filter(s => s.priority === 'mittel')

  const groups = [
    { key: 'kritisch' as const, items: kritisch },
    { key: 'hoch' as const, items: hoch },
    { key: 'mittel' as const, items: mittel },
  ].filter(g => g.items.length > 0)

  const allDone = suggestions.length === 0

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Was heute?</h1>
          <p className="text-sm text-stone-500 mt-0.5">Empfohlene Übungen basierend auf Arís Fortschritt</p>
        </div>
        <button
          onClick={onLogSession}
          className="mt-1 px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-xl active:scale-95 transition-transform"
        >
          + Einheit
        </button>
      </div>

      {allDone && (
        <div className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-lg font-semibold text-emerald-800">Alle Übungen prüfungsreif!</p>
          <p className="text-sm text-emerald-600 mt-1">Ari ist bereit für die BH-Prüfung.</p>
        </div>
      )}

      {groups.map(({ key, items }) => {
        const cfg = PRIORITY_CONFIG[key]
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.icon} {cfg.label}
              </span>
              <span className="text-xs text-stone-400">{items.length} Übung{items.length !== 1 ? 'en' : ''}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map(s => (
                <SuggestionCard key={s.exercise.id} suggestion={s} />
              ))}
            </div>
          </div>
        )
      })}

      {/* Hinweis */}
      <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 text-xs text-stone-400 leading-relaxed">
        Die Reihenfolge basiert auf dem BH-Curriculum: Voraussetzungen werden zuerst empfohlen.
        Sobald du eine Einheit einträgst, passt sich die Liste automatisch an.
      </div>
    </div>
  )
}

function SuggestionCard({ suggestion: s }: { suggestion: Suggestion }) {
  return (
    <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-stone-400">{CATEGORY_LABEL[s.exercise.category]}</span>
              {s.exercise.bh_required && (
                <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">BH</span>
              )}
            </div>
            <p className="text-sm font-semibold text-stone-800">{s.exercise.name}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LevelBadge level={s.currentLevel} />
            <span className="text-stone-300 text-xs">→</span>
            <LevelBadge level={s.targetLevel} />
          </div>
        </div>

        <p className="text-xs text-stone-500 mt-2 leading-relaxed">{s.reason}</p>
      </div>

      <div className="bg-amber-50 px-4 py-2.5 border-t border-amber-100">
        <p className="text-xs font-medium text-amber-700">Kriterium für "{s.targetLevel}"</p>
        <p className="text-xs text-amber-600 mt-0.5">{s.exercise.criteria[s.targetLevel]}</p>
      </div>
    </div>
  )
}
