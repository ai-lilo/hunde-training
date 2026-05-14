import { useState } from 'react'
import type { Level, ROClass, ROSignStatus, TrainingSession } from '../data/types'
import { RO_SIGNS } from '../data/ro-signs'
import { LevelBadge } from '../components/LevelBadge'
import { ROAuswertung } from '../components/ROAuswertung'

const LEVELS: Level[] = ['nicht_begonnen', 'aufbau', 'basis', 'stabil', 'pruefungsreif']
const LEVEL_LABELS: Record<Level, string> = {
  nicht_begonnen: 'Nicht begonnen',
  aufbau: 'Aufbau',
  basis: 'Basis',
  stabil: 'Stabil',
  pruefungsreif: 'Prüfungsreif',
}

const CLASS_TABS: { cls: ROClass; label: string; full: string }[] = [
  { cls: 'beginner', label: 'Beginner', full: 'Beginner' },
  { cls: 'klasse1',  label: 'K1',       full: 'Klasse 1' },
  { cls: 'klasse2',  label: 'K2',       full: 'Klasse 2' },
  { cls: 'klasse3',  label: 'K3',       full: 'Klasse 3' },
]

function getClassSigns(cls: ROClass) {
  if (cls === 'beginner') return RO_SIGNS.filter(s => s.classes.includes('beginner'))
  if (cls === 'klasse1')  return RO_SIGNS.filter(s => s.classes.includes('klasse1') && !s.classes.includes('beginner'))
  if (cls === 'klasse2')  return RO_SIGNS.filter(s => s.classes.includes('klasse2') && !s.classes.includes('klasse1'))
  return RO_SIGNS.filter(s => s.classes.includes('klasse3') && !s.classes.includes('klasse2'))
}

interface Props {
  roSignStatuses: ROSignStatus[]
  sessions: TrainingSession[]
  onSetLevel: (signId: string, level: Level) => void
  onNavigateToEinheit: () => void
}

export function ROFortschritt({ roSignStatuses, sessions, onSetLevel, onNavigateToEinheit }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeClass, setActiveClass] = useState<ROClass>('beginner')

  const statusMap = Object.fromEntries(roSignStatuses.map(s => [s.signId, s.level]))
  const classSigns = getClassSigns(activeClass)
  const tab = CLASS_TABS.find(t => t.cls === activeClass)!

  const counts: Record<Level, number> = {
    nicht_begonnen: 0, aufbau: 0, basis: 0, stabil: 0, pruefungsreif: 0,
  }
  for (const sign of classSigns) {
    const lvl = statusMap[sign.id] ?? 'nicht_begonnen'
    counts[lvl]++
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="pt-2">
        <h1 className="text-2xl font-bold text-stone-800">RO Schilder</h1>
        <p className="text-sm text-stone-500 mt-0.5">{tab.full} · {classSigns.length} Schilder</p>
      </div>

      <ROAuswertung sessions={sessions} roSignStatuses={roSignStatuses} />

      {/* Class tabs */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
        {CLASS_TABS.map(t => (
          <button
            key={t.cls}
            onClick={() => { setActiveClass(t.cls); setEditingId(null) }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeClass === t.cls
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-stone-500 active:bg-stone-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Progress summary */}
      <div className="grid grid-cols-4 gap-2">
        {LEVELS.filter(l => l !== 'nicht_begonnen').map(lvl => (
          <div key={lvl} className="bg-white rounded-xl border border-stone-100 p-3 text-center">
            <div className="text-xl font-bold text-stone-800">{counts[lvl]}</div>
            <div className="text-xs text-stone-400 mt-0.5">{LEVEL_LABELS[lvl]}</div>
          </div>
        ))}
      </div>

      {/* Sign list */}
      <div className="flex flex-col gap-2">
        {classSigns.map(sign => {
          const currentLevel: Level = statusMap[sign.id] ?? 'nicht_begonnen'
          const isEditing = editingId === sign.id

          return (
            <div
              key={sign.id}
              className="bg-white rounded-xl border border-stone-100 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-400">{sign.number}</span>
                    <span className="text-sm font-semibold text-stone-800">{sign.name}</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 leading-snug">{sign.hauptbestandteil}</p>
                </div>
                <button
                  onClick={() => setEditingId(isEditing ? null : sign.id)}
                  className="flex-shrink-0 mt-0.5"
                >
                  <LevelBadge level={currentLevel} />
                </button>
              </div>

              {isEditing && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => {
                        onSetLevel(sign.id, lvl)
                        setEditingId(null)
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        currentLevel === lvl
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-stone-50 text-stone-600 border-stone-200 active:bg-stone-100'
                      }`}
                    >
                      {LEVEL_LABELS[lvl]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={onNavigateToEinheit}
        className="fixed bottom-20 right-4 w-14 h-14 bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl active:scale-95 transition-transform"
      >
        +
      </button>
    </div>
  )
}
