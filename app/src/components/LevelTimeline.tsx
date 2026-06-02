import { memo } from 'react'
import type { LevelHistoryEntry } from '../hooks/useExerciseLevelHistory'
import { LEVEL_LABEL } from '../data/labels'

export const LevelTimeline = memo(function LevelTimeline({ history }: { history: LevelHistoryEntry[] }) {
  if (history.length === 0) return null
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-stone-400 mb-0.5">Lernkurve</p>
      <div className="flex flex-col gap-1.5 pl-1">
        {history.map((entry, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
              {i < history.length - 1 && <div className="w-px h-3 bg-teal-200" />}
            </div>
            <span className="text-xs text-stone-700 font-medium">{LEVEL_LABEL[entry.level]}</span>
            <span className="text-xs text-stone-400 ml-auto">
              {new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})
